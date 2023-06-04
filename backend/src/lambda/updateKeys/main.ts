import { DynamoDBRecord } from 'aws-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

exports.handler = async (events: DynamoDBRecord[]) => {
  console.debug('🕧 Update Keys invoked: ', JSON.stringify(events));

  if (events.length < 1) {
    console.debug('✅ No records to process. Exiting.');
    return;
  }

  // Normalize unique dates in event to minimize number of calls to DynamoDB
  const mappedDates: Map<string, number> = new Map<string, number>();
  let type: string = '';
  events.map((event: any) => {
    type Booking = {
      sk: string;
      type: string;
    };

    let isInsert = event.eventName === 'INSERT';
    let booking = isInsert ? (unmarshall(event.dynamodb?.NewImage) as Booking) : (unmarshall(event.dynamodb?.OldImage) as Booking);

    // Add 1 if inserting, substract 1 if removing
    const change = isInsert ? 1 : -1;
    type = booking.type;

    // Convert sk to local date
    const date = new Date(booking.sk);
    const mstDate = date.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
    const [month, day, year] = mstDate.split('/');
    const key = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.debug(`Getting count for local date ${key}`);

    if (mappedDates.has(key)) {
      mappedDates.set(key, (mappedDates.get(key) ?? 0) + change);
    } else {
      mappedDates.set(key, 1);
    }
  });
  console.debug('Mapped Dates', mappedDates);

  // Update keys in table with new counts
  const updatedCount = await updateDynamoDBKeys(mappedDates, type);

  console.log(`✅ Updated ${updatedCount} appointment counts`);
};

const updateDynamoDB = async (sk: string, count: number, type: string): Promise<number> => {
  // Get count of appointments matching the date
  let input: QueryCommandInput = {
    TableName: process.env.KEYS_TABLE_NAME,
    KeyConditionExpression: 'pk = :key AND sk = :date',
    ExpressionAttributeValues: {
      ':key': { S: type },
      ':date': { S: sk },
    },
  };
  let result: QueryCommandOutput | undefined = await dynamoDbCommand(new QueryCommand(input));
  if (result?.$metadata.httpStatusCode !== 200) {
    console.error('🛑 DynamoDB Query error', result);
    return 0;
  }

  // Determine the number of appointments
  let currentCount = 0;
  if (result.Items && result.Items.length > 0) {
    const values = unmarshall(result.Items[0]);
    currentCount = values.count;
  }
  console.debug(`🔔 Date ${sk} has ${currentCount} existing appointments`);

  // Update number of appointments
  const d = new Date(sk);
  let updateInput: PutItemCommandInput = {
    TableName: process.env.KEYS_TABLE_NAME,
    Item: marshall({ pk: type, sk: sk, count: currentCount + count, day: d.getDate() }),
  };
  let updateResult: PutItemCommandOutput | undefined = await dynamoDbCommand(new PutItemCommand(updateInput));

  if (updateResult?.$metadata.httpStatusCode !== 200) {
    console.error('🛑 DynamoDB error', result);
    return 0;
  }

  return currentCount + count;
};

// Processes the map of keys synchronously
const updateDynamoDBKeys = async (mappedDates: Map<string, number>, type: string): Promise<number> => {
  let appointmentsUpdated: number = 0;
  for (const [sk, count] of mappedDates) {
    appointmentsUpdated += await updateDynamoDB(sk, count, type);
  }

  return appointmentsUpdated;
};

async function dynamoDbCommand(command: any): Promise<any> {
  let result: any;

  try {
    const client = new DynamoDBClient({});
    console.debug('Executing DynamoDB command', JSON.stringify(command));

    result = await client.send(command);
    console.log('🔔 DynamoDB result', JSON.stringify(result));
  } catch (error) {
    console.error('🛑 DynamoDB error', error);
  }

  return result;
}
