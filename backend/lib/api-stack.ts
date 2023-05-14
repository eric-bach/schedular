import { Stack, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  AppsyncFunction,
  AuthorizationType,
  Code,
  DynamoDbDataSource,
  FieldLogLevel,
  FunctionRuntime,
  GraphqlApi,
  InlineCode,
  Resolver,
  SchemaFile,
} from 'aws-cdk-lib/aws-appsync';
import { EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { aws_ses as ses } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventSourceMapping, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

const dotenv = require('dotenv');
import * as path from 'path';
import { SchedularApiStackProps } from './types/SchedularStackProps';

dotenv.config();

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SchedularApiStackProps) {
    super(scope, id, props);

    const userPool = UserPool.fromUserPoolId(this, 'userPool', props.params.userPoolId);
    const dataTable = Table.fromTableArn(this, 'table', props.params.dataTableArn);

    // SES
    const emailIdentity = new EmailIdentity(this, 'Identity', {
      identity: { value: process.env.SENDER_EMAIL || 'info@example.com' },
    });

    const cfnTemplate = new ses.CfnTemplate(this, 'confirmationEmail', {
      template: {
        subjectPart: 'Appointment Confirmation',
        htmlPart:
          '<!DOCTYPE html><html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml"><head><title></title><meta content="text/html; charset=utf-8" http-equiv="Content-Type"><meta content="width=device-width,initial-scale=1" name="viewport"><!--[if mso]><xml><o:officedocumentsettings><o:pixelsperinch>96</o:pixelsperinch><o:allowpng></o:officedocumentsettings></xml><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Permanent+Marker" rel="stylesheet" type="text/css"><!--<![endif]--><style>*{box-sizing:border-box}body{margin:0;padding:0}a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}#MessageViewBody a{color:inherit;text-decoration:none}p{line-height:inherit}.desktop_hide,.desktop_hide table{mso-hide:all;display:none;max-height:0;overflow:hidden}.image_block img+div{display:none}@media (max-width:700px){.desktop_hide table.icons-inner,.social_block.desktop_hide .social-table{display:inline-block!important}.icons-inner{text-align:center}.icons-inner td{margin:0 auto}.row-content{width:100%!important}.mobile_hide{display:none}.stack .column{width:100%;display:block}.mobile_hide{min-height:0;max-height:0;max-width:0;overflow:hidden;font-size:0}.desktop_hide,.desktop_hide table{display:table!important;max-height:none!important}}</style></head><body style="background-color:#f9f9f9;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#f9f9f9" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#5d77a9;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad" style="padding-bottom:10px;padding-top:10px;width:100%;padding-right:0;padding-left:0"><div align="center" class="alignment" style="line-height:10px"><img alt="Yourlogo Light" src="images/Yourlogo-light.png" style="display:block;height:auto;border:0;width:268px;max-width:100%" title="Yourlogo Light" width="268"></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#cbdbef;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:20px;padding-top:20px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:70px;line-height:70px;font-size:1px"> </div><table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad" style="width:100%;padding-right:0;padding-left:0"><div align="center" class="alignment" style="line-height:10px"><img alt="Check Icon" src="images/check-icon.png" style="display:block;height:auto;border:0;width:93px;max-width:100%" title="Check Icon" width="93"></div></td></tr></table><table border="0" cellpadding="0" cellspacing="0" class="text_block block-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad" style="padding-bottom:25px;padding-left:20px;padding-right:20px;padding-top:10px"><div style="font-family:Georgia,\'Times New Roman\',serif"><div class="" style="font-size:14px;font-family:Georgia,Times,\'Times New Roman\',serif;mso-line-height-alt:16.8px;color:#2f2f2f;line-height:1.2"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:42px">Appointment Confirmed</span></p></div></div></td></tr></table><table border="0" cellpadding="0" cellspacing="0" class="text_block block-4" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad" style="padding-bottom:10px;padding-left:30px;padding-right:30px;padding-top:10px"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:21px;color:#2f2f2f;line-height:1.5"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:24px"><span style="font-size:16px">Hi<strong><u>{{name}}</u></strong>,</span></p><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:21px"> </p><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:24px"><span style="font-size:16px">Thank you for booking your appointment on<strong><span style="">{{date}}</span></strong></span></p><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:24px"><span style="font-size:16px">with<strong><span style="">{{administrator}}</span></strong></span></p><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:21px"> </p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:5px;padding-top:5px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="50%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td><td class="column column-2" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="50%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fae890;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="50%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td><td class="column column-2" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="50%"><table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#5d77a9;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:5px;padding-top:5px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px"> </div><table border="0" cellpadding="0" cellspacing="0" class="image_block block-2" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad" style="width:100%;padding-right:0;padding-left:0"><div align="center" class="alignment" style="line-height:10px"><img alt="Yourlogo Light" src="images/Yourlogo-light.png" style="display:block;height:auto;border:0;width:204px;max-width:100%" title="Yourlogo Light" width="204"></div></td></tr></table><table border="0" cellpadding="10" cellspacing="0" class="social_block block-3" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad"><div align="center" class="alignment"><table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;display:inline-block" width="108px"><tr><td style="padding:0 2px 0 2px"><a href="https://www.facebook.com/" target="_blank"><img alt="Facebook" height="32" src="images/facebook2x.png" style="display:block;height:auto;border:0" title="Facebook" width="32"></a></td><td style="padding:0 2px 0 2px"><a href="https://twitter.com/" target="_blank"><img alt="Twitter" height="32" src="images/twitter2x.png" style="display:block;height:auto;border:0" title="Twitter" width="32"></a></td><td style="padding:0 2px 0 2px"><a href="https://instagram.com/" target="_blank"><img alt="Instagram" height="32" src="images/instagram2x.png" style="display:block;height:auto;border:0" title="Instagram" width="32"></a></td></tr></table></div></td></tr></table><table border="0" cellpadding="10" cellspacing="0" class="text_block block-4" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad"><div style="font-family:sans-serif"><div class="" style="font-size:14px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:21px;color:#f9f9f9;line-height:1.5"><p style="margin:0;font-size:12px;text-align:center;mso-line-height-alt:18px"><span style="font-size:12px">Your Street 12, 34567 AB City</span></p><p style="margin:0;font-size:12px;text-align:center;mso-line-height-alt:18px"><span style="font-size:12px">info@example.com</span></p><p style="margin:0;font-size:12px;text-align:center;mso-line-height-alt:18px"><span style="font-size:12px">(+1) 123 456 789</span></p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#5d77a9;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:20px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><table border="0" cellpadding="10" cellspacing="0" class="text_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word" width="100%"><tr><td class="pad"><div style="font-family:sans-serif"><div class="" style="font-size:12px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:14.399999999999999px;color:#cfceca;line-height:1.2"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:12px">2023 © All Rights Reserved</span></p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tbody><tr><td><table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:680px" width="680"><tbody><tr><td class="column column-1" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:5px;padding-top:5px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0" width="100%"><table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="pad" style="vertical-align:middle;color:#9d9d9d;font-family:inherit;font-size:15px;padding-bottom:5px;padding-top:5px;text-align:center"><table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0" width="100%"><tr><td class="alignment" style="vertical-align:middle;text-align:center"><!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0;padding-right:0;mso-table-lspace:0;mso-table-rspace:0"><![endif]--><!--[if !vml]><!--><table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;display:inline-block;margin-right:-4px;padding-left:0;padding-right:0"><!--<![endif]--><tr><td style="vertical-align:middle;text-align:center;padding-top:5px;padding-bottom:5px;padding-left:5px;padding-right:6px"><a href="https://www.designedwithbee.com/" style="text-decoration:none" target="_blank"><img align="center" alt="Designed with BEE" class="icon" height="32" src="images/bee.png" style="display:block;height:auto;margin:0 auto;border:0" width="34"></a></td><td style="font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:15px;color:#9d9d9d;vertical-align:middle;letter-spacing:undefined;text-align:center"><a href="https://www.designedwithbee.com/" style="color:#9d9d9d;text-decoration:none" target="_blank">Designed with BEE</a></td></tr></table></td></tr></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>',
        templateName: 'apptConfirmation',
        textPart: 'Hi {{name}},\r\nThank you for booking your appointment on {{date}} with {{administrator}}.',
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

    // Lambdas
    const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
      functionName: `${props.appName}-${props.envName}-send-email`,
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

    // Resolver for Cognito user service
    const userServiceFunction = new NodejsFunction(this, 'userService', {
      functionName: `${props.appName}-${props.envName}-userService`,
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.resolve(__dirname, '../src/lambda/userService/main.ts'),
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        REGION: this.region,
        USER_POOL_ID: userPool.userPoolId,
      },
    });
    userServiceFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-idp:ListUsersInGroup', 'cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRemoveUserFromGroup'],
        resources: [userPool.userPoolArn],
      })
    );

    // AppSync API
    const api = new GraphqlApi(this, `${props.appName}Api`, {
      name: `${props.appName}-${props.envName}-api`,
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: SchemaFile.fromAsset(path.join(__dirname, './graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
    });

    // AppSync DataSources
    const userServiceLambdaDataSource = api.addLambdaDataSource('upsertAppointmentsDataSource', userServiceFunction, {
      name: 'userServiceLambdaDataSource',
    });
    const dynamoDbDataSource = new DynamoDbDataSource(this, `dynamoDBDataSource`, {
      api: api,
      table: dataTable,
      description: 'DynamoDbDataSource',
      name: 'dynamoDBDataSource',
      serviceRole: new Role(this, `${props.appName}ApiServiceRole`, {
        assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        roleName: `${props.appName}-dynamoDb-service-role-${props.envName}`,
        inlinePolicies: {
          name: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:ConditionCheckItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:DescribeTable',
                  'dynamodb:GetItem',
                  'dynamodb:GetRecords',
                  'dynamodb:GetShardIterator',
                  'dynamodb:PutItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                  'dynamodb:UpdateItem',
                ],
                resources: [dataTable.tableArn + '/*'],
              }),
            ],
          }),
        },
      }),
    });
    const httpDataSource = api.addHttpDataSource('httpDataSource', `https://sqs.${this.region}.amazonaws.com`, {
      name: 'httpDataSource',
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: 'sqs',
      },
    });

    emailQueue.grantSendMessages(httpDataSource.grantPrincipal);

    // AppSync JS Resolvers
    const getAvailableAppointmentsFunc = new AppsyncFunction(this, 'getAvailableAppointmentsFunction', {
      name: 'getAvailableAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAvailableAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentFunc = new AppsyncFunction(this, 'getAppointmentFunction', {
      name: 'getAppointmentFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointment.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingFunc = new AppsyncFunction(this, 'getBookingFunction', {
      name: 'getBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getAppointmentsFunction = new AppsyncFunction(this, 'getAppointmentsFunction', {
      name: 'getAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const getBookingsFunction = new AppsyncFunction(this, 'getBookingsFunction', {
      name: 'getBookingsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Query.getBookings.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const createBookingFunction = new AppsyncFunction(this, 'createBookingFunction', {
      name: 'createBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.createBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const cancelBookingFunction = new AppsyncFunction(this, 'cancelBookingFunction', {
      name: 'cancelBookingFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.cancelBooking.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const sqsSendEMailFunction = new AppsyncFunction(this, 'SqsSendEmailFunction', {
      name: 'sqsSendEmail',
      api: api,
      dataSource: httpDataSource,
      // Have to use inline code to set dynamic resourcePath
      code: Code.fromInline(`
        import { util } from '@aws-appsync/utils';

        export function request(ctx) {
          console.log('🔔 SqsSendEmailFunction Request:', ctx);

          const message = util.urlEncode(ctx.prev.result);
          return {
            version: '2018-05-29',
            method: 'POST',
            params: {
              body: \`Action=SendMessage&MessageBody=$\{message\}&Version=2012-11-05\`,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
            resourcePath: '/${this.account}/${emailQueue.queueName}/',
          };
        }

        export function response(ctx) {
          console.log('🔔 SqsSendEmailFunction Response:', ctx);

          if (ctx.error) {
            util.error(ctx.error.message, ctx.error.type, ctx.result);
          }
          return ctx.prev.result;
        }
      `),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const upsertAppointmentsFunction = new AppsyncFunction(this, 'upsertAppointmentsFunction', {
      name: 'upsertAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.createAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    const deleteAppointmentsFunction = new AppsyncFunction(this, 'deleteAppointmentsFunction', {
      name: 'deleteAppointmentsFunction',
      api: api,
      dataSource: dynamoDbDataSource,
      code: Code.fromAsset(path.join(__dirname, '/graphql/Mutation.deleteAppointments.js')),
      runtime: FunctionRuntime.JS_1_0_0,
    });
    userServiceLambdaDataSource.createResolver(`${props.appName}-${props.envName}-listUsersInGroupResolver`, {
      typeName: 'Query',
      fieldName: 'listUsersInGroup',
    });
    userServiceLambdaDataSource.createResolver(`${props.appName}-${props.envName}-addUserToGroupResolver`, {
      typeName: 'Mutation',
      fieldName: 'addUserToGroup',
    });

    const passthrough = InlineCode.fromInline(`
        // The before step
        export function request(...args) {
          console.log("ℹ️ Request: ", args);
          return {}
        }

        // The after step
        export function response(ctx) {
          console.log("✅ Response: ", ctx.prev.result);
          return ctx.prev.result
        }
    `);

    const getAvailableAppointmentsResolver = new Resolver(this, 'getAvailableAppointmentsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAvailableAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAvailableAppointmentsFunc],
      code: passthrough,
    });
    const getAppointmentResolver = new Resolver(this, 'getAppointmentResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointment',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentFunc],
      code: passthrough,
    });
    const getAppointmentsResolver = new Resolver(this, 'getAppointmentsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAppointmentsFunction],
      code: passthrough,
    });
    const getBookingsResolver = new Resolver(this, 'getBookingsResolver', {
      api: api,
      typeName: 'Query',
      fieldName: 'getBookings',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getBookingsFunction],
      code: passthrough,
    });
    const createBookingResolver = new Resolver(this, 'createBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'createBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createBookingFunction, getBookingFunc, sqsSendEMailFunction],
      code: passthrough,
    });
    const cancelBookingResolver = new Resolver(this, 'cancelBookingResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'cancelBooking',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [cancelBookingFunction, getBookingFunc, sqsSendEMailFunction],
      code: passthrough,
    });
    const upsertDeleteAppointmentsResolver = new Resolver(this, 'upsertDeleteAppointmentsResolver', {
      api: api,
      typeName: 'Mutation',
      fieldName: 'upsertDeleteAppointments',
      runtime: FunctionRuntime.JS_1_0_0,
      pipelineConfig: [upsertAppointmentsFunction, deleteAppointmentsFunction],
      code: passthrough,
    });

    /***
     *** Outputs
     ***/

    new CfnOutput(this, 'VerifiedEmailIdentity', {
      value: emailIdentity.emailIdentityName,
      exportName: `${props.appName}-${props.envName}-emailIdentity`,
    });

    new CfnOutput(this, 'EmailQueueArn', {
      value: emailQueue.queueArn,
      exportName: `${props.appName}-${props.envName}-emailQueueArn`,
    });

    new CfnOutput(this, 'SendEmailFunctionArn', {
      value: sendEmailFunction.functionArn,
      exportName: `${props.appName}-${props.envName}-sendEmailFunctionArn`,
    });

    new CfnOutput(this, 'AppSyncGraphqlEndpoint', {
      value: api.graphqlUrl,
      exportName: `${props.appName}-${props.envName}-graphqlUrl`,
    });
  }
}
