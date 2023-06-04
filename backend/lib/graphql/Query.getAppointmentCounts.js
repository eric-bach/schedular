import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetAppointmentCounts Request: ', ctx);

  return {
    version: '2017-02-28',
    operation: 'Query',
    query: {
      expression: 'pk = :key AND sk BETWEEN :fromDate AND :toDate',
      expressionValues: {
        ':key': util.dynamodb.toDynamoDB(ctx.args.type),
        ':fromDate': util.dynamodb.toDynamoDB(ctx.args.from),
        ':toDate': util.dynamodb.toDynamoDB(ctx.args.to),
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
  return ctx.result;
}
