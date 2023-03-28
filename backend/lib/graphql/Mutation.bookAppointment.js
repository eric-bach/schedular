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
        'SET #status = :booked, confirmationId = :confirmationId, customerName = :customerName, customerEmail = :customerEmail, customerPhone = :customerPhone, updatedAt = :updatedAt',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':customerName': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer.name),
        ':customerEmail': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer.email),
        ':customerPhone': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer.phone),
        ':booked': util.dynamodb.toDynamoDB('booked'),
        ':confirmationId': util.dynamodb.toDynamoDB(util.autoId()),
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
