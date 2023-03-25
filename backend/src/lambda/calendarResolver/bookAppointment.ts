import { TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import dynamoDbCommand from '../helpers/dynamoDbCommand';
import { BookingInput } from '../types/AppSync';
const { v4: uuidv4 } = require('uuid');

async function bookAppointment(input: BookingInput) {
  console.debug('🕧 bookAppointment Initialized');

  const confirmationId = uuidv4();
  const transactWriteItemsCommand: TransactWriteItemsCommandInput = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.DATA_TABLE_NAME,
          Key: marshall({
            pk: input.pk,
            sk: input.sk,
          }),
          ConditionExpression: '#status = :available AND attribute_not_exists(customer)',
          UpdateExpression: 'SET customer = :customer, #status = :status, confirmationId = :confirmationId, updatedAt = :updatedAt',
          ExpressionAttributeValues: marshall({
            ':customer': input.customer,
            ':available': 'open',
            ':status': 'booked',
            ':confirmationId': confirmationId,
            ':updatedAt': new Date().toISOString(),
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
    updateResult.$metadata.confirmationId = confirmationId;
    console.log(`✅ Reserved Appointment: {result: ${JSON.stringify(updateResult)}}}`);
  } else {
    console.log(`🛑 Could not reserve Appointment`);
  }

  return updateResult.$metadata;
}

export default bookAppointment;
