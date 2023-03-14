import { TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import dynamoDbCommand from '../helpers/dynamoDbCommand';
import { BookingInput } from '../types/AppSync';

async function bookAppointment(input: BookingInput) {
  console.debug('🕧 bookAppointment Initialized');

  const transactWriteItemsCommand: TransactWriteItemsCommandInput = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.DATA_TABLE_NAME,
          Key: marshall({
            pk: input.pk,
            sk: input.sk,
          }),
          ConditionExpression: '#status = :openStatus',
          UpdateExpression: 'SET customer=:customer, #status=:status, updatedAt=:updatedAt',
          ExpressionAttributeValues: marshall({
            ':customer': input.customer,
            ':status': 'booked',
            ':updatedAt': new Date().toISOString(),
            ':openStatus': 'open',
          }),
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        },
      },
    ],
  };

  var updateResult = await dynamoDbCommand(new TransactWriteItemsCommand(transactWriteItemsCommand));

  if (updateResult.$metadata.httpStatusCode === 200) {
    console.log(`✅ Reserved Appointment: {result: ${JSON.stringify(updateResult)}}}`);
  } else {
    console.log(`🛑 Could not reserve Appointment`);
  }

  return updateResult.$metadata;
}

export default bookAppointment;
