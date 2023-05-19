import { DynamoDBClient, QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

exports.handler = async () => {
  console.debug(`🕧 Send Reminders invoked`);

var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() = 1)

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

  var result: QueryCommandOutput | undefined = await dynamoDbCommand(new QueryCommand(input));

  if (result?.$metadata.httpStatusCode !== 200 || (result?.Count ?? 0) < 1) {
    console.log('✅ No results found', result?.Count ?? 0);
    return;
  }

  console.log('✅ Found results', result);

  // TODO Send to EventBridge
  result.Items?.map((r) => {
    console.log('SENDING TO EVENT BRIDGE', r);
  });
};

async function dynamoDbCommand(command: QueryCommand): Promise<QueryCommandOutput | undefined> {
  let result: QueryCommandOutput | undefined;

  try {
    console.debug('ℹ️ Initializing DynamoDB client');
    const client = new DynamoDBClient({});

    console.debug(`ℹ️ Executing DynamoDB command:\n${JSON.stringify(command)}`);
    result = await client.send(command);

    console.log(`🔔 DynamoDB result:\n${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`🛑 Error with DynamoDB command:\n`, error);
  }

  return result;
}
