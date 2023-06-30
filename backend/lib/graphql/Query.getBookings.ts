import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { GetBookingResponse, QueryGetBookingsArgs } from './types/appsync';

export function request(ctx: Context<QueryGetBookingsArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetBookings Request: ', ctx);

  return {
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

export function response(ctx: Context<QueryGetBookingsArgs>): GetBookingResponse {
  console.log('🔔 GetBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
