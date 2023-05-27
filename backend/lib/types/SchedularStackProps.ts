import { StackProps } from 'aws-cdk-lib';

export interface SchedularBaseStackProps extends StackProps {
  appName: string;
  envName: string;
}

export interface SchedularFrontendStackProps extends SchedularBaseStackProps {
  params: {
    certificateArn: string;
  };
}

export interface SchedularMessagingStackProps extends SchedularBaseStackProps {
  params: {
    dataTableArn: string;
    sendEmailFunctionArn: string;
  };
}

export interface SchedularApiStackProps extends SchedularBaseStackProps {
  params: {
    userPoolId: string;
    dataTableArn: string;
  };
}
