import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { GetAppointmentsResponse, QueryGetAvailableAppointmentsArgs } from './types/appsync';

export function request(ctx: Context<QueryGetAvailableAppointmentsArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetAvailableAppointments Request: ', ctx);

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
    filter: {
      expression: '#status = :s',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':s': util.dynamodb.toDynamoDB('available'),
      },
    },
  };
}

export function response(ctx: Context<QueryGetAvailableAppointmentsArgs>): GetAppointmentsResponse {
  console.log('🔔 GetAvailableAppointments Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }
  return ctx.result;
}
