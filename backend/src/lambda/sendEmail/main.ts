import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import

exports.handler = async (event: any) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  const message = JSON.parse(parseUrlDecodedString(event.Records[0].body));
  console.debug(`🕧 Mesage: ${JSON.stringify(message)}`);

  // Send email confirmation
  const client = new SESClient({ region: process.env.REGION });

  // const boundary = `----=_Part${Math.random().toString().substr(2)}`;
  // const body = `This is to confirm your appointment for ${message.customer} on ${message.sk}\nConfirmation Id: ${message.confirmationId}`;
  // const rawMessage = [
  //   `From: ${process.env.SENDER_EMAIL}`,
  //   `To: bach.eric@gmail.com`,
  //   `Subject: Appointment Confirmation`,
  //   `MIME-Version: 1.0`,
  //   `Content-Type: multipart/alternative; boundary="${boundary}"`,
  //   `\n`,
  //   `--${boundary}`,
  //   `Content-Type: text/plain; charset=UTF-8`,
  //   `Content-Transfer-Encoding: 7bit`,
  //   `\n`,
  //   `${body}`,
  // ];
  // const input: SendRawEmailCommandInput = {
  //   Source: process.env.SENDER_EMAIL,
  //   // TODO Change to user email
  //   Destinations: ['bach.eric@gmail.com'],
  //   RawMessage: { Data: new TextEncoder().encode(rawMessage.join('\n')) },
  // };

  const input: SendEmailCommandInput = {
    Source: process.env.SENDER_EMAIL,
    // TODO Change to user email
    Destination: { ToAddresses: ['bach.eric@gmail.com'] },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'Appointment Confirmation',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `This is to confirm your appointment for ${message.customer} on ${message.sk}\nConfirmation Id: ${message.confirmationId}`,
        },
      },
    },
  };

  const command = new SendEmailCommand(input);
  const response = await client.send(command);

  console.log(`✅ Appointment Confirmation sent: {result: ${JSON.stringify(response)}}}`);
};

// Takes a SQS urlDecoded string and converts it to proper JSON
//    Input:  {sk=123, pk=123}
//    Output: {"sk":"123","pk":"123"}
function parseUrlDecodedString(body: string): string {
  // Split each key:value pair and remove any parenthesis
  const commaSplitBody = body.replace(/[\{\}]/g, '').split(',');

  // Build new JSON string
  let jsonOutput = '{';
  commaSplitBody.forEach((s) => {
    const equalSplitBody = s.split('=');

    let i = 0;
    equalSplitBody.forEach((t) => {
      if (i % 2 === 0) {
        // Key
        jsonOutput += `"${t.trim()}":`;
      } else {
        // Value
        jsonOutput += `"${t.trim()}",`;
      }

      ++i;
    });
  });

  // Trim last comma and close JSON string
  jsonOutput = jsonOutput.substring(0, jsonOutput.length - 1) + '}';

  return jsonOutput;
}
