import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, CfnUserPoolGroup, UserPoolClient, AccountRecovery, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';

import { SchedularBaseStackProps } from './types/SchedularStackProps';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class AuthStack extends Stack {
  public userPoolId: string;

  constructor(scope: Construct, id: string, props: SchedularBaseStackProps) {
    super(scope, id, props);

    // AWS Cognito post-confirmation lambda function
    const cognitoPostConfirmationTrigger = new NodejsFunction(this, 'CognitoPostConfirmationTrigger', {
      runtime: Runtime.NODEJS_14_X,
      functionName: `${props.appName}-${props.envName}-CognitoPostConfirmationTrigger`,
      handler: 'handler',
      entry: path.resolve(__dirname, '../src/lambda/cognitoPostConfirmation/main.ts'),
      memorySize: 768,
      timeout: Duration.seconds(5),
      environment: {
        REGION: this.region,
      },
    });

    // Cognito user pool
    const userPool = new UserPool(this, `${props.appName}UserPool`, {
      userPoolName: `${props.appName}_user_pool_${props.envName}`,
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
      lambdaTriggers: {
        postConfirmation: cognitoPostConfirmationTrigger,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Cognito user pool group
    new CfnUserPoolGroup(this, `${props.appName}AdminGroup`, {
      userPoolId: userPool.userPoolId,
      groupName: 'Admins',
      description: 'Aministrators',
    });

    new CfnUserPoolGroup(this, `${props.appName}PendingGroup`, {
      userPoolId: userPool.userPoolId,
      groupName: 'Pending',
      description: 'Users not confirmed yet',
    });

    new CfnUserPoolGroup(this, `${props.appName}UserGroup`, {
      userPoolId: userPool.userPoolId,
      groupName: 'Users',
      description: 'Confirmed users',
    });

    // Cognito user pool domain
    new UserPoolDomain(this, `${props.appName}UserPoolDomain`, {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: `${props.appName}-${props.envName}`,
      },
    });

    // Cognito user client
    const userPoolClient = new UserPoolClient(this, `${props.appName}UserClient`, {
      userPoolClientName: `${props.appName}_user_client`,
      accessTokenValidity: Duration.hours(8),
      idTokenValidity: Duration.hours(8),
      userPool,
    });

    // Add permissions to add user to Cognito User Pool
    cognitoPostConfirmationTrigger.role!.attachInlinePolicy(
      new Policy(this, 'userpool-policy', {
        statements: [
          new PolicyStatement({
            actions: ['cognito-idp:AdminAddUserToGroup'],
            resources: [userPool.userPoolArn],
          }),
        ],
      })
    );

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: `${props.appName}-${props.envName}-userPoolId`,
    });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });

    /***
     *** Properties
     ***/

    this.userPoolId = userPool.userPoolId;
  }
}
