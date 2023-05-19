import { Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { aws_ses as ses } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventSourceMapping, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { SchedularMessagingStackProps } from './types/SchedularStackProps';
import { EventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

const dotenv = require('dotenv');

dotenv.config();

export class MessagingStack extends Stack {
  public queueArn: string;
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

    const conirmationTemplater = new ses.CfnTemplate(this, 'confirmationEmail', {
      template: {
        subjectPart: 'Appointment Confirmation',
        htmlPart:
          '<!DOCTYPE html><html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml"><head><title></title><meta content="text/html; charset=utf-8" http-equiv="Content-Type"><meta content="width=device-width,initial-scale=1" name="viewport"><!--[if mso]><xml><o:officedocumentsettings><o:pixelsperinch>96</o:pixelsperinch><o:allowpng></o:officedocumentsettings></xml><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Quattrocento" rel="stylesheet" type="text/css"><!--<![endif]--><style>*{box-sizing:border-box}body{margin:0;padding:0}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}p{line-height:inherit}.desktop_hide,.desktop_hide table{mso-hide:all;display:none;max-height:0;overflow:hidden}.image_block img+div{display:none}.menu_block.desktop_hide .menu-links span{mso-hide:all}@media (max-width:700px){.desktop_hide table.icons-inner,.social_block.desktop_hide .social-table{display:inline-block!important}.icons-inner{text-align:center}.icons-inner td{margin:0 auto}.row-content{width:100%!important}.menu-checkbox[type=checkbox]~.menu-links{display:none!important;padding:5px 0}.menu-checkbox[type=checkbox]:checked~.menu-trigger .menu-open{display:none!important}.menu-checkbox[type=checkbox]:checked~.menu-links,.menu-checkbox[type=checkbox]~.menu-trigger{display:block!important;max-width:none!important;max-height:none!important;font-size:inherit!important}.menu-checkbox[type=checkbox]~.menu-links>a,.menu-checkbox[type=checkbox]~.menu-links>span.label{display:block!important;text-align:center}.menu-checkbox[type=checkbox]:checked~.menu-trigger .menu-close{display:block!important}.mobile_hide{display:none}.stack .column{width:100%;display:block}.mobile_hide{min-height:0;max-height:0;max-width:0;overflow:hidden;font-size:0}.desktop_hide,.desktop_hide table{display:table!important;max-height:none!important}}#memu-r0c0m0:checked~.menu-links,#memu-r3c1m0:checked~.menu-links{background-color:#fff!important}#memu-r0c0m0:checked~.menu-links a,#memu-r0c0m0:checked~.menu-links span{color:#000!important}#memu-r3c1m0:checked~.menu-links a,#memu-r3c1m0:checked~.menu-links span{color:#171719!important}</style></head><body style="background-color:#f6eeeb;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f6eeeb" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1;background-position:center top" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:30px;line-height:30px;font-size:1px"> </div><table border="0" cellpadding="15" cellspacing="0" class="text_block block-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Lato,Tahoma,Verdana,Segoe,sans-serif;mso-line-height-alt:21px;color:#000;line-height:1.5"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:25.5px;letter-spacing:6px"><span style="font-size:17px"><strong>S P A</strong></span></p></div></div></td></tr></table><table border="0" cellpadding="15" cellspacing="0" class="heading_block block-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><h1 style="margin:0;color:#000;direction:ltr;font-family:Quattrocento,\'Trebuchet MS\',Helvetica,sans-serif;font-size:37px;font-weight:400;letter-spacing:normal;line-height:120%;text-align:center;margin-top:0;margin-bottom:0"><strong>Thank you</strong>for booking <br>your appointment.<br></h1></td></tr></table><table border="0" cellpadding="0" cellspacing="0" class="text_block block-4" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad" style="padding-bottom:15px;padding-left:30px;padding-right:30px;padding-top:10px"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Lato,Tahoma,Verdana,Segoe,sans-serif;mso-line-height-alt:21px;color:#000;line-height:1.5"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:21px">Hi {{name}}, your appointment is booked on {{date}} at {{time}} with {{administrator}}.</p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:55px;line-height:55px;font-size:1px"> </div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>',
        templateName: 'AppointmentConfirmation',
        textPart: 'Hi {{name}},\r\nThank you for booking your appointment on {{date}} at {{time}} with {{administrator}}.',
      },
    });
    const cancellationTemplate = new ses.CfnTemplate(this, 'cancellationEmail', {
      template: {
        subjectPart: 'Appointment Cancellation',
        htmlPart:
          '<!DOCTYPE html><html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml"><head><title></title><meta content="text/html; charset=utf-8" http-equiv="Content-Type"><meta content="width=device-width,initial-scale=1" name="viewport"><!--[if mso]><xml><o:officedocumentsettings><o:pixelsperinch>96</o:pixelsperinch><o:allowpng></o:officedocumentsettings></xml><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Quattrocento" rel="stylesheet" type="text/css"><!--<![endif]--><style>*{box-sizing:border-box}body{margin:0;padding:0}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}p{line-height:inherit}.desktop_hide,.desktop_hide table{mso-hide:all;display:none;max-height:0;overflow:hidden}.image_block img+div{display:none}.menu_block.desktop_hide .menu-links span{mso-hide:all}@media (max-width:700px){.desktop_hide table.icons-inner,.social_block.desktop_hide .social-table{display:inline-block!important}.icons-inner{text-align:center}.icons-inner td{margin:0 auto}.row-content{width:100%!important}.menu-checkbox[type=checkbox]~.menu-links{display:none!important;padding:5px 0}.menu-checkbox[type=checkbox]:checked~.menu-trigger .menu-open{display:none!important}.menu-checkbox[type=checkbox]:checked~.menu-links,.menu-checkbox[type=checkbox]~.menu-trigger{display:block!important;max-width:none!important;max-height:none!important;font-size:inherit!important}.menu-checkbox[type=checkbox]~.menu-links>a,.menu-checkbox[type=checkbox]~.menu-links>span.label{display:block!important;text-align:center}.menu-checkbox[type=checkbox]:checked~.menu-trigger .menu-close{display:block!important}.mobile_hide{display:none}.stack .column{width:100%;display:block}.mobile_hide{min-height:0;max-height:0;max-width:0;overflow:hidden;font-size:0}.desktop_hide,.desktop_hide table{display:table!important;max-height:none!important}}#memu-r0c0m0:checked~.menu-links,#memu-r3c1m0:checked~.menu-links{background-color:#fff!important}#memu-r0c0m0:checked~.menu-links a,#memu-r0c0m0:checked~.menu-links span{color:#000!important}#memu-r3c1m0:checked~.menu-links a,#memu-r3c1m0:checked~.menu-links span{color:#171719!important}</style></head><body style="background-color:#f6eeeb;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f6eeeb" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1;background-position:center top" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:30px;line-height:30px;font-size:1px"> </div><table border="0" cellpadding="15" cellspacing="0" class="text_block block-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Lato,Tahoma,Verdana,Segoe,sans-serif;mso-line-height-alt:21px;color:#000;line-height:1.5"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:25.5px;letter-spacing:6px"><span style="font-size:17px"><strong>S P A</strong></span></p></div></div></td></tr></table><table border="0" cellpadding="15" cellspacing="0" class="heading_block block-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><h1 style="margin:0;color:#000;direction:ltr;font-family:Quattrocento,\'Trebuchet MS\',Helvetica,sans-serif;font-size:37px;font-weight:400;letter-spacing:normal;line-height:120%;text-align:center;margin-top:0;margin-bottom:0">It\'s totally understandable <br>that <strong>plans change.</strong><br></h1></td></tr></table><table border="0" cellpadding="0" cellspacing="0" class="text_block block-4" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad" style="padding-bottom:15px;padding-left:30px;padding-right:30px;padding-top:10px"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Lato,Tahoma,Verdana,Segoe,sans-serif;mso-line-height-alt:21px;color:#000;line-height:1.5"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:21px">Your appointment on {{date}} at {{time}} with {{administrator}} has been<strong>cancelled</strong>.</p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f4d9d1;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:55px;line-height:55px;font-size:1px"> </div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>',
        templateName: 'AppointmentCancellation',
        textPart: 'Your appointment on {{date}} at {{time}} with {{administrator}} has been cancelled.',
      },
    });

    // SQS
    const emailQueue = new Queue(this, `${props.appName}-${props.envName}-emailDelivery`, {
      queueName: `${props.appName}-${props.envName}-emailDelivery`,
      retentionPeriod: Duration.minutes(1),
      // TODO Remove in Prod
      deadLetterQueue: {
        queue: new Queue(this, `${props.appName}-${props.envName}-sendEmailDeadLetter`, {
          queueName: `${props.appName}-${props.envName}-sendEmailDeadLetter`,
        }),
        maxReceiveCount: 1,
      },
    });

    // Email Lambda
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `${props.appName}-${props.envName}-SendEmail`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmail/main.ts',
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'info@example.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailConsumerRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaSQSQueueExecutionRole'),
        ],
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
    // Event Source Mapping to SQS
    new EventSourceMapping(this, 'SendEmailSQSEvent', {
      target: sendEmailFunction,
      batchSize: 10,
      eventSourceArn: emailQueue.queueArn,
    });

    // Email Lambda v2
    const sendEmailv2Function = new NodejsFunction(this, 'SendEmailv2Function', {
      functionName: `${props.appName}-${props.envName}-SendEmailv2`,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: 'src/lambda/sendEmailv2/main.ts',
      environment: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'info@example.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
      role: new Role(this, 'SendEmailv2ConsumerRole', {
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
      // role: new Role(this, 'SendRemindersConsumerRole', {
      //   assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      //   managedPolicies: [
      //     ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      //     ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEventBridgeFullAccess'),
      //   ],
      // }),
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
    cronRule.addTarget(new LambdaFunction(sendEmailFunction));

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
      new LambdaFunction(sendEmailv2Function, {
        //deadLetterQueue: SqsQueue,
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

    new CfnOutput(this, 'EmailQueueArn', {
      value: emailQueue.queueArn,
      exportName: `${props.appName}-${props.envName}-emailQueueArn`,
    });

    new CfnOutput(this, 'SendEmailFunctionArn', {
      value: sendEmailFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendEmailFunctionArn`,
    });

    new CfnOutput(this, 'SendEmailv2FunctionArn', {
      value: sendEmailv2Function.functionArn,
      exportName: `${props.appName}-${props.envName}-sendEmailv2FunctionArn`,
    });

    new CfnOutput(this, 'SendRemindersFunctionArn', {
      value: sendRemindersFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendRemindersFunctionArn`,
    });

    /***
     *** Properties
     ***/

    this.queueArn = emailQueue.queueArn;
    this.eventBusArn = eventBus.eventBusArn;
  }
}
