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
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {  Runtime } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Effect,  PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

const dotenv = require('dotenv');
import * as path from 'path';
import { SchedularApiStackProps } from './types/SchedularStackProps';

dotenv.config();

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SchedularApiStackProps) {
    super(scope, id, props);

    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.params.userPoolId);
    const dataTable = Table.fromTableArn(this, 'table', props.params.dataTableArn);
    const queue = Queue.fromQueueArn(this, 'queue', props.params.queueArn);

    // Resolver for Cognito user service
    const userServiceFunction = new NodejsFunction(this, 'userService', {
      functionName: `${props.appName}-${props.envName}-userService`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.resolve(__dirname, '../src/lambda/userService/main.ts'),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        REGION: this.region,
        USER_POOL_ID: userPool.userPoolId,
      },
    });
    userServiceFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-idp:ListUsersInGroup', 'cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRemoveUserFromGroup'],
        resources: [userPool.userPoolArn],
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
    const userServiceLambdaDataSource = api.addLambdaDataSource('upsertAppointmentsDataSource', userServiceFunction, {
      name: 'userServiceLambdaDataSource',
    });
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

    queue.grantSendMessages(httpDataSource.grantPrincipal);

    // AppSync JS Resolvers
    const getAvailableAppointmentsFunction = new AppsyncFunction(this, 'getAvailableAppointmentsFunction', {
      name: 'getAvailableAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAvailableAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentFunction = new AppsyncFunction(this, 'getAppointmentFunction', {
      name: 'getAppointmentFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointment.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentsFunction = new AppsyncFunction(this, 'getAppointmentsFunction', {
      name: 'getAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingFunction = new AppsyncFunction(this, 'getBookingFunction', {
      name: 'getBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingsFunction = new AppsyncFunction(this, 'getBookingsFunction', {
      name: 'getBookingsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBookings.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getUserBookingsFunction = new AppsyncFunction(this, 'getUserBookingsFunction', {
      name: 'getUserBookingsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getUserBookings.js')),
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
            resourcePath: '/${this.account}/${queue.queueName}/',
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
    userServiceLambdaDataSource.createResolver(`${props.appName}-${props.envName}-listUsersInGroupResolver`, {
      typeName: 'Query',
      fieldName: 'listUsersInGroup',
    });
    userServiceLambdaDataSource.createResolver(`${props.appName}-${props.envName}-addUserToGroupResolver`, {
      typeName: 'Mutation',
      fieldName: 'addUserToGroup',
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
      pipelineConfig: [getAvailableAppointmentsFunction],
      code: passthrough,
    });
    const getAppointmentResolver = new Resolver(this, 'getAppointmentResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointment',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentFunction],
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
    const getUserBookingsResolver = new Resolver(this, 'getUserBookingsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getUserBookings',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getUserBookingsFunction],
      code: passthrough,
    });
    const createBookingResolver = new Resolver(this, 'createBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'createBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createBookingFunction, getBookingFunction, sqsSendEMailFunction],
      code: passthrough,
    });
    const cancelBookingResolver = new Resolver(this, 'cancelBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'cancelBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [cancelBookingFunction, getBookingFunction, sqsSendEMailFunction],
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

    new CfnOutput(this, 'AppSyncGraphqlEndpoint', {
      value: api.graphqlUrl,
      exportName: `${props.appName}-${props.envName}-graphqlUrl`,
    });
  }
}
