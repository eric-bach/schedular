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
      runtime: Runtime.NODEJS_18_X,
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
    const getCognitoUserFunction = new NodejsFunction(this, 'GetCognitoUserFunction', {
      functionName: `${props.appName}-${props.envName}-GetCognitoUser`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'src/lambda/getCognitoUser/main.ts',
      environment: {
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: Duration.seconds(20),
      memorySize: 512,
    });
    // Add permission to query Cognito
    getCognitoUserFunction.addToRolePolicy(
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

    const messagingPipe = new CfnPipe(this, 'MessagingPipe', {
      name: `${props.appName}-${props.envName}-messaging-pipe`,
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
      enrichment: getCognitoUserFunction.functionArn,
      target: sendEmailFunction.functionArn,
    });

    // Grant permissions for Pipes
    dataTable.grantStreamRead(pipeRole);
    sendEmailFunction.grantInvoke(pipeRole);
    getCognitoUserFunction.grantInvoke(pipeRole);

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

    new CfnTemplate(this, 'ConfirmationEmailTemplate', {
      template: {
        subjectPart: 'Appointment Confirmation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Confirmation</title><style>body{font-family:Arial,sans-serif;background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#fff;padding:20px;border-radius:5px;color:#777}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.8}.appointment-details{margin-bottom:40px;font-size:18px;line-height:.8}.administrator-details{margin-bottom:40px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#1976d2;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#0059b2}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>Thanks for booking</h1><div class="heading"><p>Hey {{name}}, your appointment has been<span style="color:green"> confirmed</span>.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Appointment with: {{administrator}}</p><p>Address: TBD</p></div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AppointmentConfirmation',
        textPart: 'Hi {{name}},\r\nThank you for booking your appointment on {{date}} at {{time}} with {{administrator}}.',
      },
    });
    new CfnTemplate(this, 'CancellationEmailTemplate', {
      template: {
        subjectPart: 'Appointment Cancellation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Cancellation</title><style>body{font-family:Arial,sans-serif;background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#fff;padding:20px;border-radius:5px;color:#777}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.8}.appointment-details{margin-bottom:40px;font-size:18px;line-height:.8}.administrator-details{margin-bottom:40px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#1976d2;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#0059b2}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>It\'s understandable plans change</h1><div class="heading"><p>Hey {{name}}, your appointment has been<span style="color:red"> cancelled</span>.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Appointment with: {{administrator}}</p><p>Address: TBD</p></div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AppointmentCancellation',
        textPart: 'Hi {{name}},\r\nYour appointment on {{date}} at {{time}} with {{administrator}} has been cancelled.',
      },
    });
    new CfnTemplate(this, 'ReminderEmailTemplate', {
      template: {
        subjectPart: 'Appointment Reminder',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Appointment Reminder</title><style>body{font-family:Arial,sans-serif;background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#fff;padding:20px;border-radius:5px;color:#777}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.8}.appointment-details{margin-bottom:40px;font-size:18px;line-height:.8}.administrator-details{margin-bottom:40px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#1976d2;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#0059b2}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>Get ready for your appointment</h1><div class="heading"><p>Hey {{name}}, your appointment is<span style="color:#1976d2"> coming up</span>.</p></div><div class="appointment-details"><p>{{date}}</p><p>{{time}}</p></div><div class="administrator-details"><p>Appointment with: {{administrator}}</p><p>Address: TBD</p></div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AppointmentReminder',
        textPart: "Hi {{name}},\r\nIt's almost time for your appointment on {{date}} at {{time}} with {{administrator}}.",
      },
    });
    new CfnTemplate(this, 'AdminAppointmentConfirmationTemplate', {
      template: {
        subjectPart: 'You have a new booking',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>You have a new booking</title><style>body{font-family:Arial,sans-serif;background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#ccc;padding:20px;border-radius:5px;color:#7e7e7e}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.8}.customer-details{margin-bottom:40px;font-size:18px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#b52dee;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#7a1ea1}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>You have a new booking</h1><div class="heading"><p>Hey {{administrator}}, a client has booked an appointment with you.</p></div><div class="customer-details"><p>{{name}}</p><p>{{date}}</p><p>{{time}}</p></div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AdminAppointmentConfirmation',
        textPart: 'Hi {{administrator}},\r\nA new appointment has been booked with you on {{date}} at {{time}}.',
      },
    });
    new CfnTemplate(this, 'AdminAppointmentCancellationTemplate', {
      template: {
        subjectPart: 'You have a cancellation',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>You have a cancellation</title><style>body{font-family:Arial,sans-serif;background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#ccc;padding:20px;border-radius:5px;color:#7e7e7e}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.8}.customer-details{margin-bottom:40px;font-size:18px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#b52dee;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#7a1ea1}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>You have a cancellation</h1><div class="heading"><p>Hey {{administrator}}, a client has cancelled their appointment with you.</p></div><div class="customer-details"><p>{{name}}</p><p>{{date}}</p><p>{{time}}</p></div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AdminAppointmentCancellation',
        textPart: 'Hi {{administrator}},\r\nAn appointment has been cancelled with you on {{date}} at {{time}}.',
      },
    });
    new CfnTemplate(this, 'AdminDailyDigestTemplate', {
      template: {
        subjectPart: 'Your upcoming appointments',
        htmlPart:
          '<!DOCTYPE html><html lang="en"><head><title>Your daily digest</title><style>body{background-color:#f6f6f6;padding:20px}.container{max-width:600px;margin:0 auto;background-color:#ccc;padding:20px;border-radius:5px;color:#7e7e7e}h1{font-size:32px;line-height:1.2;margin-top:0;margin-bottom:20px}p{margin-bottom:10px}.heading{margin-top:40px;font-size:20px;line-height:.9}.customer-details{margin-bottom:40px;font-size:18px;line-height:.8}.manage-account{margin-bottom:40px}.button{display:inline-block;background-color:#b52dee;color:#fff;text-align:center;padding:10px 20px;text-decoration:none;border-radius:5px}.button:hover{background-color:#7a1ea1}.italic{font-style:italic}.footer{margin-top:30px;line-height:.7}.signature{margin-top:20px;font-size:12px;line-height:.7;text-align:center;color:#777}</style></head><body><div class="container"><h1>Your upcoming schedule tomorrow</h1><div class="heading"><p>Hi {{administrator}}, here is your upcoming schedule for {{date}}</p></div><div class="customer-details">{{#each customers}}<p>{{time}} - {{name}}</p>{{/each}}</div><div class="manage-account"><p class="italic" style="font-size:14px">To view or manage your appointments, please log in your account.</p><a class="button" href="https://www.google.ca">Manage Appointments</a></div><hr><div class="footer"><p style="font-size:14px">Best regards,</p><p style="font-size:14px">TBD</p></div></div><div class="signature"><p>Built by:<a href="https://ericbach.dev" style="text-decoration:none">Eric Bach</a></p></div></body></html>',
        templateName: 'AdminDailyDigest',
        textPart: 'Hi {{administrator}},\r\nHere is your upcoming appointments.',
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
