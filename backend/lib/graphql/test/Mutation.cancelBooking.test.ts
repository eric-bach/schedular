import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/build/Mutation.cancelBooking.js';

describe('cancelBooking', () => {
  it('should cancel a valid booking request', async () => {
    // Arrange
    const context = {
      arguments: {
        input: {
          bookingId: 'booking#123',
          appointmentDetails: {
            pk: 'appt#123',
            sk: new Date().toDateString(),
            status: 'booked',
            type: 'appt',
            category: 'massage',
            duration: 60,
          },
        },
      },
    };
    const input: EvaluateCodeCommandInput = {
      runtime: { name: 'APPSYNC_JS', runtimeVersion: '1.0.0' },
      code: await readFile(file, { encoding: 'utf8' }),
      context: JSON.stringify(context),
      function: 'request',
    };

    // Act
    const evaluateCodeCommand = new EvaluateCodeCommand(input);

    // Assert
    const response = await appsync.send(evaluateCodeCommand);
    expect(response).toBeDefined();
    expect(response.$metadata.httpStatusCode).toBe(200);
    expect(response.error).toBeUndefined();
    expect(response.evaluationResult).toBeDefined();

    const result = JSON.parse(response.evaluationResult ?? '{}');
    expect(result.operation).toEqual('TransactWriteItems');
    const transactItems = result.transactItems;
    expect(transactItems.length).toBe(2);

    // Assert update booking
    const updateBooking = transactItems[0];
    expect(updateBooking.table).toEqual('schedular-Data');
    expect(updateBooking.operation).toEqual('UpdateItem');
    const updateBookingKey = unmarshall(updateBooking.key);
    expect(updateBookingKey.pk).toEqual(context.arguments.input.bookingId);
    expect(updateBookingKey.sk).toEqual(context.arguments.input.appointmentDetails.sk);
    expect(updateBooking.update.expression).toEqual('SET appointmentDetails = :appointmentDetails, #status = :status, updatedAt = :updatedAt');

    // Assert update appointment
    const updateAppointment = transactItems[1];
    expect(updateAppointment.table).toEqual('schedular-Data');
    expect(updateAppointment.operation).toEqual('UpdateItem');
    const updateAppointmentKey = unmarshall(updateAppointment.key);
    expect(updateAppointmentKey.pk).toEqual(context.arguments.input.appointmentDetails.pk);
    expect(updateAppointmentKey.sk).toEqual(context.arguments.input.appointmentDetails.sk);
    expect(updateAppointment.update.expression).toEqual('SET #status = :available, updatedAt = :updatedAt REMOVE bookingId, customerDetails');
  }, 20000);
});
