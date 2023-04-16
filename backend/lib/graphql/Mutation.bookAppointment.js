import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 BookAppointment Request: ', ctx);

  return {
    operation: 'UpdateItem',
    key: {
      pk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk),
      sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
    },
    update: {
      expression:
        'SET #status = :booked, bookingId = :bookingId, customerId = :customerId, customerDetails = :customerDetails, updatedAt = :updatedAt',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':customerDetails': util.dynamodb.toDynamoDB({
          name: ctx.args.bookingInput.customer.name,
          email: ctx.args.bookingInput.customer.email,
          phone: ctx.args.bookingInput.customer.phone,
        }),
        ':customerId': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer.id),
        ':booked': util.dynamodb.toDynamoDB('booked'),
        ':bookingId': util.dynamodb.toDynamoDB(util.autoId()),
        ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
      },
    },
    condition: {
      expression: '#status = :available AND attribute_not_exists(confirmationId)',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':available': util.dynamodb.toDynamoDB('available'),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 BookAppointment Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
