import { Context, util } from '@aws-appsync/utils';

export function request(ctx: Context) {
  console.log('🔔 SendEvent Request: ', ctx);

  let eventName = '';
  if (ctx.prev.result.appointmentDetails.status === 'booked') {
    eventName = 'BookingCreated';
  } else if (ctx.prev.result.appointmentDetails.status === 'cancelled') {
    eventName = 'BookingCancelled';
  }

  return {
    operation: 'PutEvents',
    events: [
      {
        source: 'custom.schedular',
        detail: ctx.prev.result,
        detailType: eventName,
      },
    ],
  };
}

export function response(ctx: Context) {
  console.log('🔔 SendEvent Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.prev.result;
}
