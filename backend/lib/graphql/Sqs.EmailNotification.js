import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 REQUEST: ', ctx);

  return {
    version: '2018-05-29',
    method: 'POST',
    params: {
      body: `Action=SendMessage&MessageBody=Hello&Version=2012-11-05`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    resourcePath: '/524849261220/schedular-dev-queue/',
  };
}

export function response(ctx) {
  console.log('🔔 RESPONSE: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
