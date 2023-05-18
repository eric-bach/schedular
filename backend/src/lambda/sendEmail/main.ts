import { SESClient, SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses'; // ES Modules import
import { SQSEvent } from 'aws-lambda';

// SQSEvent
// {
//   "Records": [
//       {
//           "messageId": "f8787e26-d7ff-44b3-a4a1-09a0b7d7ea8c",
//           "receiptHandle": "AQEBr58/zTl0Q3lcaTTE1XhfhsoyWp169M6MWy+PAzU7e5MzlcedxtDpxcIQOjE2XVPo9J7tWEYyP1n7GLD7b4k+B1etujwHI+kxVPxeot+DZTuGMAEIFlgLdJaK8eNWZgZWgeUiY9Daz6JDhZ/jt4ygQOQnVtH9eEyT6yRRXhpKLDTVdFm2K+gSH7nvd7O2g2QWgRVMnLzKDIDI1lwiKgbxLOcnzPQmBLWOG+y1QD616LcZHqkCwL380XqPSP90gCjUsf3kJ8tPXBH6X7TcDo5p5ujrNzNLeastbnqsIVCCPDDnoUE4KQKuhV6EQgzFPEjbx7ISsD2G3SHfsVU2gs3QCDATK2LU4ZHkI1DoqcwSeUKZDxTCFGkse2EG5jJ0l28xpWvUXARuA3N+xpMmjhsX4A==",
//           "body": "{createdAt=2023-05-17T15:35:35.837Z, administratorDetails={firstName=Jane, lastName=Doe, id=user#3c909b86-afc6-4def-862e-21ef5f6b6bf7}, sk=2023-05-25T16:00:00.000Z, customerId=user#28a9cf0c-971a-4765-9721-64a338e57858, appointmentDetails={duration=60, sk=2023-05-25T16:00:00.000Z, pk=appt#979aad4f-54ad-4022-b62a-979a25be5e79, type=appt, category=massage, status=booked}, pk=booking#3ccb358b-23d3-4d66-a697-83388e41e0ba, customerDetails={firstName=Eric, lastName=Admin, phone=+17808888888, id=28a9cf0c-971a-4765-9721-64a338e57858, email=bach.eric@gmail.com}, type=booking, updatedAt=2023-05-17T15:35:35.837Z}",
//           "attributes": {
//               "ApproximateReceiveCount": "1",
//               "SentTimestamp": "1684337735961",
//               "SenderId": "AROAXUM3UFKSMQRH2QBXI:APPSYNC_ASSUME_ROLE",
//               "ApproximateFirstReceiveTimestamp": "1684337735965"
//           },
//           "messageAttributes": {},
//           "md5OfBody": "69766a59bba0e84f0709943eb36e06ea",
//           "eventSource": "aws:sqs",
//           "eventSourceARN": "arn:aws:sqs:us-east-1:524849261220:schedular-dev-emailDelivery",
//           "awsRegion": "us-east-1"
//       }
//   ]
// }

exports.handler = async (event: SQSEvent) => {
  console.debug(`🕧 Received event: ${JSON.stringify(event)}`);

  const message = JSON.parse(parseUrlDecodedString(event.Records[0].body));
  //const message = JSON.parse(event.Records[0].body);
  console.debug(`🕧 Mesage: ${JSON.stringify(message)}`);

  // Send email confirmation
  const client = new SESClient({ region: process.env.REGION });

  // Send templated email
  const input: SendTemplatedEmailCommandInput = {
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [message.customerDetails.email] },
    Template: message.appointmentDetails.status === 'booked' ? 'AppointmentConfirmation' : 'AppointmentCancellation',
    TemplateData: `{ 
      "name": "${message.customerDetails.firstName} ${message.customerDetails.lastName}", 
      "date": "${formateLocalLongDate(message.sk)}", 
      "time": "${formatLocalTimeString(message.sk, 0)}", 
      "administrator": "${message.administratorDetails.firstName} ${message.administratorDetails.lastName}" }`,
  };
  console.log(`🔔 Send Email:  ${JSON.stringify(input)}`);

  const command = new SendTemplatedEmailCommand(input);
  const response = await client.send(command);

  console.log(`✅ Appointment notification sent: {result: ${JSON.stringify(response)}}}`);
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
