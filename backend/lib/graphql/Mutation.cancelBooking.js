import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 CancelBooking Request: ', ctx);

  const { envName, bookingId, appointmentDetails } = ctx.args.input;

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: `schedular-${envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(bookingId),
          sk: util.dynamodb.toDynamoDB(appointmentDetails.sk),
        },
        update: {
          expression: `SET appointmentDetails = :appointmentDetails, updatedAt = :updatedAt`,
          expressionValues: {
            ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
            ':appointmentDetails': util.dynamodb.toDynamoDB({
              pk: appointmentDetails.pk,
              sk: appointmentDetails.sk,
              type: appointmentDetails.type,
              category: appointmentDetails.category,
              duration: appointmentDetails.duration,
              status: 'cancelled',
            }),
          },
        },
      },
      {
        table: `schedular-${envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(appointmentDetails.pk),
          sk: util.dynamodb.toDynamoDB(appointmentDetails.sk),
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
  console.log('🔔 CancelBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
