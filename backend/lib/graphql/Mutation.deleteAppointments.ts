import { util, runtime, Context, DynamoDBBatchDeleteItemRequest } from '@aws-appsync/utils';
import { AppointmentViewModel, UpsertDeleteAppointmentsResponse } from './types/appsync';

export function request(ctx: Context): DynamoDBBatchDeleteItemRequest {
  console.log('🔔 DeleteAppointments Request: ', ctx);

  if (!ctx.args.input) {
    runtime.earlyReturn({});
  }

  const { appointments } = ctx.args.input;
  const deleteAppointments = appointments.filter((x: AppointmentViewModel) => x.status === 'pending*');

  // Early Return if no records to delete
  if (deleteAppointments.length === 0) {
    const upserted = ctx.prev?.result?.data ? ctx.prev.result.data['schedular-Data'] : [{}];
    runtime.earlyReturn({ upserted: upserted, deleted: [{}] });
  }

  let data = [];
  for (var index in deleteAppointments) {
    data.push(util.dynamodb.toMapValues({ pk: deleteAppointments[index].pk, sk: deleteAppointments[index].sk }));
  }

  return {
    operation: 'BatchDeleteItem',
    tables: {
      'schedular-Data': data,
    },
  };
}

export function response(ctx: Context): UpsertDeleteAppointmentsResponse {
  console.log('🔔 DeleteAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  const upserted = ctx.prev?.result?.data ? ctx.prev.result.data['schedular-Data'] : [{}];
  const deleted = ctx.result.data['schedular-Data'];

  return { upserted, deleted };
}
