import { util, runtime } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 DeleteAppointments Request: ', ctx);

  const { appointments } = ctx.args.input;
  const deleteAppointments = appointments.filter((x) => x.status === 'pending*');

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

export function response(ctx) {
  console.log('🔔 DeleteAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  const upserted = ctx.prev?.result?.data ? ctx.prev.result.data['schedular-Data'] : [{}];
  const deleted = ctx.result.data['schedular-Data'];

  return { upserted, deleted };
}
