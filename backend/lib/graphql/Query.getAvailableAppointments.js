import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    version: '2017-02-28',
    operation: 'Query',
    query: {
      expression: 'pk = :pk AND begins_with(sk, :sk)',
      expressionValues: {
        ':pk': util.dynamodb.toDynamoDB('appt'),
        ':sk': util.dynamodb.toDynamoDB(ctx.args.date),
      },
    },
    filter: {
      expression: '#status = :s',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':s': util.dynamodb.toDynamoDB('open'),
      },
    },
  };
}

export function response(ctx) {
  return ctx.result;
}
