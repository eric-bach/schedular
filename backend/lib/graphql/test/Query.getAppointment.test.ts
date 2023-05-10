import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/Query.getAppointment.js';

describe('getAppointment', () => {
  it('should get an appointment', async () => {
    // Arrange
    const context = {
      prev: {
        result: {
          keys: [
            {
              pk: 'appt#123',
              sk: new Date(),
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
    expect(response.error).toBeUndefined();
    expect(response.evaluationResult).toBeDefined();

    const result = JSON.parse(response.evaluationResult ?? '{}');
    expect(result.operation).toEqual('Query');
    expect(result.query.expression).toEqual('pk = :pk AND sk = :sk');

    const expressionValues = unmarshall(result.query.expressionValues);
    expect(expressionValues[':pk']).toBe(context.prev.result.keys[0].pk);
    expect(expressionValues[':sk']).toBe(context.prev.result.keys[0].sk.toISOString());
  }, 20000);
});
