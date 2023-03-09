export type LastEvaluatedKey = {
  userId: string;
  sk: string;
};

export type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    date: string;
    lastEvaluatedKey: LastEvaluatedKey;
  };
  identity: {
    username: string;
    claims: {
      [key: string]: string[];
    };
  };
};
