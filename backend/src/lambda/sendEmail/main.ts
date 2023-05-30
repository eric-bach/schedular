import { SESClient, SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import

type Booking = {
  administratorDetails: {
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

exports.handler = async (event: Booking[]) => {
  console.debug('🕧 Send Email invoked: ', JSON.stringify(event));

  if (event.length < 0) {
    console.debug('⚠️ No records to process. Exiting.');
    return;
  }

  await Promise.all(
    event.map(async (data) => {
      // Send customer email
      await sendEmail(
        [data.customerDetails.email],
        getTemplateName(data),
        `{
          "name": "${data.customerDetails.firstName} ${data.customerDetails.lastName}",
          "date": "${formateLocalLongDate(data.sk)}",
          "time": "${formatLocalTimeString(data.sk, 0)}",
          "administrator": "${data.administratorDetails.firstName} ${data.administratorDetails.lastName}" 
        }`
      );

      // Send Administrator email
      if (data.administratorDetails.email) {
        await sendEmail(
          [data.administratorDetails.email],
          getAdminTemplateName(data),
          `{
            "name": "${data.customerDetails.firstName} ${data.customerDetails.lastName}",
            "date": "${formateLocalLongDate(data.sk)}",
            "time": "${formatLocalTimeString(data.sk, 0)}"
          }`
        );
      }
    })
  );

  console.log(`✅ Send ${event.length} notifications`);
};

function getAdminTemplateName(data: Booking): string {
  let templateName: string = '';

  if (data.appointmentDetails.status === 'booked' && data.reminders === 0) {
    templateName = 'AdminAppointmentBooked';
  } else if (data.appointmentDetails.status === 'cancelled') {
    templateName = 'AdminAppointmentCancelled';
  }
  // TODO Add Daily Digest reminders

  return templateName;
}

function getTemplateName(data: Booking): string {
  let templateName: string = '';

  if (data.appointmentDetails.status === 'booked' && data.reminders === 0) {
    templateName = 'AppointmentConfirmation';
  } else if (data.appointmentDetails.status === 'cancelled') {
    templateName = 'AppointmentCancellation';
  } else if (data.appointmentDetails.status === 'booked' && data.reminders > 0) {
    templateName = 'BookingReminder';
  }

  return templateName;
}

async function sendEmail(recipients: string[], template: string, templateData: string) {
  try {
    const client = new SESClient({});

    const input: SendTemplatedEmailCommandInput = {
      Source: process.env.SENDER_EMAIL,
      Destination: { ToAddresses: recipients },
      Template: template,
      TemplateData: templateData,
    };

    const command = new SendTemplatedEmailCommand(input);
    const response = await client.send(command);

    console.log(`🔔 ${template} sent`, JSON.stringify(response));
  } catch (error) {
    console.error(error);
  }
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
