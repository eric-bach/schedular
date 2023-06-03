import { DynamoDBRecord } from 'aws-lambda';

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

exports.handler = async (event: DynamoDBRecord[]) => {
  console.debug('🕧 Update Keys invoked: ', JSON.stringify(event));

  if (event.length < 1) {
    console.debug('✅ No records to process. Exiting.');
    return;
  }

  // TODO Update Keys Table

  console.log('✅ Updated keys');
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
