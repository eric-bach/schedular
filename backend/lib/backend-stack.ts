import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  UserPool,
  CfnUserPoolGroup,
  UserPoolClient,
  AccountRecovery,
  UserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import {
  AuthorizationType,
  FieldLogLevel,
  GraphqlApi,
  SchemaFile,
} from 'aws-cdk-lib/aws-appsync';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const dotenv = require('dotenv');
import * as path from 'path';

dotenv.config();

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const REGION = Stack.of(this).region;

    /***
     *** AWS Cognito
     ***/

    // Cognito user pool
    const userPool = new UserPool(this, 'MyAppUserPool', {
      userPoolName: 'myappuserpool',
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        username: false,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },

      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Cognito user pool group
    new CfnUserPoolGroup(this, 'MyAppAdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Admins',
      description: 'App Administrators',
    });

    new CfnUserPoolGroup(this, 'MyAppUserGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Users',
      description: 'App Users',
    });

    // Cognito user pool domain
    new UserPoolDomain(this, 'MyAppUserPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: `my-app-dev`,
      },
    });

    // Cognito user client
    const userPoolClient = new UserPoolClient(this, 'MyAppUserClient', {
      userPoolClientName: `my_app_user_client`,
      accessTokenValidity: Duration.hours(8),
      idTokenValidity: Duration.hours(8),
      userPool,
    });

    /***
     *** AWS DynamoDB
     ***/

    const dataTable = new Table(this, 'Data', {
      tableName: `myapp-Data`,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    // GSIs for Data Table
    dataTable.addGlobalSecondaryIndex({
      indexName: 'customer-gsi',
      partitionKey: {
        name: 'customer',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
    });

    /***
     *** AWS AppSync
     ***/

    const api = new GraphqlApi(this, 'PecuniaryApi', {
      name: `myapp-api`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: SchemaFile.fromAsset(
        path.join(__dirname, './graphql/schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
    });

    /***
     *** AWS AppSync resolvers - AWS Lambda
     ***/

    // Resolver for Calendar
    const calendarResolverFunction = new NodejsFunction(
      this,
      'CalendarResolver',
      {
        functionName: `myapp-CalendarResolver`,
        runtime: Runtime.NODEJS_14_X,
        handler: 'handler',
        entry: path.resolve(
          __dirname,
          '../src/lambda/calendarResolver/main.ts'
        ),
        memorySize: 512,
        timeout: Duration.seconds(10),
        environment: {
          DATA_TABLE_NAME: dataTable.tableName,
          REGION: REGION,
        },
        //deadLetterQueue: commandHandlerQueue,
      }
    );
    // Add permissions to DynamoDB table
    calendarResolverFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [
          dataTable.tableArn,
          dataTable.tableArn + '/index/customer-gsi',
        ],
      })
    );
    // Set the new Lambda function as a data source for the AppSync API
    const calendarResolverDataSource = api.addLambdaDataSource(
      'calendarDataSource',
      calendarResolverFunction
    );
    // Resolvers
    calendarResolverDataSource.createResolver(
      'GetAvailableAppointmentsResolver',
      {
        typeName: 'Query',
        fieldName: 'getAvailableAppointments',
      }
    );
    calendarResolverDataSource.createResolver(
      'GetScheduledAppointmentsResolver',
      {
        typeName: 'Query',
        fieldName: 'getScheduledAppointments',
      }
    );
  }
}
