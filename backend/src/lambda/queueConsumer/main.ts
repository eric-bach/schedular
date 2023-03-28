import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import

exports.handler = async (event: any) => {
  console.debug(`🕧 HERE Event: ${JSON.stringify(event)}`);

  const message = event.Records[0].body;
  console.debug(`🕧 Message: ${JSON.stringify(message)}`);
  console.debug(`🕧 msg: ${message}`);

  // Send email confirmation
  const client = new SESClient({ region: process.env.REGION });

  // const boundary = `----=_Part${Math.random().toString().substr(2)}`;
  // const body = `Confirmation of Appointment: ${message.confirmationId}`;
  // const rawMessage = [
  //   `From: bach.eric@gmail.com`,
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

  const input: SendEmailCommandInput = {
    Source: 'bach.eric@gmail.com',
    Destination: { ToAddresses: ['bach.eric@gmail.com'] },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'EMAIL_SUBJECT',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: 'TEXT_FORMAT_BODY',
        },
      },
    },
  };
  const command = new SendEmailCommand(input);
  const response = await client.send(command);

  console.log(`✅ Appointment Confirmation sent: {result: ${JSON.stringify(response)}}}`);
};
