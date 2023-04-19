import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import

exports.handler = async (event: any) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  const message = JSON.parse(parseUrlDecodedString(event.Records[0].body));
  console.debug(`🕧 Mesage: ${JSON.stringify(message)}`);

  // // Send email confirmation
  // const client = new SESClient({ region: process.env.REGION });

  // const input: SendEmailCommandInput = {
  //   Source: process.env.SENDER_EMAIL,
  //   // TODO Change to user email
  //   //Destination: { ToAddresses: [${message.customerEmail}] },
  //   Destination: { ToAddresses: ['bach.eric@gmail.com'] },
  //   Message: {
  //     Subject: {
  //       Charset: 'UTF-8',
  //       Data: 'Appointment Confirmation',
  //     },
  //     Body: {
  //       Text: {
  //         Charset: 'UTF-8',
  //         Data: `This is to confirm your appointment for ${message.customerName} on ${message.appointmentDetails.date} from ${message.appointmentDetails.startTime} to ${message.appointmentDetails.endTime}\nConfirmation Id: ${message.confirmationId}`,
  //       },
  //     },
  //   },
  // };

  // const command = new SendEmailCommand(input);
  // const response = await client.send(command);

  // console.log(`✅ Appointment Confirmation sent: {result: ${JSON.stringify(response)}}}`);
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

  console.log('JSON Output ', jsonOutput);
  return jsonOutput;
}
