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
    dlqNotifications: string;
  };
}

export interface SchedularApiStackProps extends SchedularBaseStackProps {
  params: {
    userPoolId: string;
    dataTableArn: string;
  };
}

export interface GitHubStackProps extends StackProps {
  readonly repositoryConfig: { owner: string; repo: string; filter?: string }[];
}
