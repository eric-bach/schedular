import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminAddUserToGroupCommandInput } from '@aws-sdk/client-cognito-identity-provider';

async function addUserToGroup(userId: string, groupName: string): Promise<void> {
  await adminAddUserToGroup({
    userPoolId: process.env.USER_POOL_ID || '',
    username: userId,
    groupName: groupName,
  });
}

async function adminAddUserToGroup({ userPoolId, username, groupName }: { userPoolId: string; username: string; groupName: string }) {
  const client = new CognitoIdentityProviderClient({});

  const params: AdminAddUserToGroupCommandInput = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  const command = new AdminAddUserToGroupCommand(params);
  return await client.send(command);
}

export default addUserToGroup;
