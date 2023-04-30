import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, CfnUserPoolGroup, UserPoolClient, AccountRecovery, UserPoolDomain } from 'aws-cdk-lib/aws-cognito';

import { SchedularBaseStackProps } from './types/SchedularStackProps';

export class AuthStack extends Stack {
  public userPoolId: string;

  constructor(scope: Construct, id: string, props: SchedularBaseStackProps) {
    super(scope, id, props);

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

      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Cognito user pool group
    new CfnUserPoolGroup(this, `${props.appName}AdminGroup`, {
      userPoolId: userPool.userPoolId,
      groupName: 'Admins',
      description: `${props.appName} Administrators`,
    });

    new CfnUserPoolGroup(this, `${props.appName}UserGroup`, {
      userPoolId: userPool.userPoolId,
      groupName: 'Users',
      description: `${props.appName} Users`,
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
