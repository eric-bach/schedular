import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { SchedularBaseStackProps } from '../lib/types/SchedularStackProps';

describe('Auth Stack', () => {
  const app = new cdk.App();

  const props: SchedularBaseStackProps = {
    appName: 'schedular',
    envName: 'dev',
    tags: {
      env: 'dev',
      application: 'schedular',
    },
  };

  const stack = new AuthStack(app, 'SchedularTestStack', props);

  const template = Template.fromStack(stack);

  it('has a Cognito User Pool', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', Match.objectLike({ UserPoolName: `${props.appName}_user_pool_${props.envName}` }));
    template.hasResourceProperties('AWS::Cognito::UserPoolDomain', Match.objectLike({ Domain: `${props.appName}-${props.envName}` }));
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', Match.objectLike({ GroupName: 'Public' }));
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', Match.objectLike({ GroupName: 'Clients' }));
    template.hasResourceProperties('AWS::Cognito::UserPoolGroup', Match.objectLike({ GroupName: 'Admins' }));
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', Match.objectLike({ ClientName: `${props.appName}_user_client` }));
  });

  it('has a Post Confirmation Trigger function', () => {
    template.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        FunctionName: `${props.appName}-${props.envName}-CognitoAddUser`,
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
      })
    );
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: {
          Statement: [
            {
              Action: 'cognito-idp:AdminAddUserToGroup',
            },
          ],
        },
      })
    );
  });
});
