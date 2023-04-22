import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'type-gsi',
    query: {
      expression: '#type = :type AND sk BETWEEN :fromDate AND :toDate',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB('appt'),
        ':fromDate': util.dynamodb.toDynamoDB(ctx.args.from),
        ':toDate': util.dynamodb.toDynamoDB(ctx.args.to),
      },
    },
    filter: {
      expression: '#status = :s',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':s': util.dynamodb.toDynamoDB('available'),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 GetAvailableAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
