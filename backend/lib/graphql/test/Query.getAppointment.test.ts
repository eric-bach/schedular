import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/Query.getAppointments.js';

test('validate a getAppointment request', async () => {
  // Arrange
  const context = {
    arguments: {
      date: new Date().toISOString().substring(0, 10),
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
  expect(result.query.expression).toEqual('#date = :date');

  const expressionValues = unmarshall(result.query.expressionValues);
  expect(expressionValues[':date']).toEqual(`appt#${context.arguments.date}`);
});
