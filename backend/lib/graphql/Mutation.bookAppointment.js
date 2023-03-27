import { util } from '@aws-appsync/utils';

export function request(ctx) {
  //console.log('TABLE NAME: ', process.env.DATA_TABLE_NAME);
  console.log('🔔 BookAppointment Request: ', ctx);

  return {
    operation: 'UpdateItem',
    key: {
      pk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk),
      sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
    },
    update: {
      expression: 'SET customer = :customer, #status = :booked, confirmationId = :confirmationId, updatedAt = :updatedAt',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':customer': util.dynamodb.toDynamoDB(ctx.args.bookingInput.customer),
        ':booked': util.dynamodb.toDynamoDB('booked'),
        ':confirmationId': util.dynamodb.toDynamoDB(util.autoId()),
        ':updatedAt': util.dynamodb.toDynamoDB(util.time.nowISO8601()),
      },
    },
    condition: {
      expression: '#status = :available AND attribute_not_exists(customer)',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':available': util.dynamodb.toDynamoDB('open'),
      },
    },
  };
}

export function response(ctx) {
  console.log('🔔 BookAppointment Response: ', ctx);
  return { ...ctx.result, error: ctx.error };
}
