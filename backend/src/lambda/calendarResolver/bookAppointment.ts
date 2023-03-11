import { UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import dynamoDbCommand from '../helpers/dynamoDbCommand';
import { BookingInput } from '../types/AppSync';

async function bookAppointment(input: BookingInput) {
  console.debug('🕧 bookAppointment Initialized');

  const updateItemCommandInput: UpdateItemCommandInput = {
    TableName: process.env.DATA_TABLE_NAME,
    Key: marshall({
      pk: input.pk,
      sk: input.sk,
    }),
    UpdateExpression: 'SET customer=:customer, #status=:status, updatedAt=:updatedAt',
    ExpressionAttributeValues: marshall({
      ':customer': input.customer,
      ':status': 'booked',
      ':updatedAt': new Date().toISOString(),
    }),
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ReturnValues: 'ALL_NEW',
  };

  // TODO Confirm appointment is still available before booking (in a DynamoDB transaction)
  var updateResult = await dynamoDbCommand(new UpdateItemCommand(updateItemCommandInput));

  if (updateResult.$metadata.httpStatusCode === 200) {
    console.log(
      `✅ Reserved Appointment: {result: ${JSON.stringify(updateResult)}, items: ${JSON.stringify(unmarshall(updateResult.Attributes))}}`
    );
    return unmarshall(updateResult.Attributes);
  }

  console.log(`🛑 Could not reserve Appointment`);
  return {};
}

export default bookAppointment;
