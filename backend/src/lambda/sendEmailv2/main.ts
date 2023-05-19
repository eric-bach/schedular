import { SESClient, SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import
import { EventBridgeEvent } from 'aws-lambda';

exports.handler = async (event: EventBridgeEvent<string, string>) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  //const message = JSON.parse(event.Records[0].body);
  //console.debug(`🕧 Mesage: ${JSON.stringify(message)}`);

  // // Send email confirmation
  // const client = new SESClient({ region: process.env.REGION });

  // // Send templated email
  // const input: SendTemplatedEmailCommandInput = {
  //   Source: process.env.SENDER_EMAIL,
  //   Destination: { ToAddresses: [message.customerDetails.email] },
  //   Template: message.appointmentDetails.status === 'booked' ? 'AppointmentConfirmation' : 'AppointmentCancellation',
  //   TemplateData: `{
  //     "name": "${message.customerDetails.firstName} ${message.customerDetails.lastName}",
  //     "date": "${formateLocalLongDate(message.sk)}",
  //     "time": "${formatLocalTimeString(message.sk, 0)}",
  //     "administrator": "${message.administratorDetails.firstName} ${message.administratorDetails.lastName}" }`,
  // };
  // console.log(`🔔 Send Email:  ${JSON.stringify(input)}`);

  // const command = new SendTemplatedEmailCommand(input);
  // const response = await client.send(command);

  // console.log(`✅ Appointment notification sent: {result: ${JSON.stringify(response)}}}`);
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
