import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { LastEvaluatedKey } from '../types/AppSync';
import dynamoDbCommand from '../helpers/dynamoDbCommand';

async function getScheduledAppointments(
  date: string,
  lastEvaluatedKey: LastEvaluatedKey
) {
  console.debug('🕧 getScheduledAppointments Initialized');

  let queryCommandInput: QueryCommandInput;
  queryCommandInput = {
    TableName: process.env.DATA_TABLE_NAME,
    KeyConditionExpression: 'pk = :v1 AND begins_with(sk, :v2)',
    ExpressionAttributeValues: {
      ':v1': { S: 'appt' },
      ':v2': { S: date },
    },
  };
  lastEvaluatedKey
    ? (queryCommandInput.ExclusiveStartKey = marshall(lastEvaluatedKey))
    : lastEvaluatedKey;

  let results: any = [];
  let lastEvalKey;

  var result = await dynamoDbCommand(new QueryCommand(queryCommandInput));

  if (result && result.$metadata.httpStatusCode === 200) {
    console.log(`🔔 Found appointments: ${JSON.stringify(result)}`);

    // Check for LastEvaluatedKey
    if (result.LastEvaluatedKey) {
      let lek = unmarshall(result.LastEvaluatedKey);
      lastEvalKey = lek ? lek : '';
    }

    for (const item of result.Items) {
      console.debug('ℹ️ Item: ', JSON.stringify(item));

      var uItem = unmarshall(item);
      results.push(uItem);
    }

    console.debug('ℹ️ Appointments: ', JSON.stringify(results));
  }

  let res = { items: results, lastEvaluatedKey: lastEvalKey };
  console.log(`✅ Found Appointments: ${JSON.stringify(res)}`);
  return res;
}

export default getScheduledAppointments;