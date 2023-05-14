import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  AdminRemoveUserFromGroupCommand,
  AdminRemoveUserFromGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

async function addUserToGroup(userId: string, groupName: string): Promise<Boolean> {
  let result = await adminAddUserToGroup({
    userPoolId: process.env.USER_POOL_ID || '',
    username: userId,
    groupName: groupName,
  });

  console.log('🔔 Add user to group result: ', result);

  if (result.$metadata.httpStatusCode === 200) {
    result = await adminRemoveUserFromGroup({
      userPoolId: process.env.USER_POOL_ID || '',
      username: userId,
      groupName: 'Public',
    });
  }

  console.log('✅ Remove user from group result: ', result);

  return true;
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

async function adminRemoveUserFromGroup({ userPoolId, username, groupName }: { userPoolId: string; username: string; groupName: string }) {
  const client = new CognitoIdentityProviderClient({});

  const params: AdminRemoveUserFromGroupCommandInput = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  const command = new AdminRemoveUserFromGroupCommand(params);
  return await client.send(command);
}

export default addUserToGroup;
