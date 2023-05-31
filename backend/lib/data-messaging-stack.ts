import { Stack, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, BillingMode, AttributeType, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { SchedularDataStackProps } from './types/SchedularStackProps';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { EventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { CfnTemplate, EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

const dotenv = require('dotenv');
dotenv.config();

export class DataMessagingStack extends Stack {
  public dataTableArn: string;

  constructor(scope: Construct, id: string, props: SchedularDataStackProps) {
    super(scope, id, props);

    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.params.userPoolId);

    /***
     *** DynamoDB
     ***/

    const dataTable = new Table(this, 'DataTable', {
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
      removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_IMAGE,
    });

    // Indexes
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
     *** EventBridge
     ***/

    const eventBus = new EventBus(this, 'EventBus', {
      eventBusName: `${props.appName}-${props.envName}-bus`,
    });

    /***
     *** Lambda Functions
     ***/

    // Send Email
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `${props.appName}-${props.envName}-SendEmail`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmail/main.ts',
      environment: {
        //@ts-ignore
        SENDER_EMAIL: process.env.SENDER_EMAIL,
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailServiceRole', {
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

    // Send Reminders Lambda
    const sendRemindersFunction = new NodejsFunction(this, 'SendRemindersFunction', {
      functionName: `${props.appName}-${props.envName}-SendReminders`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/sendReminders/main.ts',
      environment: {
        DATA_TABLE_NAME: dataTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        USER_POOL_ID: userPool.userPoolId,
        REGION: this.region,
      },
      timeout: Duration.seconds(20),
      memorySize: 512,
    });
    // Add permission to publish events
    sendRemindersFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );
    // Add permission to query DynamoDB
    sendRemindersFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [dataTable.tableArn + '*'],
      })
    );
    // Add permission to query Cognito
    sendRemindersFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-idp:ListUsers'],
        resources: [userPool.userPoolArn],
      })
    );

    // Enrichment Lambda
    const getAdministratorFunction = new NodejsFunction(this, 'GetAdministratorFunction', {
      functionName: `${props.appName}-${props.envName}-GetAdministrator`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/getAdministrators/main.ts',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: Duration.seconds(20),
      memorySize: 512,
    });
    // Add permission to query Cognito
    getAdministratorFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-idp:ListUsers'],
        resources: [userPool.userPoolArn],
      })
    );

    /***
     *** AWS EventBridge - Event Bus Rules
     ***/

    const sendRemindersRule = new Rule(this, 'SendRemindersRule', {
      ruleName: `${props.appName}-SendReminders-${props.envName}`,
      description: 'SendReminders',
      eventBus: eventBus,
      eventPattern: {
        source: ['custom.schedular'],
        detailType: ['BookingReminder'],
      },
    });
    sendRemindersRule.addTarget(
      new LambdaFunction(sendEmailFunction, {
        //deadLetterQueue: SqsQueue,
        maxEventAge: Duration.hours(2),
        retryAttempts: 2,
      })
    );

    /***
     *** EventBridge Pipes
     ***/

    const pipeRole = new Role(this, 'EventBridgePipeRole', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
    });

    const pipe = new CfnPipe(this, 'EventBridgePipe', {
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
      enrichment: getAdministratorFunction.functionArn,
      target: sendEmailFunction.functionArn,
    });

    // Grant permissions for Pipes
    dataTable.grantStreamRead(pipeRole);
    sendEmailFunction.grantInvoke(pipeRole);
    getAdministratorFunction.grantInvoke(pipeRole);

    // EventBridge rule to send email reminders
    const cronRule = new Rule(this, 'SendRemindersSchedule', {
      schedule: Schedule.expression('cron(0 18 * * ? *)'),
      enabled: true,
    });
    cronRule.addTarget(new LambdaFunction(sendRemindersFunction));

    /***
     *** SES
     ***/

    const emailIdentity = new EmailIdentity(this, 'EmailIdentity', {
      //@ts-ignore
      identity: { value: process.env.SENDER_EMAIL },
    });

    const conirmationTemplate = new CfnTemplate(this, 'ConfirmationEmailTemplate', {
      template: {
        subjectPart: 'Appointment Confirmation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Confirmation</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>Thanks<br>for booking.</h1><div class="heading"><p>Your appointment has been confirmed.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To view or manage your appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'AppointmentConfirmation',
        textPart: 'Hi {{name}},\r\nThank you for booking your appointment on {{date}} at {{time}} with {{administrator}}.',
      },
    });
    const cancellationTemplate = new CfnTemplate(this, 'CancellationEmailTemplate', {
      template: {
        subjectPart: 'Appointment Cancellation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Cancellation</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>It\'s understandable<br>that plans change.</h1><div class="heading"><p>Your appointment has been cancelled.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To make another appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Book Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'AppointmentCancellation',
        textPart: 'Your appointment on {{date}} at {{time}} with {{administrator}} has been cancelled.',
      },
    });
    const reminderTemplate = new CfnTemplate(this, 'ReminderEmailTemplate', {
      template: {
        subjectPart: 'Appointment Reminder',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Reminder</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.appointment-details{margin-bottom:60px;font-size:20px;line-height:.8}.administrator-details{margin-bottom:50px;line-height:.9}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>It\'s almost<br>time for your<br>appointment.</h1><div class="heading"><p>Your appointment is coming up.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Massage with: {{administrator}}</p><p>Address: TBD</p></div><p class="italic" style="font-size:14px">To view or manage your appointment, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'BookingReminder',
        textPart: "Hi {{name}},\r\nIt's almost time for your appointment on {{date}} at {{time}} with {{administrator}}.",
      },
    });
    const adminConfirmationTemplate = new CfnTemplate(this, 'AdminAppopintmentBookedTemplate', {
      template: {
        subjectPart: 'Appointment Booked',
        htmlPart:
          '<!DOCTYPE html><html lang="en"> <head> <title>Appointment Booked</title> <style>body{background-color: #f6f6f6; padding: 20px;}.container{max-width: 600px; margin: 0 auto; background-color: #1976d2; padding: 20px; border-radius: 5px; color: #ffffff;}h1{font-size: 28px; line-height: 1.2; margin-top: 0; margin-bottom: 20px;}p{margin-bottom: 10px;}.heading{margin-top: 40px; font-size: 18px; line-height: 0.8;}.appointment-details{margin-bottom: 60px; font-size: 20px; line-height: 0.8;}.customer-details{margin-bottom: 50px; line-height: 0.9;}.button{display: inline-block; background-color: #4caf50; color: #ffffff; text-align: center; padding: 10px 20px; text-decoration: none; border-radius: 5px;}.button:hover{background-color: #45a049;}.italic{font-style: italic;}.footer{margin-top: 40px; line-height: 0.6;}</style> </head> <body> <div class="container"> <h1>You have a<br/>new booking.</h1> <div class="heading"> <p>A user has booked an appointment with you.</p></div><div class="appointment-details"> <p>{{date}}</p><p>{{time}}</p></div><div class="customer-details"> <p>Customer:{{name}}</p></div><p class="italic" style="font-size: 14px">To view or manage your schedule, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a> <div class="footer"> <hr/> <p style="font-size: 14px">Best regards,</p><p style="font-size: 14px">TBD</p></div></div></body></html>',
        templateName: 'AdminAppointmentBooked',
        textPart: 'Hi {{name}},\r\nA new appointment has been booked with you on {{date}} at {{time}}.',
      },
    });
    const adminCancelledTemplate = new CfnTemplate(this, 'AdminAppopintmentCancelledTemplate', {
      template: {
        subjectPart: 'Appointment Cancelled',
        htmlPart:
          '<!DOCTYPE html><html lang="en"> <head> <title>Appointment Cancelled</title> <style>body{background-color: #f6f6f6; padding: 20px;}.container{max-width: 600px; margin: 0 auto; background-color: #1976d2; padding: 20px; border-radius: 5px; color: #ffffff;}h1{font-size: 28px; line-height: 1.2; margin-top: 0; margin-bottom: 20px;}p{margin-bottom: 10px;}.heading{margin-top: 40px; font-size: 18px; line-height: 0.8;}.appointment-details{margin-bottom: 60px; font-size: 20px; line-height: 0.8;}.customer-details{margin-bottom: 50px; line-height: 0.9;}.button{display: inline-block; background-color: #4caf50; color: #ffffff; text-align: center; padding: 10px 20px; text-decoration: none; border-radius: 5px;}.button:hover{background-color: #45a049;}.italic{font-style: italic;}.footer{margin-top: 40px; line-height: 0.6;}</style> </head> <body> <div class="container"> <h1>You have a<br/>cancellation.</h1> <div class="heading"> <p>A user has cancelled their appointment with you.</p></div><div class="appointment-details"> <p>{{date}}</p><p>{{time}}</p></div><div class="customer-details"> <p>Customer:{{name}}</p></div><p class="italic" style="font-size: 14px">To view or manage your schedule, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a> <div class="footer"> <hr/> <p style="font-size: 14px">Best regards,</p><p style="font-size: 14px">TBD</p></div></div></body></html>',
        templateName: 'AdminAppointmentCancelled',
        textPart: 'Hi {{name}},\r\nAn appointment has been cancelled on {{date}} at {{time}}.',
      },
    });
    const adminDailyDigestTemplate = new CfnTemplate(this, 'AdminDailyDigestTemplate', {
      template: {
        subjectPart: "Today's Appointments",
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Daily Digest</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#1976d2;padding:20px;border-radius:5px;color:#fff}h1{font-size:28px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:18px;line-height:.8}.customer-details{margin-bottom:60px;font-size:20px;line-height:.8}.button{display:inline-block;background-color:#4caf50;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#45a049}.italic{font-style:italic}.footer{margin-top:40px;line-height:.6}</style></head><body><div class="container"><h1>Your schedule<br>for today.</h1><div class="customer-details"><ul>{{#each customers}}<li><p>Customer: {{name}}</p></li><li><p>{{date}} at {{time}}</p></li>{{/each}}</ul></div><p class="italic" style="font-size:14px">To view or manage your schedule, please visit our website.</p><a class="button" href="https://www.google.ca">Manage Appointments</a><div class="footer"><hr><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div></body></html>',
        templateName: 'AdminDailyDigest',
      },
    });

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'DataTableArn', {
      value: dataTable.tableArn,
      exportName: `${props.appName}-${props.envName}-dataTableArn`,
    });

    new CfnOutput(this, 'DataTableName', { value: dataTable.tableName });

    new CfnOutput(this, 'EventBusArn', { value: eventBus.eventBusArn, exportName: `${props.appName}-${props.envName}-eventBusArn` });

    new CfnOutput(this, 'SendEmailFunctionArn', { value: sendEmailFunction.functionArn });

    new CfnOutput(this, 'SendRemindersFunctionArn', { value: sendRemindersFunction.functionArn });

    new CfnOutput(this, 'EmailIdentityName', { value: emailIdentity.emailIdentityName });

    /***
     *** Properties
     ***/

    this.dataTableArn = dataTable.tableArn;
  }
}
