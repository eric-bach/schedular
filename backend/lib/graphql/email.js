//https://github.com/focusOtter/appsync-eventbridge-scheduler
//https://advancedweb.hu/how-to-send-notifications-to-sns-sqs-and-eventbridge-from-appsync/

import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 REQUEST: ', ctx);

  return {
    method: 'POST',
    params: {
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSEvents.PutEvents',
      },
      // TODO The util does not contain a toJson() method even though the AWS docs says it does
      body: util.toJson({
        Entries: [
          {
            Source: 'dev.ericbach.schedular',
            Detail: { pk: ctx.prev.result.pk, sk: ctx.prev.result.sk },
            DetailType: 'AppointmentBookedEvent',
            EventBusName: 'schedular-bus-dev',
          },
        ],
      }),
    },
    resourcePath: '/',
  };
}

export function response(ctx) {
  console.log('🔔 RESPONSE: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;

  // if (ctx.error) {
  //   util.error(ctx.error.message, ctx.error.type);
  // }

  // if (ctx.result.statusCode < 200 || ctx.result.statusCode >= 300) {
  //   util.error(ctx.result.body, `StatusCode ${ctx.result.statusCode}`);
  // }

  // if (util.parseJson(ctx.result.body).FailedEntryCount > 0) {
  //   util.error(ctx.result.body);
  // }

  // return util.toJson(util.parseJson(ctx.result.body).Entries[0].EventId);
}
