import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { marshall } from '@aws-sdk/util-dynamodb';
import dayjs from 'dayjs';
import * as fs from 'fs';

async function seed() {
  try {
    // Get DynamoDB table name
    const tableName = await getTableName('schedular-database-dev');
    console.log('✅ Seed table: ', tableName);

    // Read items to see from data/seeds.json
    //const data = getSeedData('./data/seeds.json');
    // Generate random seed data
    const data = generateRandomSeedData();
    console.log('✅ Seed data: ', data);

    console.log('\n🚀 Starting to seed table...');

    // Seed each item in table
    data.map(async (item: any) => {
      await seedItem(tableName, item);
    });

    generateRandomSeedData();
  } catch (error) {
    console.error('🛑 Error seeding database\n', error);
    process.exit(-1);
  }
}

async function seedItem(tableName: string, item: any) {
  item.sk = item.sk + new Date().toISOString();
  item.createdAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();

  const putItemCommandInput: PutItemCommandInput = {
    TableName: tableName,
    Item: marshall(item),
  };

  await dynamoDbCommand(new PutItemCommand(putItemCommandInput));
}

function getSeedData(file: string) {
  try {
    const jsonString = fs.readFileSync(file);
    const data = JSON.parse(jsonString.toString());

    return data;
  } catch (err) {
    console.error('🛑 Error reading seed file\n', err);
    return;
  }
}

function generateRandomSeedData() {
  const data = [];
  for (var d = dayjs(); d < dayjs().add(1, 'month'); d = dayjs(d).add(1, 'day')) {
    for (var h = 8; h < 16; h++) {
      let sk = dayjs(d).set('hour', h).set('minute', 0).set('second', 0).set('millisecond', 0);
      data.push({ pk: 'appt', sk: sk.toISOString(), duration: 60, status: 'open', type: 'massage' });
    }
  }
  return data;
}

async function getTableName(stackName: string): Promise<string> {
  var tableName: string = 'schedular-dev-Data';

  const client = new CloudFormationClient({});
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);

  if (response && response.$metadata.httpStatusCode === 200) {
    const outputs = response.Stacks![0].Outputs;
    const output = outputs?.filter((o) => o.OutputKey === 'DataTableName')[0];
    tableName = output?.OutputValue!;
  }

  return tableName;
}

async function dynamoDbCommand(command: any) {
  var result;

  try {
    var client = new DynamoDBClient({});

    console.debug(`🔔 Seeding item: ${JSON.stringify(command)}`);
    result = await client.send(command);

    console.log(`🔔 DynamoDB result:${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`🛑 Error with DynamoDB command:\n`, error);
  }

  return result;
}

seed();
