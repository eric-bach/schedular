import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 CreateBooking Request: ', ctx);

  const bookingId = util.autoId();
  const { pk, sk, administratorDetails, appointmentDetails, customer } = ctx.args.input;

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: `schedular-Data`,
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
          administratorDetails: util.dynamodb.toDynamoDB({
            id: administratorDetails.id,
            firstName: administratorDetails.firstName,
            lastName: administratorDetails.lastName,
          }),
          status: util.dynamodb.toDynamoDB('booked'),
          customerId: util.dynamodb.toDynamoDB(customer.id),
          createdAt: util.dynamodb.toDynamoDB(util.time.nowISO8601()),
          updatedAt: util.dynamodb.toDynamoDB(util.time.nowISO8601()),
        },
      },
      {
        table: `schedular-Data`,
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
  console.log('🔔 CreateBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
