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
  customerId: string;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string | undefined;
  };
  pk: string;
  sk: string;
};

exports.handler = async (event: any) => {
  console.debug('🕧 Send Email invoked: ', JSON.stringify(event));

  // Will either be from EventBridge (event.detail.entries) or from Pipes (event)
  // If it comes from EventBridge it is reminder notifications, from Pipes it is confirmation or cancellation appointments
  if (event.detail?.entries?.length < 1 && event.length < 1) {
    console.debug('✅ No records to process. Exiting.');
    return;
  }

  const isReminders = event.detail?.entries?.length > 0;
  const values: Booking[] = event.detail?.entries ?? event;

  if (isReminders) {
    console.debug('🔔 Sending daily digest and reminders');

    await processMapSync(groupByEmail(values));
  } else {
    console.debug('🔔 Sending individual notifications');

    await Promise.all(
      values.map(async (data: Booking) => {
        // Send customer email
        await sendEmail(
          data.customerDetails.email,
          getTemplateName(data, false),
          `{
            "name": "${data.customerDetails.firstName} ${data.customerDetails.lastName}",
            "date": "${formateLocalLongDate(data.sk)}",
            "time": "${formatLocalTimeString(data.sk, 0)}",
            "administrator": "${data.administratorDetails.firstName} ${data.administratorDetails.lastName}"
          }`
        );

        // Send Administrator email
        await sendEmail(
          data.administratorDetails.email,
          getTemplateName(data, true),
          `{
              "name": "${data.customerDetails.firstName} ${data.customerDetails.lastName}",
              "date": "${formateLocalLongDate(data.sk)}",
              "time": "${formatLocalTimeString(data.sk, 0)}",
              "administrator": "${data.administratorDetails.firstName} ${data.administratorDetails.lastName}"
            }`
        );
      })
    );
  }

  console.log('✅ Sent email notifications');
};

// Sends daily digest and reminders asynchronously while iterating through the Map
const processAsyncTask = async (email: string, bookings: Booking[]) => {
  type Customer = {
    name: string;
    time: string;
  };

  const customers: Customer[] = [];
  let date: string = '';
  let administrator: string = 'there';

  await Promise.all(
    bookings.map(async (booking: Booking) => {
      const c: Customer = {
        name: `${booking.customerDetails.firstName} ${booking.customerDetails.lastName}`,
        time: `${formatLocalTimeString(booking.sk, 0)}`,
      };
      customers.push(c);

      // Send individual customer reminders
      await sendEmail(
        booking.customerDetails.email,
        'AppointmentReminder',
        `{
          "name": "${booking.customerDetails.firstName} ${booking.customerDetails.lastName}",
          "date": "${formateLocalLongDate(booking.sk)}",
          "time": "${formatLocalTimeString(booking.sk, 0)}",
          "administrator": "${booking.administratorDetails.firstName} ${booking.administratorDetails.lastName}"
        }`
      );

      date = formateLocalLongDate(booking.sk);
      administrator = `${booking.administratorDetails.firstName} ${booking.administratorDetails.lastName}`;
    })
  );

  // Send administrator daily digest
  await sendEmail(email, 'AdminDailyDigest', `${JSON.stringify({ administrator: administrator, date: date, customers: customers })}`);
};

// Processes the map of Bookings by email synchronously
const processMapSync = async (bookingsByEmail: Map<string, Booking[]>) => {
  for (const [email, bookings] of bookingsByEmail) {
    await processAsyncTask(email, bookings);
  }
};

// Create a Map of Bookings with the administrator email as the key
// To iterate through each
//    map?.forEach((values) => {
//      values.map((v) => {
//        console.log(v?.sk);
//      });
//    });
function groupByEmail(items: Booking[]) {
  const map = new Map<string, [Booking]>();

  if (items) {
    items.forEach((item) => {
      const key = item.administratorDetails.email ?? '';
      const value = map.get(key);
      if (value) {
        value.push(item);
      } else {
        map.set(key, [item]);
      }
    });
  }

  return map;
}

function getTemplateName(data: Booking, admin: boolean): string {
  let templateName: string = '';

  if (!admin && data.appointmentDetails.status === 'booked') {
    templateName = 'AppointmentConfirmation';
  } else if (!admin && data.appointmentDetails.status === 'cancelled') {
    templateName = 'AppointmentCancellation';
  } else if (admin && data.appointmentDetails.status === 'booked') {
    templateName = 'AdminAppointmentConfirmation';
  } else if (admin && data.appointmentDetails.status === 'cancelled') {
    templateName = 'AdminAppointmentCancellation';
  }

  return templateName;
}

async function sendEmail(email: string | undefined, template: string, templateData: string) {
  if (!email) {
    console.error('⚠️ No email address provided. Skipping.');
    return;
  }

  try {
    const client = new SESClient({});

    const input: SendTemplatedEmailCommandInput = {
      Source: process.env.SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Template: template,
      TemplateData: templateData,
    };

    const command = new SendTemplatedEmailCommand(input);
    console.debug('Executing SES command', JSON.stringify(command));

    const response = await client.send(command);

    console.debug('🔔 SES result', JSON.stringify(response));
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
