import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { AppointmentViewModel, GetBookingResponse, QueryGetBookingArgs } from './types/appsync';

export function request(ctx: Context<QueryGetBookingArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetBooking Request: ', ctx);

  const appointment = ctx.prev.result.keys.find((k: AppointmentViewModel) => k.pk.startsWith('booking#'));

  return {
    operation: 'Query',
    query: {
      expression: 'pk = :pk AND sk = :sk',
      expressionValues: {
        ':pk': util.dynamodb.toDynamoDB(appointment.pk),
        ':sk': util.dynamodb.toDynamoDB(appointment.sk),
      },
    },
  };
}

export function response(ctx: Context<QueryGetBookingArgs>): GetBookingResponse {
  console.log('🔔 GetBooking Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result.items[0];
}
