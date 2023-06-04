import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetAppointmentCounts Request: ', ctx);

  return {
    version: '2017-02-28',
    operation: 'Query',
    query: {
      expression: 'pk = :key AND sk = :date',
      expressionValues: {
        ':key': util.dynamodb.toDynamoDB('key'),
        ':date': util.dynamodb.toDynamoDB(ctx.args.date),
      },
    },
    scanIndexForward: true,
  };
}

export function response(ctx) {
  console.log('🔔 GetAppointmentCounts Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  if (ctx.result.items) {
    return ctx.result.items.find((x) => x.sk === ctx.args.date).count;
  }
  return 0;
}
