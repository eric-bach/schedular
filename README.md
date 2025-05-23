<h1 align="center">
  <p align="center">
    Schedular
  </p>
</h1>

[![Build](https://github.com/eric-bach/schedular/actions/workflows/test.yml/badge.svg)](https://github.com/eric-bach/schedular/actions/workflows/test.yml)
[![Deploy](https://github.com/eric-bach/schedular/actions/workflows/deploy.yml/badge.svg)](https://github.com/eric-bach/schedular/actions/workflows/deploy.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/eric-bach/schedular/badge?s=5328dde3eb9cb4aa1d0e1f9dcc877fd08654c714)](https://www.codefactor.io/repository/github/eric-bach/schedular)

<p align="center">
  <a href="#getting-started">Getting Started</a> |
  <a href="#architecture">Architecture</a> |
  <a href="#deployment">Development</a> |
  <a href="#testing">Testing</a>
</p>

<p align="center">
  An appointment scheduling app build with <a href="https://nodejs.org">Node.js</a>
</p>

![](/docs/gif/ezgif-2-379bc4343c.gif)

# Features

🔒 New user sign up

✔ Verified users granted booking access

📖 Custom appointment schedules

🗓️ Book and cancel appointments

📨 Notifications for booking confirmation and upcoming bookings

🧧 View upcoming appointments and bookings

🧑‍🤝‍🧑 Manage client appointments and bookings

# Architecture

![](/docs/img/architecture.jpg)

# Tech Stack

<div>
   <img src="https://github.com/aws-amplify/amplify-ui/raw/main/docs/public/svg/favicon.svg" width=30 /><a href="https://ui.docs.amplify.aws"> Amplify UI</a>
</div>
<div>
   <img src="https://avatars.githubusercontent.com/u/12608521?s=280&v=4" width=30 height=30/><a href="https://www.artillery.io/"> Artillery.io</a>
</div>
<div>
   <img src="https://graphql-cli.com/img/logo.png" width=30 height=30/><a href="https://the-guild.dev/graphql/codegen"> Codegen</a>
</div>
<div>
   <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/GraphQL_Logo.svg/1200px-GraphQL_Logo.svg.png" width=30 height=30/><a href="https://graphql.org"> GraphQL</a>
</div>
<div>
   <img src="https://mui.com/static/logo.png" width=30 /><a href="https://mui.com"> Material UI</a>
</div>
<div>
   <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" width=30 /><a href="https://react.dev"> React JS</a>
</div>
<br />

# Getting Started

This quick start guide describes how to get the application running. An `AWS account` is required to deploy the infrastructure required for this project.

## Configure the app

1.  Clone the project

    ```bash
    $ git clone https://github.com/eric-bach/schedular.git
    ```

2.  Install dependencies for CDK

    ```bash
    $ cd ./backend
    $ npm install
    ```

3.  Install dependencies for the rest of the application using the recursive-install script

    ```bash
    $ cd ./backend
    $ npm run install-all
    ```

4.  Copy the `./backend/.env.example` file to `./backend/.env` and fill in the parameter values (if the app has not been deployed to AWS yet, the ARN will be empty for now):

    - `ADMINISTRATOR_EMAIL` - Email address to notify on application errors
    - `SENDER_EMAIL` - Email address for where notifications are sent from
    - `CERTIFICATE_ARN` - ARN to ACM Certificate for CloudFront Distribution (used for Production only)

5.  Copy the `./frontend/src/aws-exports.js.example` file to `./frontend/src/aws-exports.js` and fill in the parameter values from the CDK stack outputs in step 2:

    - `aws_project_region` - AWS Region of the application
    - `aws_cognito_region` - AWS Region of the Cognito User Pool
    - `aws_user_pools_id` - AWS Cognito User Pool Id
    - `aws_user_pools_web_client_id` - AWS Cognito User Pool Client Id
    - `aws_appsync_region` - AWS Region of AppSync
    - `aws_appsync_graphqlEndpoint` - AWS AppSync GraphQL endpoint URL
    - `aws_appsync_authenticationType` - AWS AppSync Authentication Type
    - `env_name` - Application environment name

## Deploy the app

1.  Follow the steps in [Deployment with CDK CLI](#deployment-with-cdk-cli)

## Running the app locally

1.  Start the frontend:

    ```bash
    // Start frontend on https://localhost:3000
    $ cd frontend
    $ npm run start
    ```

# Deployment

## Deployment with CDK CLI

The Schedular application consists of the CDK backend and React frontend, each of which has an independent method of deploying.

### Deploy backend via CDK script

1. Bootstrap CDK (one-time only)

   ```
   $ cdk bootstrap aws://{ACCOUNT_ID}/{REGION} --profile {PROFILE_NAME}}
   ```

2. Ensure AWS credentials are up to date. If using AWS SSO, authorize a set of temporary credentials

   ```bash
   aws sso login --profile PROFILE_NAME
   ```

3. Deploy the Stacks

   a. To deploy all stacks (backend + frontend)

   ```
   $ npm run deploy dev PROFILE_NAME
   ```

   b. To deploy a specific stage

   ```
   // Deploy a specific stage for the 'dev' environment to the PROFILE_NAME
   $ npm run deploy-backend dev PROFILE_NAME
   $ npm run deploy-frontend dev PROFILE_NAME
   ```

## Deployment with GitHub Actions

1. Deploy the [Github Actions Open ID Connect Provider stack](https://github.com/eric-bach/github-actions-oidc)

2. Repeat step 1 in the Prod account

3. Add the following GitHub Secrets to the repository

   Common

   ```
   CDK_DEFAULT_REGION - AWS default region for all resources to be created
   SENDER_EMAIL - Email address where notifications are sent from
   ADMINISTRATOR_EMAIL - Email address to notify on application errors
   ```

   Dev environment

   ```
   AWS_SERVICE_ROLE_DEV - AWS ARN of the GitHub Actions Role to Assume (from step 1)
   COGNITO_USERPOOL_ID_DEV - Cognito User Pool Id
   COGNITO_WEB_CLIENT_ID_DEV - Cognito User Pool Web Client Id
   GRAPHQL_ENDPOINT_DEV - AppSync GraphQL Endpoint URL
   CYPRESS_USERNAME - A valid Cognito username for Cypress integration testing
   CYPRESS_PASSWORD - The Cognito password for Cypress integration testing
   ```

   Prod environment

   ```
   AWS_SERVICE_ROLE_PROD - AWS ARN of the GitHub Actions Role to Assume (from step 1)
   COGNITO_USERPOOL_ID_PROD - Cognito User Pool Id
   COGNITO_WEB_CLIENT_ID_PROD - Cognito User Pool Web Client Id
   GRAPHQL_ENDPOINT_PROD - AppSync GraphQL Endpoint URL
   CERTIFICATE_ARN_PROD - ARN to ACM certificate for CloudFront Distribution (for Prod only)
   ```

# Seed Data

## Seed Test Data

To seed test data

1. Edit `backend\helpers\seed.ts` with environment name and AWS profile name

   ```
   var appName: string = 'schedular';
   var userId: string = '123';
   var env: string = 'dev';
   var profile: string = 'default';
   ```

2. Run npm to seed data

   ```
   $ npm run seed dev PROFILE_NAME
   ```

# Testing

## Unit Tests

To run the unit tests

1. Get an AWS token

   ```
   aws sso login
   ```

2. Run tests in the backend folder

   ```
   $ npm run test
   ```

## Integration Tests

To run the integration tests

1. Start frontend

   ```
   $ cd frontend
   $ npm run start
   ```

2. Run cypress

   ```
   $ npx cypress run --env url=URL,username=USERNAME,password=PASSWORD
   ```
