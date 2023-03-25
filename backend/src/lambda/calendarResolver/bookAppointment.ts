import { TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import dynamoDbCommand from '../helpers/dynamoDbCommand';
import { SESClient, SendRawEmailCommand, SendRawEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import
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

    // Send email confirmation
    const client = new SESClient({ region: process.env.REGION });
    const boundary = `----=_Part${Math.random().toString().substr(2)}`;
    const date = new Date();
    const body = `Confirmation of Appointment: ${confirmationId}`;
    const rawMessage = [
      `From: success@simulator.amazonses.com`,
      `To: success@simulator.amazonses.com`,
      `Subject: Appointment Confirmation`,
      `MIME-Version: 1.0`,
      `Date: ${date}`, // Will be replaced by SES
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `\n`,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      `\n`,
      `${body}`,
    ];

    const input: SendRawEmailCommandInput = {
      Destinations: ['success@simulator.amazonses.com'],
      RawMessage: {
        Data: new TextEncoder().encode(rawMessage.join('\n')),
      },
      Source: 'success@simulator.amazonses.com',
    };
    const command = new SendRawEmailCommand(input);
    const response = await client.send(command);
    console.log(`✅ Appointment Confirmation sent: {result: ${JSON.stringify(response)}}}`);
  } else {
    console.log(`🛑 Could not reserve Appointment`);
  }

  return updateResult.$metadata;
}

export default bookAppointment;
