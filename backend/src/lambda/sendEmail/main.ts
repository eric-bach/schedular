import { SESClient, SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import
import { EventBridgeEvent } from 'aws-lambda';

type Booking = {
  administratorDetails: {
    firstName: string;
    lastName: string;
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

exports.handler = async (event: EventBridgeEvent<string, Booking>) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  // Send email confirmation
  const client = new SESClient({});

  let template: string = '';
  console.log('Event Type', event['detail-type']);
  if (event['detail-type'] === 'BookingCreated') {
    template = 'AppointmentConfirmation';
  } else if (event['detail-type'] === 'BookingCancelled') {
    template = 'AppointmentCancellation';
  } else if (event['detail-type'] === 'BookingReminder') {
    template = 'BookingReminder';
  }
  console.log('Template ', template);

  // Send templated email
  const input: SendTemplatedEmailCommandInput = {
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [event.detail.customerDetails.email] },
    Template: template,
    TemplateData: `{
      "name": "${event.detail.customerDetails.firstName} ${event.detail.customerDetails.lastName}",
      "date": "${formateLocalLongDate(event.detail.sk)}",
      "time": "${formatLocalTimeString(event.detail.sk, 0)}",
      "administrator": "${event.detail.administratorDetails.firstName} ${event.detail.administratorDetails.lastName}" }`,
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
