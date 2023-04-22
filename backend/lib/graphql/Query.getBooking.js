import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetBooking Request: ', ctx);
  const appointment = ctx.prev.result.keys.find((k) => k.pk.startsWith('booking#'));

  return {
    version: '2017-02-28',
    operation: 'Query',
    query: {
      expression: 'pk = :pk AND sk = :sk',
      expressionValues: {
        ':pk': util.dynamodb.toDynamoDB(appointment.pk),
        ':sk': util.dynamodb.toDynamoDB(appointment.sk),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 GetBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result.items[0];
}
