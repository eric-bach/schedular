import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { GetAppointmentsResponse, QueryGetAppointmentsArgs } from './types/appsync';

export function request(ctx: Context<QueryGetAppointmentsArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetAppointments Request: ', ctx);

  return {
    operation: 'Query',
    index: 'type-gsi',
    query: {
      expression: '#type = :type AND sk BETWEEN :fromDate AND :toDate',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB('appt'),
        ':fromDate': util.dynamodb.toDynamoDB(ctx.args.from),
        ':toDate': util.dynamodb.toDynamoDB(ctx.args.to),
      },
    },
    scanIndexForward: true,
  };
}

export function response(ctx: Context<QueryGetAppointmentsArgs>): GetAppointmentsResponse {
  console.log('🔔 GetAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
