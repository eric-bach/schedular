import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { LastEvaluatedKey } from '../types/AppSync';
import dynamoDbCommand from '../helpers/dynamoDbCommand';

async function getAvailableAppointments(
  date: string,
  lastEvaluatedKey: LastEvaluatedKey
) {
  console.debug('🕧 getAvailableAppointments Initialized');

  let queryCommandInput: QueryCommandInput;
  queryCommandInput = {
    // TODO Set Table name
    TableName: 'myapp-Data', //process.env.DATA_TABLE_NAME,
    KeyConditionExpression: 'pk = :v1 AND begins_with(sk, :v2)',
    FilterExpression: '#s = :v3',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':v1': { S: 'appt' },
      ':v2': { S: date },
      ':v3': { S: 'open' },
    },
  };
  lastEvaluatedKey
    ? (queryCommandInput.ExclusiveStartKey = marshall(lastEvaluatedKey))
    : lastEvaluatedKey;

  var result = await dynamoDbCommand(new QueryCommand(queryCommandInput));

  if (result && result.$metadata.httpStatusCode === 200) {
    console.log(`🔔 Found appointments: ${JSON.stringify(result)}`);

    // Check for LastEvaluatedKey
    var lastEvalKey;
    if (result.LastEvaluatedKey) {
      let lek = unmarshall(result.LastEvaluatedKey);
      lastEvalKey = lek ? lek : '';
    }

    var results: any = [];
    for (const item of result.Items) {
      console.debug('ℹ️ Item: ', JSON.stringify(item));

      var uItem = unmarshall(item);
      results.push(uItem);
    }

    console.debug('ℹ️ Appointments: ', JSON.stringify(results));

    return results;
  }
}

export default getAvailableAppointments;
