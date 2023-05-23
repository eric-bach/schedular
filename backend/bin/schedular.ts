#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { SchedularBaseStackProps } from '../lib/types/SchedularStackProps';
import { APP_NAME } from '../lib/constants';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { MessagingStack } from '../lib/messaging-stack';

const app = new cdk.App();

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

    const database = new DatabaseStack(app, `${APP_NAME}-database-${envName}`, baseProps);

    const messaging = new MessagingStack(app, `${APP_NAME}-messaging-${envName}`, {
      ...baseProps,
      params: { dataTableArn: database.dataTableArn },
    });

    new ApiStack(app, `${APP_NAME}-api-${envName}`, {
      ...baseProps,
      params: {
        userPoolId: auth.userPoolId,
        dataTableArn: database.dataTableArn,
        eventBusArn: messaging.eventBusArn,
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
