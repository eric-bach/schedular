import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/build/Mutation.createAppointments.js';

describe('createAppointments', () => {
  it('should upsert a valid appointment', async () => {
    // Arrange
    const context = {
      arguments: {
        input: {
          appointments: [
            {
              pk: 'appt#123',
              sk: new Date().toISOString(),
              status: 'available',
              type: 'appt',
              category: 'massage',
              duration: 60,
              administratorDetails: {
                id: '123',
                firstName: 'user',
                lastName: 'test',
              },
            },
            {
              pk: 'appt#456',
              sk: new Date().toISOString(),
              status: 'pending*',
              type: 'appt',
              category: 'massage',
              duration: 60,
              administratorDetails: {
                id: '123',
                firstName: 'user',
                lastName: 'test',
              },
            },
          ],
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
    expect(result.operation).toEqual('BatchPutItem');

    // Only 1 appointment should have been created
    const data = result.tables['schedular-Data'];
    expect(data.length).toBe(1);

    const d = unmarshall(data[0]);
    expect(d.pk).toBe(context.arguments.input.appointments[0].pk);
    expect(d.sk).toBe(context.arguments.input.appointments[0].sk);
    expect(d.status).toBe(context.arguments.input.appointments[0].status);
    expect(d.type).toBe(context.arguments.input.appointments[0].type);
    expect(d.category).toBe(context.arguments.input.appointments[0].category);
    expect(d.duration).toBe(context.arguments.input.appointments[0].duration);
  }, 20000);

  it('should not upsert when there are no appointments to upsert', async () => {
    // Arrange
    const context = {
      arguments: {
        input: {
          appointments: [
            {
              pk: 'appt#456',
              sk: new Date().toISOString(),
              status: 'pending*',
              type: 'appt',
              category: 'massage',
              duration: 60,
              administratorDetails: {
                id: '123',
                firstName: 'user',
                lastName: 'test',
              },
            },
          ],
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
    expect(result.operation).toEqual(undefined);
  }, 20000);
});
