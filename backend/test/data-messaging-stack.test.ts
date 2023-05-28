import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { SchedularBaseStackProps } from '../lib/types/SchedularStackProps';
import { DataMessagingStack } from '../lib/data-messaging-stack';

describe('Data Messaging Stack', () => {
  const app = new cdk.App();

  const props: SchedularBaseStackProps = {
    appName: 'schedular',
    envName: 'dev',
    tags: {
      env: 'dev',
      application: 'schedular',
    },
  };

  const stack = new DataMessagingStack(app, 'SchedularTestStack', props);

  const template = Template.fromStack(stack);

  it('has a DynamoDB Table with Streams', () => {
    template.hasResourceProperties(
      'AWS::DynamoDB::Table',
      Match.objectLike({
        TableName: `${props.appName}-Data`,
        StreamSpecification: {
          StreamViewType: 'NEW_IMAGE',
        },
        GlobalSecondaryIndexes: [{ IndexName: 'customerId-gsi' }, { IndexName: 'type-gsi' }],
      })
    );
  });

  it('has a Pipe', () => {
    template.hasResourceProperties(
      'AWS::Pipes::Pipe',
      Match.objectLike({
        Name: `${props.appName}-${props.envName}-pipe`,
        SourceParameters: {
          FilterCriteria: {
            Filters: [
              {
                Pattern: '{ "eventName": ["INSERT", "MODIFY"], "dynamodb": { "NewImage": { "type": { "S": ["booking"] } } } }',
              },
            ],
          },
        },
      })
    );
  });

  it('has email templates', () => {
    template.hasResourceProperties('AWS::SES::Template', Match.objectLike({ Template: { TemplateName: 'AppointmentConfirmation' } }));
    template.hasResourceProperties('AWS::SES::Template', Match.objectLike({ Template: { TemplateName: 'AppointmentCancellation' } }));
    template.hasResourceProperties('AWS::SES::Template', Match.objectLike({ Template: { TemplateName: 'BookingReminder' } }));
  });

  it('has Lambda functions', () => {
    template.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        FunctionName: `${props.appName}-${props.envName}-SendEmail`,
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
      })
    );
    template.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        FunctionName: `${props.appName}-${props.envName}-SendReminders`,
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
      })
    );
  });
});
