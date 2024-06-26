import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/build/Mutation.createBooking.js';

describe('createBooking', () => {
  it('should create a booking', async () => {
    // Arrange
    const context = {
      arguments: {
        input: {
          pk: 'appt#123',
          sk: new Date().toISOString(),
          appointmentDetails: {
            duration: 60,
            type: 'appt',
            category: 'massage',
          },
          administratorDetails: {
            id: '123',
            firstName: 'user',
            lastName: 'test',
          },
          customer: {
            id: '123',
            firstName: 'Test',
            lastName: 'Test',
            email: 'test@test.com',
            phone: '5555555555',
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

    // Assert create booking
    const putItemResult = result.transactItems.find((t: any) => t.operation === 'PutItem');
    expect(putItemResult.table).toEqual(`schedular-Data`);
    const putItemKey = unmarshall(putItemResult.key);
    expect(putItemKey.pk).toContain('booking#');
    expect(putItemKey.sk).toEqual(context.arguments.input.sk);

    // Assert update appointment status
    const updateItemResult = result.transactItems.find((t: any) => t.operation === 'UpdateItem');
    expect(updateItemResult.table).toEqual(`schedular-Data`);
    const updateItemKey = unmarshall(updateItemResult.key);
    expect(updateItemKey.pk).toContain(context.arguments.input.pk);
    expect(updateItemKey.sk).toEqual(context.arguments.input.sk);
    expect(updateItemResult.update.expression).toBe(
      'SET #status = :booked, bookingId = :bookingId, customerDetails = :customerDetails, updatedAt = :updatedAt'
    );
  }, 20000);
});
