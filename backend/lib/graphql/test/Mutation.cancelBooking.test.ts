import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/Mutation.cancelBooking.js';

test('validate a cancelBooking request', async () => {
  // Arrange
  const context = {
    arguments: {
      input: {
        pk: 'booking#123',
        sk: new Date().toISOString(),
        appointmentDetails: {
          pk: 'appt#123',
          sk: new Date().toDateString(),
          duration: 60,
          type: 'appt',
          category: 'massage',
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
}, 20000);
