import { Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  AppsyncFunction,
  AuthorizationType,
  Code,
  FieldLogLevel,
  FunctionRuntime,
  GraphqlApi,
  InlineCode,
  Resolver,
  SchemaFile,
} from 'aws-cdk-lib/aws-appsync';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventSourceMapping, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

const dotenv = require('dotenv');
import * as path from 'path';
import { SchedularApiStackProps } from './types/SchedularStackProps';

dotenv.config();

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SchedularApiStackProps) {
    super(scope, id, props);

    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.params.userPoolId);
    const dataTable = Table.fromTableArn(this, 'table', props.params.dataTableArn);

    // SES
    const emailIdentity = new EmailIdentity(this, 'Identity', {
      identity: { value: process.env.SENDER_EMAIL || 'info@example.com' },
    });

    // SQS
    const queue = new Queue(this, `${props.appName}-${props.envName}-queue`, {
      queueName: `${props.appName}-${props.envName}-queue`,
    });

    // Lambda
    const queueConsumerFunction = new NodejsFunction(this, 'QueueConsumerFunction', {
      functionName: `${props.appName}-${props.envName}-queue-consumer`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/queueConsumer/main.ts',
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'QueueConsumerFunctionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaSQSQueueExecutionRole'),
        ],
      }),
    });
    const eventSourceMapping = new EventSourceMapping(this, 'QueueConsumerFunctionMySQSEvent', {
      target: queueConsumerFunction,
      batchSize: 10,
      eventSourceArn: queue.queueArn,
    });
    // Add permission send email
    queueConsumerFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail'],
        resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
      })
    );

    // AppSync API
    const api = new GraphqlApi(this, `${props.appName}Api`, {
      name: `${props.appName}-${props.envName}-api`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: SchemaFile.fromAsset(path.join(__dirname, './graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
    });

    // AppSync DataSources
    const dynamoDbDataSource = api.addDynamoDbDataSource(`${props.appName}-${props.envName}-table`, dataTable);
    const httpDataSource = api.addHttpDataSource(`${props.appName}-${props.envName}-endpoint`, `https://sqs.${this.region}.amazonaws.com`, {
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 'sqs',
      },
    });

    queue.grantSendMessages(httpDataSource.grantPrincipal);

    // AppSync JS Resolvers
    const getAvailableAppointmentsFunc = new AppsyncFunction(this, 'getAvailableAppointmentsFunction', {
      name: 'getAvailableAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAvailableAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentsFunc = new AppsyncFunction(this, 'getAppointmentsFunction', {
      name: 'getAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const bookAppointmentFunc = new AppsyncFunction(this, 'bookAppointmentFunction', {
      name: 'bookAppointmentFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.bookAppointment.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const sqsEmailFunc = new AppsyncFunction(this, 'sqsEmailFunc', {
      name: 'sqsEmailFunc',
      api: api,
      dataSource: httpDataSource,
      // Have to use inline code to set dynamic resourcePath
      code: Code.fromInline(`
        import { util } from '@aws-appsync/utils';
        
        export function request(ctx) {
          console.log('🔔 REQUEST: ', ctx);
        
          const message = util.urlEncode(ctx.prev.result);
          return {
            version: '2018-05-29',
            method: 'POST',
            params: {
              body: \`Action=SendMessage&MessageBody=$\{message\}&Version=2012-11-05\`,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
            resourcePath: '/${this.account}/${queue.queueName}/',
          };
        }
        
        export function response(ctx) {
          console.log('🔔 RESPONSE: ', ctx);
        
          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type, ctx.result);
          }
          return ctx.prev.result;
        }
      `),
      runtime: FunctionRuntime.JS_1_0_0,
    });

    const passthrough = InlineCode.fromInline(`
        // The before step
        export function request(...args) {
          console.log("ℹ️ Request: ", args);
          return {}
        }

        // The after step
        export function response(ctx) {
          console.log("✅ Response: ", ctx.prev.result);
          return ctx.prev.result
        }
    `);

    const getAvailableAppointmentsResolver = new Resolver(this, 'getAvailableAppointmentsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAvailableAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAvailableAppointmentsFunc],
      code: passthrough,
    });
    const getAppointmentsResolver = new Resolver(this, 'getAppointmentsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentsFunc],
      code: passthrough,
    });
    const bookAppopintmentResolver = new Resolver(this, 'bookAppointmentResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'bookAppointment',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [bookAppointmentFunc, sqsEmailFunc],
      code: passthrough,
    });

    // // Resolver for Calendar
    // const calendarResolverFunction = new NodejsFunction(this, 'CalendarResolver', {
    //   functionName: `${props.appName}-${props.envName}-CalendarResolver`,
    //   runtime: Runtime.NODEJS_14_X,
    //   handler: 'handler',
    //   entry: path.resolve(__dirname, '../src/lambda/calendarResolver/main.ts'),
    //   memorySize: 512,
    //   timeout: Duration.seconds(10),
    //   environment: {
    //     DATA_TABLE_NAME: dataTable.tableName,
    //     REGION: REGION,
    //   },
    //   //deadLetterQueue: commandHandlerQueue,
    // });
    // // Add permissions to DynamoDB table
    // calendarResolverFunction.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
    //     resources: [dataTable.tableArn],
    //   })
    // );
    // calendarResolverFunction.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ['dynamodb:Query'],
    //     resources: [dataTable.tableArn, dataTable.tableArn + '/index/customer-gsi'],
    //   })
    // );
    // // Add persmission to send email
    // calendarResolverFunction.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ['ses:SendRawEmail'],
    //     resources: ['*'],
    //   })
    // );
    // // Set the new Lambda function as a data source for the AppSync API
    // const calendarResolverDataSource = api.addLambdaDataSource('calendarDataSource', calendarResolverFunction);
    // // Resolvers
    // calendarResolverDataSource.createResolver('GetAvailableAppointmentsResolver', {
    //   typeName: 'Query',
    //   fieldName: 'getAvailableAppointments',
    // });
    // calendarResolverDataSource.createResolver('GetScheduledAppointmentsResolver', {
    //   typeName: 'Query',
    //   fieldName: 'getScheduledAppointments',
    // });
    // calendarResolverDataSource.createResolver('BookAppointmentResolver', {
    //   typeName: 'Mutation',
    //   fieldName: 'bookAppointment',
    // });

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'VerifiedEmailIdentity', {
      value: emailIdentity.emailIdentityName,
      exportName: `${props.appName}-${props.envName}-emailIdentity`,
    });

    new CfnOutput(this, 'AppSyncGraphqlEndpoint', {
      value: api.graphqlUrl,
      exportName: `${props.appName}-${props.envName}-graphqlUrl`,
    });
  }
}
