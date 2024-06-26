import { CognitoIdentityProviderClient, ListUsersCommand, ListUsersCommandInput, ListUsersCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBRecord } from 'aws-lambda';

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
  customerId: string;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string | undefined;
  };
  pk: string;
  sk: string;
};

exports.handler = async (event: DynamoDBRecord[]) => {
  console.debug('🕧 Get Appointments invoked', JSON.stringify(event));

  if (event.length < 0) {
    console.debug('🛑 No valid DynamoDB Streams records found in event');
    return;
  }

  const records: Booking[] = [];
  await Promise.all(
    event.map(async (e: any) => {
      let rec = unmarshall(e.dynamodb?.NewImage) as Booking;

      rec.customerDetails = {
        firstName: (await getUserAttribute(rec.customerId, 'given_name')) ?? 'User',
        lastName: (await getUserAttribute(rec.customerId, 'family_name')) ?? '',
        email: await getUserAttribute(rec.customerId, 'email'),
      };
      rec.administratorDetails.email = await getUserAttribute(rec.administratorDetails.id, 'email');

      records.push(rec as Booking);
    })
  );

  console.debug('🕧 Enriched record', JSON.stringify(records));
  return records;
};

async function getUserAttribute(id: string, attribute: string): Promise<string | undefined> {
  let attrValue: string | undefined;

  try {
    const client = new CognitoIdentityProviderClient({});
    const params: ListUsersCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Filter: `username="${id}"`,
      AttributesToGet: [`${attribute}`],
    };

    console.debug('Searching Cognito for user', params);

    const command: ListUsersCommand = new ListUsersCommand(params);
    const result: ListUsersCommandOutput = await client.send(command);

    if (result?.$metadata.httpStatusCode !== 200 || !result.Users || result.Users?.length < 0) {
      console.error('🛑 Could not find user', result);
      return '';
    }

    console.log('Result', JSON.stringify(result));
    attrValue = result.Users[0].Attributes?.find((a) => a.Name === `${attribute}`)?.Value;
  } catch (error) {
    console.error(error);
  }

  console.log(`✅ Found user ${attribute}`, attrValue);
  return attrValue;
}
