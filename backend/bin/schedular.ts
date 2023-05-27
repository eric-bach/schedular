#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { SchedularBaseStackProps } from '../lib/types/SchedularStackProps';
import { DataMessagingStack } from '../lib/data-messaging-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

export const APP_NAME = 'schedular';

const envName = app.node.tryGetContext('env');
const stage = app.node.tryGetContext('stage');

const baseProps: SchedularBaseStackProps = {
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  appName: APP_NAME,
  envName: envName,
  tags: {
    environment: envName,
    application: APP_NAME,
  },
};

switch (stage) {
  case 'backend': {
    const auth = new AuthStack(app, `${APP_NAME}-auth-${envName}`, baseProps);

    const dataMessaging = new DataMessagingStack(app, `${APP_NAME}-data-messaging-${envName}`, baseProps);

    new ApiStack(app, `${APP_NAME}-api-${envName}`, {
      ...baseProps,
      params: {
        userPoolId: auth.userPoolId,
        dataTableArn: dataMessaging.dataTableArn,
      },
    });

    break;
  }

  case 'frontend': {
    new FrontendStack(app, `${APP_NAME}-frontend-${envName}`, {
      ...baseProps,
      params: {
        certificateArn: process.env.CERTIFICATE_ARN ?? 'not_an_arn',
      },
    });

    break;
  }
}
