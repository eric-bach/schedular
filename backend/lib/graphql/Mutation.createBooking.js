import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 CreateBooking Request: ', ctx);

  const bookingId = util.autoId();
  const { envName, pk, sk, appointmentDetails, customer } = ctx.args.input;

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: `schedular-${envName}-Data`,
        operation: 'PutItem',
        key: {
          pk: util.dynamodb.toDynamoDB(`booking#${bookingId}`),
          sk: util.dynamodb.toDynamoDB(sk),
        },
        attributeValues: {
          type: util.dynamodb.toDynamoDB('booking'),
          appointmentDetails: util.dynamodb.toDynamoDB({
            pk: pk,
            sk: sk,
            status: 'booked',
            type: appointmentDetails.type,
            category: appointmentDetails.category,
            duration: appointmentDetails.duration,
          }),
          customerId: util.dynamodb.toDynamoDB(`user#${customer.id}`),
          customerDetails: util.dynamodb.toDynamoDB({
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
          }),
          createdAt: util.dynamodb.toDynamoDB(util.time.nowISO8601()),
          updatedAt: util.dynamodb.toDynamoDB(util.time.nowISO8601()),
        },
      },
      {
        table: `schedular-${envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(pk),
          sk: util.dynamodb.toDynamoDB(sk),
        },
        update: {
          expression: 'SET #status = :booked, bookingId = :bookingId, customerDetails = :customerDetails, updatedAt = :updatedAt',
          expressionNames: {
            '#status': 'status',
          },
          expressionValues: {
            ':booked': util.dynamodb.toDynamoDB('booked'),
            ':bookingId': util.dynamodb.toDynamoDB(bookingId),
            ':customerDetails': util.dynamodb.toDynamoDB({
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
            }),
            ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
          },
        },
        condition: {
          expression: '#status = :available AND attribute_not_exists(bookingId)',
          expressionNames: {
            '#status': 'status',
          },
          expressionValues: {
            ':available': util.dynamodb.toDynamoDB('available'),
          },
        },
      },
    ],
  };
}

export function response(ctx) {
  console.log('🔔 CreateAppointment Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
