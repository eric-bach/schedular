import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import

exports.handler = async (event: any) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  const message = JSON.parse(parseUrlDecodedString(event.Records[0].body));
  console.debug(`🕧 Mesage: ${JSON.stringify(message)}`);

  // Send email confirmation
  const client = new SESClient({ region: process.env.REGION });

  const input: SendEmailCommandInput = {
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [message.customerDetails.email] },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'Appointment Confirmation',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `This is to confirm your appointment for ${message.customerDetails.firstName} ${
            message.customerDetails.lastName
          } on ${formateLocalLongDate(message.sk)} from ${formatLocalTimeSpanString(message.sk, message.duration)}\nConfirmation Id: ${
            message.bookingId
          }`,
        },
      },
    },
  };

  const command = new SendEmailCommand(input);
  const response = await client.send(command);
  console.log(`✅ Appointment Confirmation sent: {result: ${JSON.stringify(response)}}}`);
};

// Takes a SQS urlDecoded string and converts it to proper JSON
//    Input:  {id=123, nestedObject={name=test}}
//    Output: {"id":"123","nextedObject":{"name":"123"}}
function parseUrlDecodedString(body: string): string {
  // Turn { to {" and } to "}
  let jsonOutput = body.replace(/{/gi, '{"').replace(/}/gi, '"}');

  // Turn = to :
  jsonOutput = jsonOutput.replace(/=/gi, '":"');

  // Turn , to ", "
  jsonOutput = jsonOutput.replace(/,\s/gi, '", "');

  // Turn "[ to [ and ]" to ]
  jsonOutput = jsonOutput.replace(/"\[/gi, '[').replace(/\]"/gi, ']');

  // Turn }", "{ to }, {
  jsonOutput = jsonOutput.replace(/}", "{/gi, '}, {');

  // Turn "null" to null
  jsonOutput = jsonOutput.replace(/"null"/gi, 'null');

  // Turn "{ to { and }" to }
  jsonOutput = jsonOutput.replace(/""{/gi, '{').replace(/}""/gi, '}').replace(/"{/gi, '{').replace(/}"/gi, '}');

  console.log('JSON Output ', jsonOutput);
  return jsonOutput;
}

// Returns the local time part in a span (to - from) of an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z, 60
//  Output: 8:00 AM - 9:00 AM
function formatLocalTimeSpanString(dateString: string, duration: number) {
  return `${formatLocalTimeString(dateString, 0)} - ${formatLocalTimeString(dateString, duration)}`;
}

// Returns the local time part (including offset) of an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z, 0
//  Output: 8:00 AM
function formatLocalTimeString(dateString: string, offsetMinutes: number) {
  const date = new Date(new Date(dateString).getTime() + offsetMinutes * 60000);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Edmonton',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}

// Returns the local long date string from an ISO8601 datetime string
//  Input: 2023-04-06T14:00:00Z
//  Output: Thursday, April 6, 2023
function formateLocalLongDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone: 'America/Edmonton',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
