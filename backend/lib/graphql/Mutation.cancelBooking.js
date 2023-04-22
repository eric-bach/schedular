import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 CancelBooking Request: ', ctx);

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: `schedular-${ctx.args.input.envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(ctx.args.input.bookingId),
          sk: util.dynamodb.toDynamoDB(ctx.args.input.sk),
        },
        update: {
          expression: `SET appointmentDetails: ${util.dynamodb.toDynamoDB({ status: 'cancelled' })}, updatedAt = :updatedAt`,
          expressionValues: {
            ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
          },
        },
      },
      {
        table: `schedular-${ctx.args.input.envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(ctx.args.input.appointmentId),
          sk: util.dynamodb.toDynamoDB(ctx.args.input.sk),
        },
        update: {
          expression: 'SET #status = :available, updatedAt = :updatedAt REMOVE bookingId, customerDetails',
          expressionNames: {
            '#status': 'status',
          },
          expressionValues: {
            ':available': util.dynamodb.toDynamoDB('available'),
            ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
          },
        },
      },
    ],
  };
}

export function response(ctx) {
  console.log('🔔 CancelAppointment Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
