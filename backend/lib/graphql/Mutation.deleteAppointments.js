import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 DeleteAppointments Request: ', ctx);

  const { appointments } = ctx.args.input;
  const createAppointments = appointments.filter((x) => x.status === 'pending*');

  let data = [];
  for (var index in createAppointments) {
    data.push(util.dynamodb.toMapValues({ pk: createAppointments[index].pk, sk: createAppointments[index].sk }));
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

  const upsertResponse = ctx.prev.result.data['schedular-Data'];
  const deleteResponse = ctx.result.data['schedular-Data'];

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return { upserted: upsertResponse, deleted: deleteResponse };
}
