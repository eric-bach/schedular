import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetBookings Request: ', ctx);

  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'customerId-gsi',
    query: {
      expression: 'customerId = :customerId AND sk >= :datetime',
      expressionValues: {
        ':customerId': util.dynamodb.toDynamoDB(`user#${ctx.args.customerId}`),
        ':datetime': util.dynamodb.toDynamoDB(ctx.args.datetime),
      },
    },
    filter: {
      expression: '#type = :type',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB('booking'),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 GetBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
