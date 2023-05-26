import { Stack, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, BillingMode, AttributeType, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { SchedularBaseStackProps } from './types/SchedularStackProps';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { FilterCriteria, FilterRule, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';

const dotenv = require('dotenv');
dotenv.config();

export class DatabaseStack extends Stack {
  public dataTableArn: string;
  public sendEmailFunctionArn: string;

  constructor(scope: Construct, id: string, props: SchedularBaseStackProps) {
    super(scope, id, props);

    const dataTable = new Table(this, 'Data', {
      tableName: `${props.appName}-Data`,
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
      stream: StreamViewType.NEW_IMAGE,
    });
    // GSIs for Data Table
    dataTable.addGlobalSecondaryIndex({
      indexName: 'customerId-gsi',
      partitionKey: {
        name: 'customerId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
    });
    dataTable.addGlobalSecondaryIndex({
      indexName: 'type-gsi',
      partitionKey: {
        name: 'type',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
    });

    // Email Lambda
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction2', {
      functionName: `${props.appName}-${props.envName}-SendEmail2`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmail/main.ts',
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'info@example.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailConsumerRole2', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
      }),
    });
    // Add permission send email
    sendEmailFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendTemplatedEmail'],
        resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`, `arn:aws:ses:${this.region}:${this.account}:template/*`],
      })
    );

    const pipeRole = new Role(this, 'role', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
    });
    const pipe = new CfnPipe(this, 'pipe', {
      roleArn: pipeRole.roleArn,
      //@ts-ignore
      source: dataTable.tableStreamArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: StartingPosition.LATEST,
          batchSize: 1,
        },
        filterCriteria: {
          filters: [
            {
              pattern: '{ "eventName": ["INSERT", "MODIFY"], "dynamodb": { "NewImage": { "type": { "S": ["booking"] } } } }',
            },
          ],
        },
      },
      target: sendEmailFunction.functionArn,
    });
    dataTable.grantStreamRead(pipeRole);
    sendEmailFunction.grantInvoke(pipeRole);

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'DataTableArn', {
      value: dataTable.tableArn,
      exportName: `${props.appName}-${props.envName}-dataTableArn`,
    });
    new CfnOutput(this, 'DataTableName', {
      value: dataTable.tableName,
      exportName: `${props.appName}-${props.envName}-dataTableName`,
    });

    /***
     *** Properties
     ***/

    this.dataTableArn = dataTable.tableArn;
    this.sendEmailFunctionArn = sendEmailFunction.functionArn;
  }
}
