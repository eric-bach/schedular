import { Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  AppsyncFunction,
  AuthorizationType,
  Code,
  DynamoDbDataSource,
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
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

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
    const emailQueue = new Queue(this, `${props.appName}-${props.envName}-emailDelivery`, {
      queueName: `${props.appName}-${props.envName}-emailDelivery`,
      retentionPeriod: Duration.minutes(1),
      // TODO Remove in Prod
      deadLetterQueue: {
        queue: new Queue(this, `${props.appName}-${props.envName}-sendEmailDeadLetter`, {
          queueName: `${props.appName}-${props.envName}-sendEmailDeadLetter`,
        }),
        maxReceiveCount: 1,
      },
    });

    // Lambdas
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `${props.appName}-${props.envName}-send-email`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmail/main.ts',
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'info@example.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailConsumerRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaSQSQueueExecutionRole'),
        ],
      }),
    });
    // Add permission send email
    sendEmailFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail'],
        resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
      })
    );
    // Event Source Mapping to SQS
    new EventSourceMapping(this, 'SendEmailSQSEvent', {
      target: sendEmailFunction,
      batchSize: 10,
      eventSourceArn: emailQueue.queueArn,
    });

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
    const dynamoDbDataSource = new DynamoDbDataSource(this, `dynamoDBDataSource`, {
      api: api,
      table: dataTable,
      description: 'DynamoDbDataSource',
      name: 'dynamoDBDataSource',
      serviceRole: new Role(this, `${props.appName}ApiServiceRole`, {
        assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        roleName: `${props.appName}-dynamoDb-service-role-${props.envName}`,
        inlinePolicies: {
          name: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:ConditionCheckItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:DescribeTable',
                  'dynamodb:GetItem',
                  'dynamodb:GetRecords',
                  'dynamodb:GetShardIterator',
                  'dynamodb:PutItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                  'dynamodb:UpdateItem',
                ],
                resources: [dataTable.tableArn + '/*'],
              }),
            ],
          }),
        },
      }),
    });
    const httpDataSource = api.addHttpDataSource('httpDataSource', `https://sqs.${this.region}.amazonaws.com`, {
      name: 'httpDataSource',
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 'sqs',
      },
    });

    emailQueue.grantSendMessages(httpDataSource.grantPrincipal);

    // AppSync JS Resolvers
    const getAvailableAppointmentsFunc = new AppsyncFunction(this, 'getAvailableAppointmentsFunction', {
      name: 'getAvailableAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAvailableAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentFunc = new AppsyncFunction(this, 'getAppointmentFunction', {
      name: 'getAppointmentFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointment.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingFunc = new AppsyncFunction(this, 'getBookingFunction', {
      name: 'getBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentsFunction = new AppsyncFunction(this, 'getAppointmentsFunction', {
      name: 'getAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingsFunction = new AppsyncFunction(this, 'getBookingsFunction', {
      name: 'getBookingsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBookings.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const createBookingFunction = new AppsyncFunction(this, 'createBookingFunction', {
      name: 'createBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.createBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const cancelBookingFunction = new AppsyncFunction(this, 'cancelBookingFunction', {
      name: 'cancelBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.cancelBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const sqsSendEMailFunction = new AppsyncFunction(this, 'SqsSendEmailFunction', {
      name: 'sqsSendEmail',
      api: api,
      dataSource: httpDataSource,
      // Have to use inline code to set dynamic resourcePath
      code: Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
          console.log('🔔 SqsSendEmailFunction Request:', ctx);

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
            resourcePath: '/${this.account}/${emailQueue.queueName}/',
          };
        }

        export function response(ctx) {
          console.log('🔔 SqsSendEmailFunction Response:', ctx);

          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type, ctx.result);
          }
          return ctx.prev.result;
        }
      `),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const upsertAppointmentsFunction = new AppsyncFunction(this, 'upsertAppointmentsFunction', {
      name: 'upsertAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.createAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const deleteAppointmentsFunction = new AppsyncFunction(this, 'deleteAppointmentsFunction', {
      name: 'deleteAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.deleteAppointments.js')),
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
    const getAppointmentResolver = new Resolver(this, 'getAppointmentResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointment',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentFunc],
      code: passthrough,
    });
    const getAppointmentsResolver = new Resolver(this, 'getAppointmentsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentsFunction],
      code: passthrough,
    });
    const getBookingsResolver = new Resolver(this, 'getBookingsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getBookings',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getBookingsFunction],
      code: passthrough,
    });
    const createBookingResolver = new Resolver(this, 'createBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'createBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createBookingFunction, getBookingFunc, sqsSendEMailFunction],
      code: passthrough,
    });
    const cancelBookingResolver = new Resolver(this, 'cancelBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'cancelBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [cancelBookingFunction, getBookingFunc, sqsSendEMailFunction],
      code: passthrough,
    });
    const upsertDeleteAppointmentsResolver = new Resolver(this, 'upsertDeleteAppointmentsResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'upsertDeleteAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [upsertAppointmentsFunction, deleteAppointmentsFunction],
      code: passthrough,
    });

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'VerifiedEmailIdentity', {
      value: emailIdentity.emailIdentityName,
      exportName: `${props.appName}-${props.envName}-emailIdentity`,
    });

    new CfnOutput(this, 'EmailQueueArn', {
      value: emailQueue.queueArn,
      exportName: `${props.appName}-${props.envName}-emailQueueArn`,
    });

    new CfnOutput(this, 'SendEmailFunctionArn', {
      value: sendEmailFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendEmailFunctionArn`,
    });

    new CfnOutput(this, 'AppSyncGraphqlEndpoint', {
      value: api.graphqlUrl,
      exportName: `${props.appName}-${props.envName}-graphqlUrl`,
    });
  }
}
