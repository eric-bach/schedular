import { DynamoDBClient, QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput, PutEventsCommandOutput } from '@aws-sdk/client-eventbridge';
import { CognitoIdentityProviderClient, ListUsersCommand, ListUsersCommandInput, ListUsersCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { unmarshall } from '@aws-sdk/util-dynamodb';

type Booking = {
  administratorDetails: {
    id: string;
    email: string | undefined;
    firstName: string;
    lastName: string;
  };
  appointmentDetails: {
    status: string;
  };
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
  };
  pk: string;
  sk: string;
};

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
    console.log('✅ No upcoming bookings. Exiting.');
    return;
  }
  console.log(`🕧 Found ${result.Items.length} bookings to send reminders for`);

  // Send to EventBridge
  let details: Booking[] = [];
  await Promise.all(
    result.Items.map(async (r) => {
      const value: Booking = unmarshall(r) as Booking;

      value.administratorDetails.email = (await getAdministratorEmail(value.administratorDetails.id.substring(5))) ?? undefined;

      details.push(value);
    })
  );

  const params: PutEventsCommandInput = {
    Entries: [
      {
        Source: 'custom.schedular',
        EventBusName: process.env.EVENT_BUS_NAME,
        DetailType: 'BookingReminder',
        Detail: JSON.stringify({ entries: details }),
      },
    ],
  };

  const eventResult: PutEventsCommandOutput | undefined = await publishEvent(new PutEventsCommand(params));

  if (eventResult?.$metadata.httpStatusCode === 200) {
    console.log(`✅ Sent ${result.Count} reminder events to EventBridge`);
  }
};

async function publishEvent(command: PutEventsCommand): Promise<PutEventsCommandOutput | undefined> {
  let result: PutEventsCommandOutput | undefined;

  try {
    const client = new EventBridgeClient({});
    console.debug('Executing EventBridge command', JSON.stringify(command));

    result = await client.send(command);
    console.log('🔔 EventBridge result', JSON.stringify(result));
  } catch (error) {
    console.error('🛑 EventBridge error', error);
  }

  return result;
}

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

async function getAdministratorEmail(id: string): Promise<string | undefined> {
  let email: string | undefined;

  try {
    const client = new CognitoIdentityProviderClient({});
    const params: ListUsersCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Filter: `username="${id}"`,
      AttributesToGet: ['email'],
    };

    const command: ListUsersCommand = new ListUsersCommand(params);
    console.debug('Executing Cognito command', JSON.stringify(command));

    const result: ListUsersCommandOutput = await client.send(command);

    if (result?.$metadata.httpStatusCode !== 200 || !result.Users || result.Users?.length < 0) {
      console.error(`🛑 Could not find administrator ${id}`, result);
      return email;
    }

    console.log('🔔 Cognito result', JSON.stringify(result));
    email = result.Users[0].Attributes?.find((a) => a.Name === 'email')?.Value;
  } catch (error) {
    console.error('🛑 Cognito error', error);
  }

  return email;
}
