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
  // Split each key:value pair and remove leading and trailing parenthesis
  const commaSplitBody = body.substring(1, body.length - 1).split(',');

  // Build new JSON string
  let jsonOutput = '{';
  commaSplitBody.forEach((s) => {
    const equalSplitBody = s.split('=');

    let i = 0;
    equalSplitBody.forEach((t) => {
      if (i % 2 === 0) {
        // Key
        jsonOutput += `"${t.trim()}":`;
        ++i;
      } else if (t.startsWith('{')) {
        // Nested value (start)
        jsonOutput += `${t.trim().replace(/[\{]/g, '{"')}":`;
      } else if (t.endsWith('}')) {
        // Nested value (end)
        jsonOutput += `"${t.trim().replace(/[\}]/g, '"}')},`;
        ++i;
      } else {
        // Value
        jsonOutput += `"${t.trim()}",`;
        ++i;
      }
    });
  });

  // Trim last comma and close JSON string
  jsonOutput = jsonOutput.substring(0, jsonOutput.length - 1) + '}';

  console.log('JSON Output ', jsonOutput);
  return jsonOutput;
}
