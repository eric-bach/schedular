//https://github.com/focusOtter/appsync-eventbridge-scheduler
//https://advancedweb.hu/how-to-send-notifications-to-sns-sqs-and-eventbridge-from-appsync/

import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 REQUEST: ', ctx);

  // TODO Use AppSync to SQS (to Lambda)

  return {
    operation: 'Invoke',
    payload: { event: 'AppointmentBooked', data: ctx.prev.result },
  };
}

export function response(ctx) {
  console.log('🔔 RESPONSE: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
