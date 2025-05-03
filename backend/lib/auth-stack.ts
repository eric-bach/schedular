import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, CfnUserPoolGroup, UserPoolClient, AccountRecovery, UserPoolDomain, VerificationEmailStyle, UserPoolEmail } from 'aws-cdk-lib/aws-cognito';

import { SchedularBaseStackProps } from './types/SchedularStackProps';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

const dotenv = require('dotenv');
dotenv.config();

export class AuthStack extends Stack {
  public userPoolId: string;

  constructor(scope: Construct, id: string, props: SchedularBaseStackProps) {
    super(scope, id, props);

    // AWS Cognito post-confirmation lambda function
    const cognitoAddUser = new NodejsFunction(this, 'CognitoAddUser', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `${props.appName}-${props.envName}-CognitoAddUser`,
      handler: 'handler',
      entry: path.resolve(__dirname, '../src/lambda/cognitoAddUser/main.ts'),
      memorySize: 768,
      timeout: Duration.seconds(5),
      environment: {
        REGION: this.region,
      },
    });

    // Cognito user pool
    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${props.appName}_user_pool_${props.envName}`,
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
      email: UserPoolEmail.withSES({
        // @ts-ignore
        fromEmail: process.env.SENDER_EMAIL,
        fromName: 'Massage App',
        sesRegion: this.region,
      }),
      userVerification: {
        emailSubject: 'Massage App - Verify your new account',
        emailBody: 'Thanks for signing up! Please enter the verification code {####} to confirm your account.',
        emailStyle: VerificationEmailStyle.CODE,
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
        postConfirmation: cognitoAddUser,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Cognito user pool group
    new CfnUserPoolGroup(this, 'UserPoolAdminsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Admins',
      description: 'Aministrators',
    });

    new CfnUserPoolGroup(this, 'UserPoolPublicGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Public',
      description: 'Public users - not confirmed',
    });

    new CfnUserPoolGroup(this, 'UserPoolClientsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Clients',
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
    const userPoolClient = new UserPoolClient(this, 'UserPoolWebClient', {
      userPoolClientName: `${props.appName}_user_client`,
      accessTokenValidity: Duration.hours(8),
      idTokenValidity: Duration.hours(8),
      userPool,
    });

    // Add permissions to add user to Cognito User Pool
    cognitoAddUser.role!.attachInlinePolicy(
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
