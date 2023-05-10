import { util, runtime } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 DeleteAppointments Request: ', ctx);

  const { appointments } = ctx.args.input;
  const deleteAppointments = appointments.filter((x) => x.status === 'pending*');

  // Early Return if no records to delete
  if (deleteAppointments.length <= 0) {
    runtime.earlyReturn({ upserted: ctx.prev.result.data['schedular-Data'], deleted: [{}] });
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

export function response(ctx) {
  console.log('🔔 DeleteAppointments Response: ', ctx);

  const upsertResponse = ctx.prev.result.data ? ctx.prev.result.data['schedular-Data'] : [{}];
  const deleteResponse = ctx.result.data['schedular-Data'];

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return { upserted: upsertResponse, deleted: deleteResponse };
}
