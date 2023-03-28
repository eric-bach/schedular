import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 REQUEST: ', ctx);

  const message = util.urlEncode(ctx.prev.result);
  console.log(message);

  return {
    version: '2018-05-29',
    method: 'POST',
    params: {
      body: `Action=SendMessage&MessageBody=${message}&Version=2012-11-05`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    // TODO Get from params
    resourcePath: '/524849261220/schedular-dev-queue/',
  };
}

export function response(ctx) {
  console.log('🔔 RESPONSE: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.prev.result;
}
