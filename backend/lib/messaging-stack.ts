import { Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { aws_ses as ses } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { SchedularMessagingStackProps } from './types/SchedularStackProps';
import { EventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

const dotenv = require('dotenv');

dotenv.config();

export class MessagingStack extends Stack {
  public eventBusArn: string;

  constructor(scope: Construct, id: string, props: SchedularMessagingStackProps) {
    super(scope, id, props);

    const dataTable = Table.fromTableArn(this, 'table', props.params.dataTableArn);

    // EventBus
    const eventBus = new EventBus(this, 'SchedularEventBus', {
      eventBusName: `${props.appName}-bus-${props.envName}`,
    });

    // SES
    const emailIdentity = new EmailIdentity(this, 'Identity', {
      identity: { value: process.env.SENDER_EMAIL || 'info@example.com' },
    });

    const conirmationTemplate = new ses.CfnTemplate(this, 'confirmationEmail', {
      template: {
        subjectPart: 'Appointment Confirmation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Confirmation</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>Thanks<br>for booking.</h1><div class="heading"><p>Your appointment has been confirmed.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To view or manage your appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'AppointmentConfirmation',
        textPart: 'Hi {{name}},\r\nThank you for booking your appointment on {{date}} at {{time}} with {{administrator}}.',
      },
    });
    const cancellationTemplate = new ses.CfnTemplate(this, 'cancellationEmail', {
      template: {
        subjectPart: 'Appointment Cancellation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Cancellation</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>It\'s understandable<br>that plans change.</h1><div class="heading"><p>Your appointment has been cancelled.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To make another appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Book Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'AppointmentCancellation',
        textPart: 'Your appointment on {{date}} at {{time}} with {{administrator}} has been cancelled.',
      },
    });
    const reminderTemplate = new ses.CfnTemplate(this, 'reminderEmail', {
      template: {
        subjectPart: 'Appointment Reminder',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Reminder</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>It\'s almost<br>time for your<br>appointment.</h1><div class="heading"><p>Your appointment is coming up.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To view or manage your appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'BookingReminder',
        textPart: "Hi {{name}},\r\nIt's almost time for your appointment on {{date}} at {{time}} with {{administrator}}.",
      },
    });

    // Email Lambda
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `${props.appName}-${props.envName}-SendEmail`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmail/main.ts',
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'info@example.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailConsumerRole', {
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

    // Reminders Lambda
    const sendRemindersFunction = new NodejsFunction(this, 'SendRemindersFunction', {
      functionName: `${props.appName}-${props.envName}-SendReminders`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/sendReminders/main.ts',
      environment: {
        DATA_TABLE_NAME: dataTable.tableName || '',
        EVENTBUS_NAME: eventBus.eventBusName || '',
        REGION: this.region,
      },
      timeout: Duration.seconds(20),
      memorySize: 512,
    });
    // Add permission to query DynamoDB
    sendRemindersFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [dataTable.tableArn + '/index/type-gsi'],
      })
    );
    // Add permission to send to EventBridge
    sendRemindersFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );
    // EventBridge rule that runs everyday at 6pm
    const cronRule = new Rule(this, 'CronRule', {
      schedule: Schedule.expression('cron(0 18 * * ? *)'),
      // TODO Enable
      enabled: false,
    });
    // Set Lambda function as target for EventBridge
    cronRule.addTarget(new LambdaFunction(sendRemindersFunction));

    // EventBus Rule -
    const sendEmailRule = new Rule(this, 'SendEmailRule', {
      ruleName: `${props.appName}-SendEmailRule-${props.envName}`,
      description: 'SendEmail',
      eventBus: eventBus,
      eventPattern: {
        source: ['custom.schedular'],
        detailType: ['BookingReminder', 'BookingCreated', 'BookingCancelled'],
      },
    });
    sendEmailRule.addTarget(
      new LambdaFunction(sendEmailFunction, {
        maxEventAge: Duration.hours(2),
        retryAttempts: 2,
      })
    );

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'VerifiedEmailIdentity', {
      value: emailIdentity.emailIdentityName,
      exportName: `${props.appName}-${props.envName}-emailIdentity`,
    });

    new CfnOutput(this, 'EventBusArn', {
      value: eventBus.eventBusArn,
      exportName: `${props.appName}-${props.envName}-eventBusArn`,
    });

    new CfnOutput(this, 'SendEmailFunctionArn', {
      value: sendEmailFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendEmailFunctionArn`,
    });

    new CfnOutput(this, 'SendRemindersFunctionArn', {
      value: sendRemindersFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendRemindersFunctionArn`,
    });

    /***
     *** Properties
     ***/

    this.eventBusArn = eventBus.eventBusArn;
  }
}
