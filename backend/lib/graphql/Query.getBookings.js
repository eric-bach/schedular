import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetBookings Request: ', ctx);

  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'type-gsi',
    query: {
      expression: '#type = :type AND begins_with(sk, :datetime)',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB('booking'),
        ':datetime': util.dynamodb.toDynamoDB(ctx.args.datetime),
      },
    },
    filter: {
      expression: 'appointmentDetails.#status = :booked',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':booked': util.dynamodb.toDynamoDB('booked'),
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
