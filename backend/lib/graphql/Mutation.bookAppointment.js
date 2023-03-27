import { util } from '@aws-appsync/utils';

export function request(ctx) {
  console.log('NEW ID: ', util.autoId());
  //console.log('TABLE NAME: ', process.env.DATA_TABLE_NAME);

  return {
    //version: '2018-05-29',
    operation: 'UpdateItem',
    key: {
      pk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.pk),
      sk: util.dynamodb.toDynamoDB(ctx.args.bookingInput.sk),
    },
    update: {
      expression: 'SET customer = :customer, #status = :status, confirmationId = :confirmationId, updatedAt = :updatedAt',
      expressionNames: {
        '#status': 'status',
      },
      expressionValues: {
        ':customer': util.dynamodb.toDynamoDB(ctx.args.customer),
        ':status': util.dynamodb.toDynamoDB('booked'),
        ':confirmationId': util.dynamodb.toDynamoDB(util.autoId()),
        ':updatedAt': util.dynamodb.toDynamoDB(new Date().toISOString()),
      },
    },
    // condition: {
    //   expression: '#status = :available AND attribute_not_exists(customer)',
    //   expressionNames: {
    //     '#status': 'status',
    //   },
    //   expressionValues: {
    //     ':available': util.dynamodb.toDynamoDB('open'),
    //   },
    // },
  };

  //   return {
  //     version: '2018-05-29',
  //     operation: 'TransactWriteItems',
  //     transactItems: [
  //       {
  //         // TODO How to get this
  //         table: 'schedular-dev-Data', //process.env.DATA_TABLE_NAME
  //         operation: 'UpdateItem',
  //         key: {
  //           pk: util.dynamodb.toDynamoDB(ctx.args.pk),
  //           sk: util.dynamodb.toDynamoDB(ctx.args.sk),
  //         },
  //         update: {
  //           expression: 'SET customer = :customer, #status = :status, confirmationId = :confirmationId, updatedAt = :updatedAt',
  //           expressionNames: {
  //             '#status': 'status',
  //           },
  //           expressionValues: {
  //             ':customer': util.dynamodb.toDynamoDB(ctx.args.customer),
  //             ':status': util.dynamodb.toDynamoDB('booked'),
  //             ':confirmationId': util.dynamodb.toDynamoDB(util.autoId()),
  //             ':updatedAt': util.dynamodb.toDynamoDB(new Date().toISOString()),
  //           },
  //         },

  //         condition: {
  //           expression: '#status = :available AND attribute_not_exists(customer)',
  //           expressionNames: {
  //             '#status': 'status',
  //           },
  //           expressionValues: {
  //             ':available': util.dynamodb.toDynamoDB('open'),
  //             ':customer': util.dynamodb.toDynamoDB(ctx.args.customer),
  //           },
  //         },
  //       },
  //     ],
  //   };
  // }
}

export function response(ctx) {
  console.log('RESULT: ', ctx);
  return ctx.result;
}
