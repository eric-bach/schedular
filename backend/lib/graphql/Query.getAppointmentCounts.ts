import { Context, DynamoDBQueryRequest, util } from '@aws-appsync/utils';
import { AppointmentViewModel, GetCountsResponse, QueryGetAppointmentCountsArgs } from './types/appsync';

export function request(ctx: Context<QueryGetAppointmentCountsArgs>): DynamoDBQueryRequest {
  console.log('🔔 GetAppointmentCounts Request: ', ctx);

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
        ':s': util.dynamodb.toDynamoDB(ctx.args.status),
      },
    },
    scanIndexForward: true,
  };
}

export function response(ctx: Context<QueryGetAppointmentCountsArgs>): GetCountsResponse[] {
  console.log('🔔 GetAppointmentCounts Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  // Group and count by local date
  const dates: string[] = ctx.result.items.map((x: AppointmentViewModel) => x.sk) ?? [];
  const result = countItemsByDate(dates);

  return result;
}

function countItemsByDate(dates: string[]) {
  let dateCountMap: { [key: string]: number } = {};
  dates.forEach((date) => {
    // Convert to local date
    const epoch = util.time.parseISO8601ToEpochMilliSeconds(date);
    const localDate = util.time.epochMilliSecondsToFormatted(epoch, 'yyyy-MM-dd', 'America/Denver');

    if (dateCountMap[localDate] !== undefined) {
      dateCountMap[localDate] = dateCountMap[localDate] + 1;
    } else {
      dateCountMap[localDate] = 1;
    }
  });

  // Return an array of objects of the local date and count
  const result = Object.keys(dateCountMap).map((date) => ({
    date,
    count: dateCountMap[date],
  }));

  console.log('🔔 Result', JSON.stringify(result));
  return result;
}
