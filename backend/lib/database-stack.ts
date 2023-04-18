import { Stack, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { SchedularBaseStackProps } from './types/SchedularStackProps';

const dotenv = require('dotenv');
dotenv.config();

export class DatabaseStack extends Stack {
  public dataTableArn: string;

  constructor(scope: Construct, id: string, props: SchedularBaseStackProps) {
    super(scope, id, props);

    const dataTable = new Table(this, 'Data', {
      tableName: `${props.appName}-${props.envName}-Data`,
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
      indexName: 'date-gsi',
      partitionKey: {
        name: 'date',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
    });
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
  }
}
