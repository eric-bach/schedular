import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { Handler, PostConfirmationTriggerEvent, Context, Callback } from 'aws-lambda';

export const handler: Handler = async (event: PostConfirmationTriggerEvent, context: Context, callback: Callback): Promise<void> => {
  console.log('EVENT:', event);
  console.log('CONTEXT:', context);
  console.log('CALLBACK:', callback);

  const { userPoolId, userName } = event;

  await adminAddUserToGroup({
    userPoolId,
    username: userName,
    groupName: 'Public',
  });

  return callback(null, event);

  // TODO Use a try-catch instead (doesn't build)
  /*
    try {
      await adminAddUserToGroup({
        userPoolId,
        username: userName,
        groupName: 'Users',
      });
  
      return callback(null, event);
    } catch (error: any) {
      return callback(error, event);
    }
    */
};

export async function adminAddUserToGroup({
  userPoolId,
  username,
  groupName,
}: {
  userPoolId: string;
  username: string;
  groupName: string;
}) {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

  const params: AdminAddUserToGroupCommandInput = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  };

  const command = new AdminAddUserToGroupCommand(params);
  return await client.send(command);
}
