import { ListUsersInGroupRequest, ListUsersInGroupCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

type User = {
  id: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  email: string | undefined;
  phoneNumber: string | undefined;
};

async function listUsersInGroup(groupName: string) {
  const client = new CognitoIdentityProviderClient({});
  const input: ListUsersInGroupRequest = {
    UserPoolId: process.env.USER_POOL_ID,
    GroupName: groupName,
  };

  const command = new ListUsersInGroupCommand(input);
  const response = await client.send(command);

  const users: User[] = [];
  response.Users?.map((u) => {
    const user = {
      id: u.Username,
      firstName: u.Attributes?.find((s) => s.Name === 'given_name')?.Value,
      lastName: u.Attributes?.find((s) => s.Name === 'family_name')?.Value,
      email: u.Attributes?.find((s) => s.Name === 'email')?.Value,
      phoneNumber: u.Attributes?.find((s) => s.Name === 'phone_number')?.Value,
    };

    console.log(user);
    users.push(user);
  });

  console.log('✅ Retrieved users', users);
  return users;
}

export default listUsersInGroup;
