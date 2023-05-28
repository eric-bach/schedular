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
  reminders: number;
};

exports.handler = async (event: any) => {
  console.debug('🕧 Get Appointments invoked', JSON.stringify(event));

  if (event.length < 0) {
    console.debug('🛑 No valid DynamoDB Streams records found in event');
    return;
  }

  let records: Booking[] = [];
  await Promise.all(
    event.map(async (e: any) => {
      //@ts-ignore
      const rec: Booking = unmarshall(e.dynamodb?.NewImage);

      const email = await getAdministratorEmail(rec.administratorDetails.id.substring(5));
      rec.administratorDetails.email = email;

      records.push(rec);
    })
  );

  console.debug('🕧 Enriched record', JSON.stringify(records));
  return records;
};

async function getAdministratorEmail(id: string): Promise<string | undefined> {
  let email: string | undefined;

  try {
    const client = new CognitoIdentityProviderClient({});
    const params: ListUsersCommandInput = {
      UserPoolId: process.env.USER_POOL_ID,
      Filter: `username=\"${id}\"`,
      AttributesToGet: ['email'],
    };

    const command: ListUsersCommand = new ListUsersCommand(params);
    const result: ListUsersCommandOutput = await client.send(command);

    if (result?.$metadata.httpStatusCode !== 200 || !result.Users || result.Users?.length < 0) {
      console.error('🛑 Could not find adminsitrator', result);
      return '';
    }

    console.log('Result', JSON.stringify(result));
    email = result.Users[0].Attributes?.find((a) => a.Name === 'email')?.Value;
  } catch (error) {
    console.error(error);
  }

  console.log(`✅ Found administrator email`, email);
  return email;
}
