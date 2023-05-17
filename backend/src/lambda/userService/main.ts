import addUserToGroup from './addUserToGroup';
import listUsersInGroup from './listUsersInGroup';

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    groupName: string;
    limit: number;
    nextToken: string;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  console.debug(`🕧 AppSync event: ${JSON.stringify(event)}`);
  console.debug(`🕧 AppSync info: ${JSON.stringify(event.info)}`);
  console.debug(`🕧 AppSync arguments: ${JSON.stringify(event.arguments)}`);

  switch (event.info.fieldName) {
    // Queries
    case 'listUsersInGroup':
      console.debug(`🔔 ListUsersInGroup: ${JSON.stringify(event.arguments.groupName)}`);
      return await listUsersInGroup(event.arguments.groupName, event.arguments.limit ?? 0, event.arguments.nextToken);

    // Mutations
    case 'addUserToGroup':
      console.debug(`🔔 AddUserToGroup ${event.info.fieldName}`);
      return await addUserToGroup(event.arguments.userId, event.arguments.groupName);

    default:
      console.error(`🛑 No AppSync resolver defined for ${event.info.fieldName}`);
      return null;
  }
};
