import { SESClient, SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBRecord } from 'aws-lambda';

type Booking = {
  administratorDetails: {
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
    string: string;
  };
  pk: string;
  sk: string;
};

exports.handler = async (event: DynamoDBRecord[]) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  if (!event[0].dynamodb) {
    console.debug('🛑 No valid DynamoDB Streams records found in event');
    return;
  }

  // Send email confirmation
  const client = new SESClient({});

  //@ts-ignore
  const data: Booking = unmarshall(event[0].dynamodb?.NewImage);
  console.log(data);

  let template: string = '';
  if (data.appointmentDetails.status === 'booked') {
    // TODO Filter out reminders
    template = 'AppointmentConfirmation';
  } else if (data.appointmentDetails.status === 'cancelled') {
    template = 'AppointmentCancellation';
  }
  // else if (data.appointmentDetails.status === 'booked') {
  //   template = 'BookingReminder';
  // }

  // Send templated email
  const input: SendTemplatedEmailCommandInput = {
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [data.customerDetails.email] },
    Template: template,
    TemplateData: `{
      "name": "${data.customerDetails.firstName} ${data.customerDetails.lastName}",
      "date": "${formateLocalLongDate(data.sk)}",
      "time": "${formatLocalTimeString(data.sk, 0)}",
      "administrator": "${data.administratorDetails.firstName} ${data.administratorDetails.lastName}" }`,
  };
  console.log(`🔔 Send Email:  ${JSON.stringify(input)}`);

  const command = new SendTemplatedEmailCommand(input);
  const response = await client.send(command);

  console.log(`✅ Appointment notification sent: {result: ${JSON.stringify(response)}}}`);
};

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
