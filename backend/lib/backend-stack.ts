import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  UserPool,
  CfnUserPoolGroup,
  UserPoolClient,
  AccountRecovery,
  UserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
    new CfnUserPoolGroup(this, 'MyAppUserGroup', {
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
  }
}
