import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/Query.getAppointmentCounts.js';

describe('getAppointmentCounts', () => {
  it('should get all available appointment counts for a date range', async () => {
    // Arrange
    const today = new Date();
    const context = {
      arguments: {
        from: today.toISOString(),
        to: new Date(today.setDate(today.getDate() + 1)).toISOString(),
        status: 'available',
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
    expect(expressionValues[':status']).toEqual(context.arguments.status);

    // Status is filtered to 'available'
    const filterValues = unmarshall(result.filter.expressionValues);
    expect(filterValues[':s']).toEqual(context.arguments.status);
  }, 20000);

  it('should get all booked appointment counts for a date range', async () => {
    // Arrange
    const today = new Date();
    const context = {
      arguments: {
        from: today.toISOString(),
        to: new Date(today.setDate(today.getDate() + 1)).toISOString(),
        status: 'booked',
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
    expect(expressionValues[':status']).toEqual(context.arguments.status);

    // Status is filtered to 'available'
    const filterValues = unmarshall(result.filter.expressionValues);
    expect(filterValues[':s']).toEqual(context.arguments.status);
  }, 20000);
});
