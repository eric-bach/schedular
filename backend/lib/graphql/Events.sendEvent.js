import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 SendEvent Request: ', ctx);

  return {
    operation: 'PutEvents',
    events: [
      {
        source: 'custom.schedular',
        detail: ctx.prev.result,
        detailType: 'BookingCreated',
      },
    ],
  };
}

export function response(ctx) {
  console.log('🔔 SendEvent Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.prev.result;
}
