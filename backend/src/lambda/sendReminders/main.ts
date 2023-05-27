import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

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

  await Promise.all(
    result.Items.map(async (r) => {
      const values = unmarshall(r);

      // Update DynamoDB
      let input: UpdateItemCommandInput = {
        TableName: process.env.DATA_TABLE_NAME,
        Key: marshall({
          pk: values.pk,
          sk: values.sk,
        }),
        UpdateExpression: 'SET reminders = :count',
        ExpressionAttributeValues: marshall({
          ':count': values.reminders + 1,
        }),
      };
      let updateResult: UpdateItemCommandOutput | undefined = await dynamoDbCommand(new UpdateItemCommand(input));

      if (updateResult?.$metadata.httpStatusCode !== 200) {
        console.log('🛑 Could not update item');
        return;
      }

      // Send to EventBridge
      // let params: PutEventsCommandInput = {
      //   Entries: [
      //     {
      //       Source: 'custom.schedular',
      //       EventBusName: process.env.EVENTBUS_NAME,
      //       DetailType: 'BookingReminder',
      //       Detail: JSON.stringify(unmarshall(r)),
      //     },
      //   ],
      // };
      // var eventResult: PutEventsCommandOutput | undefined = await publishEvent(new PutEventsCommand(params));
      // if (eventResult?.$metadata.httpStatusCode !== 200) {
      //   console.error(`🛑 Could not send event to EventBridge`, eventResult);
      // }
    })
  );

  //console.log(`✅ Sent ${result.Count} event(s) to EventBridge`);
  console.log(`✅ Send reminders for ${result.Count} bookings`);
};

// async function publishEvent(command: PutEventsCommand): Promise<PutEventsCommandOutput | undefined> {
//   let result: PutEventsCommandOutput | undefined;

//   try {
//     const client = new EventBridgeClient({});
//     console.debug('Executing EventBridge command', JSON.stringify(command));

//     result = await client.send(command);
//     console.log('🔔 EventBridge result', JSON.stringify(result));
//   } catch (error) {
//     console.error('🛑 Error sending EventBridge event\n', error);
//   }

//   return result;
// }

async function dynamoDbCommand(command: any): Promise<any> {
  let result: any;

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
