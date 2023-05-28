import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { SchedularApiStackProps } from '../lib/types/SchedularStackProps';
import { ApiStack } from '../lib/api-stack';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

describe('API Stack', () => {
  const app = new cdk.App();

  const props: SchedularApiStackProps = {
    appName: 'schedular',
    envName: 'test',
    tags: {
      env: 'test',
      application: 'schedular',
    },
    params: {
      userPoolId: 'id',
      dataTableArn: 'arn',
    },
  };

  const fromUserPoolId = jest.spyOn(UserPool, 'fromUserPoolId');
  const fromTableArn = jest.spyOn(Table, 'fromTableArn');
  fromUserPoolId.mockReturnValue({ userPoolArn: 'arn:aws:Cognito:us-east-1::test' } as UserPool);
  fromTableArn.mockReturnValue({ tableName: 'test', tableArn: 'arn:aws:DynamoDB:us-east-1::test' } as Table);

  const stack = new ApiStack(app, 'SchedularTestStack', props);

  const template = Template.fromStack(stack);

  it.only('has an AppSync GraphQL API', () => {
    template.hasResourceProperties(
      'AWS::AppSync::GraphQLApi',
      Match.objectLike({
        Name: `${props.appName}-${props.envName}-api`,
        AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
      })
    );
  });

  it('has an AppSync Lambda Data Source', () => {
    template.hasResourceProperties(
      'AWS::AppSync::DataSource',
      Match.objectLike({
        Type: 'AWS_LAMBDA',
      })
    );
  });

  it('has an AppSync DynammoDB Data Source', () => {
    template.hasResourceProperties(
      'AWS::AppSync::DataSource',
      Match.objectLike({
        Type: 'AMAZON_DYNAMODB',
      })
    );
  });

  it('has Lambda functions', () => {
    template.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        FunctionName: `${props.appName}-${props.envName}-UserService`,
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
      })
    );
  });
});
