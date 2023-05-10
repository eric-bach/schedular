import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 UpsertAppointments Request: ', ctx);

  const { appointments } = ctx.args.input;
  const createAppointments = appointments.filter((x) => x.status !== 'pending*');

  // Early Return if not records to create/update
  if (createAppointments.length <= 0) {
    runtime.earlyReturn(ctx);
  }

  let data = [];
  for (var index in createAppointments) {
    const auditDates = { createdAt: util.time.nowISO8601(), updatedAt: util.time.nowISO8601() };

    data.push(util.dynamodb.toMapValues({ ...createAppointments[index], ...auditDates }));
  }

  return {
    operation: 'BatchPutItem',
    tables: {
      'schedular-Data': data,
    },
  };
}

export function response(ctx) {
  console.log('🔔 UpsertAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
