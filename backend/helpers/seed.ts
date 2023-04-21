import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { fromIni } from '@aws-sdk/credential-providers';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const appName: string = 'schedular';
var env: string = 'dev';
var profile: string = 'default';

async function seed() {
  try {
    getParams();
    console.log(`✅ Seeding environment ${env} using profile ${profile}`);

    // Get DynamoDB table name
    const tableName = await getTableName();
    console.log('🚀 Seed table: ', tableName);

    // Generate random seed data
    const data = generateRandomSeedData();
    console.log('🚀 Seed data length: ', data.length);

    // Seed each item in table
    console.log('\n🚀 Starting to seed table...');
    data.map(async (item: any) => {
      await seedItem(tableName, item);
    });
  } catch (error) {
    console.error('🛑 Error seeding database\n', error);
    process.exit(-1);
  }
}

function getParams() {
  const program = new Command();
  program.arguments('<env> <profile>');
  program.parse();

  env = program.args[0].toLowerCase() ?? '';
  profile = program.args[1].toLowerCase() ?? '';
}

async function seedItem(tableName: string, item: any) {
  item.createdAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();

  const putItemCommandInput: PutItemCommandInput = {
    TableName: tableName,
    Item: marshall(item),
  };

  await dynamoDbCommand(new PutItemCommand(putItemCommandInput));
}

function generateRandomSeedData() {
  const data = [];
  // TODO Change to month
  for (var d = dayjs(); d < dayjs().add(1, 'week'); d = dayjs(d).add(1, 'day')) {
    // Exclude weekends
    if (dayjs(d).day() === 0 || dayjs(d).day() === 6) continue;

    for (var h = 8; h < 17; h++) {
      // Randomly skip
      let rand = Math.floor(Math.random() * 2);
      if (rand % 2 === 1) continue;

      const duration = 60;
      let sk = dayjs(d).set('hour', h).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();

      data.push({
        pk: `appt#${uuidv4()}`,
        sk,
        status: 'available',
        type: 'appt',
        category: 'massage',
        date: `appt#${sk.substring(0, 10)}`,
        duration,
      });
    }
  }

  return data;
}

async function getTableName(): Promise<string> {
  var tableName: string = `${appName}-${env}-Data`;

  const client = new CloudFormationClient({ credentials: fromIni({ profile: profile }) });
  const command = new DescribeStacksCommand({ StackName: `${appName}-database-${env}` });
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
    var client = new DynamoDBClient({ credentials: fromIni({ profile: profile }) });

    console.debug(`🔔 Seeding item: ${JSON.stringify(command)}`);
    result = await client.send(command);

    console.log(`🔔 DynamoDB result:${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`🛑 Error with DynamoDB command:\n`, error);
  }

  return result;
}

seed();
