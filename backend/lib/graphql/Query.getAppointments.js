import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'date-gsi',
    query: {
      expression: '#date = :date',
      expressionNames: {
        '#date': 'date',
      },
      expressionValues: {
        ':date': util.dynamodb.toDynamoDB(`appt#${ctx.args.date}`),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 GetAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
