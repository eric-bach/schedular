import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('🔔 GetAppointmentCounts Request: ', ctx);

  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'type-gsi',
    query: {
      expression: '#type = :type AND sk BETWEEN :fromDate AND :toDate',
      expressionNames: {
        '#type': 'type',
      },
      expressionValues: {
        ':type': util.dynamodb.toDynamoDB(ctx.args.type),
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
    scanIndexForward: true,
  };
}

export function response(ctx) {
  console.log('🔔 GetAppointmentCounts Response: ', ctx);

  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  // Group and count by local date
  const dates = ctx.result.items.map((x) => x.sk) ?? [];
  const result = countItemsByDate(dates);

  return result;
}

function countItemsByDate(dates) {
  let dateCountMap = {};
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
