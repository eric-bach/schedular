import { AppSyncClient, EvaluateCodeCommand, EvaluateCodeCommandInput } from '@aws-sdk/client-appsync';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { readFile } from 'fs/promises';
const appsync = new AppSyncClient({ region: 'us-east-1' });
const file = './lib/graphql/Query.getUserBookings.js';

describe('getUserBookings', () => {
  it('should get bookings for a customer', async () => {
    // Arrange
    const context = {
      arguments: {
        customerId: '123',
        datetime: new Date().toISOString(),
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
    expect(result.query.expression).toEqual('customerId = :customerId AND sk >= :datetime');

    const expressionValues = unmarshall(result.query.expressionValues);
    expect(expressionValues[':customerId']).toEqual(context.arguments.customerId);
    expect(expressionValues[':datetime']).toEqual(context.arguments.datetime);

    // Type is filtered to 'booking'
    const filterValues = unmarshall(result.filter.expressionValues);
    expect(filterValues[':type']).toEqual('booking');
  }, 20000);
});
