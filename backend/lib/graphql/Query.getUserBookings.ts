import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { GetBookingsResponse, QueryGetUserBookingsArgs } from './types/appsync';

export function request(ctx: Context<QueryGetUserBookingsArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetUserBookings Request: ', ctx);

  return {
    operation: 'Query',
    index: 'customerId-gsi',
    query: {
      expression: 'customerId = :customerId AND sk >= :datetime',
      expressionValues: {
        ':customerId': util.dynamodb.toDynamoDB(ctx.args.customerId),
        ':datetime': util.dynamodb.toDynamoDB(ctx.args.datetime),
      },
    },
    filter: {
      expression: '#type = :type',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB('booking'),
      },
    },
  };
}

export function response(ctx: Context<QueryGetUserBookingsArgs>): GetBookingsResponse {
  console.log('🔔 GetUserBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
