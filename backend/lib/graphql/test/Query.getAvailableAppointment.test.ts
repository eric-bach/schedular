import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/build/Query.getAvailableAppointments.js';

describe('getAvailableAppointments', () => {
  it('should get all available appointments for a date range', async () => {
    // Arrange
    const today = new Date();
    const context = {
      arguments: {
        from: today.toISOString(),
        to: new Date(today.setDate(today.getDate() + 1)).toISOString(),
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
    expect(result.query.expression).toEqual('#type = :type AND sk BETWEEN :fromDate AND :toDate');

    const expressionValues = unmarshall(result.query.expressionValues);
    expect(expressionValues[':fromDate']).toEqual(context.arguments.from);
    expect(expressionValues[':toDate']).toEqual(context.arguments.to);

    // Status is filtered to 'available'
    const filterValues = unmarshall(result.filter.expressionValues);
    expect(filterValues[':s']).toEqual('available');
  }, 20000);
});
