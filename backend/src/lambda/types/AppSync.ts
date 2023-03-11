export type LastEvaluatedKey = {
  pk: string;
  sk: string;
};

export type BookingInput = {
  pk: string;
  sk: string;
  customer: string;
};

export type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    date: string;
    lastEvaluatedKey: LastEvaluatedKey;

    bookingInput: BookingInput;
  };
  identity: {
    username: string;
    claims: {
      [key: string]: string[];
    };
  };
};
