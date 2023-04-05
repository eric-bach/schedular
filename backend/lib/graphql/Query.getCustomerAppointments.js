import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    version: '2017-02-28',
    operation: 'Query',
    index: 'customerId-gsi',
    query: {
      expression: 'customerId = :customerId AND appointmentDateEpoch >= :appointmentDateEpoch',
      expressionValues: {
        ':customerId': util.dynamodb.toDynamoDB(ctx.args.customerId),
        ':appointmentDateEpoch': util.dynamodb.toDynamoDB(ctx.args.appointmentDateEpoch),
      },
    },
    filter: {
      expression: 'pk = :pk',
      expressionValues: {
        ':pk': util.dynamodb.toDynamoDB('appt'),
      },
    },
  };
}

export function response(ctx) {
  return ctx.result;
}
