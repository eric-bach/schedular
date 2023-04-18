import { Context, util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 BookAppointment Request: ', ctx);

  const bookingId = util.autoId();

  return {
    operation: 'TransactWriteItems',
    transactItems: [
      {
        table: `schedular-${ctx.args.bookingInput.envName}-Data`,
        operation: 'PutItem',
        key: {
          pk: util.dynamodb.toDynamoDB(`booking#${bookingId}`),
          sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
        },
        attributeValues: {
          status: util.dynamodb.toDynamoDB('booked'),
          type: util.dynamodb.toDynamoDB('booking'),
          appointmentId: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk.substring(5)), //, ctx.args.bookingInput.pk.length - 1)),
          appointmentDetails: util.dynamodb.toDynamoDB({
            sk: ctx.args.bookingInput.sk,
            duration: ctx.args.bookingInput.appointmentDetails.duration,
            type: ctx.args.bookingInput.appointmentDetails.type,
            category: ctx.args.bookingInput.appointmentDetails.category,
          }),
          customerId: util.dynamodb.toDynamoDB(`user#${ctx.args.bookingInput.customer.id}`),
          customerDetails: util.dynamodb.toDynamoDB({
            id: ctx.args.bookingInput.customer.id,
            firstName: ctx.args.bookingInput.customer.firstName,
            lastName: ctx.args.bookingInput.customer.lastName,
            email: ctx.args.bookingInput.customer.email,
            phone: ctx.args.bookingInput.customer.phone,
          }),
        },
      },
      {
        table: `schedular-${ctx.args.bookingInput.envName}-Data`,
        operation: 'UpdateItem',
        key: {
          pk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk),
          sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
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
              id: ctx.args.bookingInput.customer.id,
              firstName: ctx.args.bookingInput.customer.firstName,
              lastName: ctx.args.bookingInput.customer.lastName,
              email: ctx.args.bookingInput.customer.email,
              phone: ctx.args.bookingInput.customer.phone,
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

  // return {
  //   operation: 'UpdateItem',
  //   key: {
  //     pk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk),
  //     sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
  //   },
  //   update: {
  //     expression:
  //       'SET #status = :booked, bookingId = :bookingId, customerId = :customerId, customerDetails = :customerDetails, updatedAt = :updatedAt',
  //     expressionNames: {
  //       '#status': 'status',
  //     },
  //     expressionValues: {
  //       ':customerDetails': util.dynamodb.toDynamoDB({
  //         name: ctx.args.bookingInput.customer.name,
  //         email: ctx.args.bookingInput.customer.email,
  //         phone: ctx.args.bookingInput.customer.phone,
  //       }),
  //       ':customerId': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer.id),
  //       ':booked': util.dynamodb.toDynamoDB('booked'),
  //       ':bookingId': util.dynamodb.toDynamoDB(util.autoId()),
  //       ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
  //     },
  //   },
  //   condition: {
  //     expression: '#status = :available AND attribute_not_exists(bookingId)',
  //     expressionNames: {
  //       '#status': 'status',
  //     },
  //     expressionValues: {
  //       ':available': util.dynamodb.toDynamoDB('available'),
  //     },
  //   },
  // };
}

export function response(ctx) {
  console.log('🔔 BookAppointment Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
