import { DynamoDBClient, QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput, PutEventsCommandOutput } from '@aws-sdk/client-eventbridge';

exports.handler = async () => {
  console.debug(`🕧 Send Reminders invoked`);

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get DynamoDB items
  let input: QueryCommandInput = {
    TableName: process.env.DATA_TABLE_NAME,
    IndexName: 'type-gsi',
    KeyConditionExpression: '#type = :type AND begins_with(sk, :datetime)',
    ExpressionAttributeNames: {
      '#type': 'type',
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':type': { S: 'booking' },
      ':datetime': { S: tomorrow.toISOString().substring(0, 10) },
      ':booked': { S: 'booked' },
    },
    FilterExpression: 'appointmentDetails.#status = :booked',
  };
  let result: QueryCommandOutput | undefined = await dynamoDbCommand(new QueryCommand(input));

  if (result?.$metadata.httpStatusCode !== 200 || !result.Items || (result?.Count ?? 0) < 1) {
    console.log('✅ No upcoming bookings to send reminders for', result?.Count ?? 0);
    return;
  }
  console.log(`✅ Found ${result.Items.length} bookings to send reminders for`, result);

  // Send to EventBridge
  const asyncResult = await Promise.all(
    result.Items.map(async (r) => {
      let params: PutEventsCommandInput = {
        Entries: [
          {
            Source: 'custom.schedular',
            EventBusName: process.env.EVENTBUS_NAME,
            DetailType: 'BookingReminder',
            Detail: JSON.stringify(r),
          },
        ],
      };
      var eventResult: PutEventsCommandOutput | undefined = await publishEvent(new PutEventsCommand(params));

      if (eventResult?.$metadata.httpStatusCode !== 200) {
        console.error(`🛑 Could not send event to EventBridge`, eventResult);
      }
    })
  );

  console.log(`✅ Sent ${result.Count} event(s) to EventBridge`);
};

async function publishEvent(command: PutEventsCommand): Promise<PutEventsCommandOutput | undefined> {
  let result: PutEventsCommandOutput | undefined;

  try {
    const client = new EventBridgeClient({});
    console.debug('Executing EventBridge command', JSON.stringify(command));

    result = await client.send(command);
    console.log('🔔 EventBridge result', JSON.stringify(result));
  } catch (error) {
    console.error('🛑 Error sending EventBridge event\n', error);
  }

  return result;
}

async function dynamoDbCommand(command: QueryCommand): Promise<QueryCommandOutput | undefined> {
  let result: QueryCommandOutput | undefined;

  try {
    const client = new DynamoDBClient({});
    console.debug('Executing DynamoDB command', JSON.stringify(command));

    result = await client.send(command);
    console.log('🔔 DynamoDB result', JSON.stringify(result));
  } catch (error) {
    console.error('🛑 Error with DynamoDB command', error);
  }

  return result;
}
