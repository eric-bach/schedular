import { StackProps } from 'aws-cdk-lib';

export interface AdventBaseStackProps extends StackProps {
  appName: string;
  envName: string;
}

export interface AdventFrontendStackProps extends AdventBaseStackProps {
  params: {
    certificateArn: string;
  };
}

export interface AdventMessagingStackProps extends AdventBaseStackProps {
  params: {
    dlqNotifications: string;
  };
}

export interface AdventApiStackProps extends AdventBaseStackProps {
  params: {
    userPoolId: string;
    dataTableArn: string;
  };
}

export interface GitHubStackProps extends StackProps {
  readonly repositoryConfig: { owner: string; repo: string; filter?: string }[];
}
