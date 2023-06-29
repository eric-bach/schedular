import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { AppointmentViewModel, GetAppointmentResponse, QueryGetAppointmentArgs } from './types/appsync';

export function request(ctx: Context<QueryGetAppointmentArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetAppointment Request: ', ctx);

  const appointment = ctx.prev.result.keys.find((k: AppointmentViewModel) => k.pk.startsWith('appt#'));

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

export function response(ctx: Context<QueryGetAppointmentArgs>): GetAppointmentResponse {
  console.log('🔔 GetAppointment Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result.items[0];
}
