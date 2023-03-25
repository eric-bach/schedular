import { Stack, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { AuthorizationType, FieldLogLevel, GraphqlApi, SchemaFile } from 'aws-cdk-lib/aws-appsync';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';

const dotenv = require('dotenv');
import * as path from 'path';
import { SchedularApiStackProps } from './types/SchedularStackProps';

dotenv.config();

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SchedularApiStackProps) {
    super(scope, id, props);

    const REGION = Stack.of(this).region;
    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.params.userPoolId);
    const dataTable = Table.fromTableArn(this, 'table', props.params.dataTableArn);

    // SES
    const emailIdentity = new EmailIdentity(this, 'Identity', {
      identity: { value: process.env.SENDER_EMAIL || 'info@example.com' },
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

    // Resolver for Calendar
    const calendarResolverFunction = new NodejsFunction(this, 'CalendarResolver', {
      functionName: `${props.appName}-${props.envName}-CalendarResolver`,
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.resolve(__dirname, '../src/lambda/calendarResolver/main.ts'),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        DATA_TABLE_NAME: dataTable.tableName,
        REGION: REGION,
      },
      //deadLetterQueue: commandHandlerQueue,
    });
    // Add permissions to DynamoDB table
    calendarResolverFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [dataTable.tableArn],
      })
    );
    calendarResolverFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [dataTable.tableArn, dataTable.tableArn + '/index/customer-gsi'],
      })
    );
    // Add persmission to send email
    calendarResolverFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendRawEmail'],
        resources: ['*'],
      })
    );
    // Set the new Lambda function as a data source for the AppSync API
    const calendarResolverDataSource = api.addLambdaDataSource('calendarDataSource', calendarResolverFunction);
    // Resolvers
    calendarResolverDataSource.createResolver('GetAvailableAppointmentsResolver', {
      typeName: 'Query',
      fieldName: 'getAvailableAppointments',
    });
    calendarResolverDataSource.createResolver('GetScheduledAppointmentsResolver', {
      typeName: 'Query',
      fieldName: 'getScheduledAppointments',
    });
    calendarResolverDataSource.createResolver('BookAppointmentResolver', {
      typeName: 'Mutation',
      fieldName: 'bookAppointment',
    });

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
