import { BatchWriteItemCommand, BatchWriteItemInput, BatchWriteItemOutput, DeleteRequest, DynamoDBClient, WriteRequest } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

type AppointmentInput = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
};
type AppSyncEvent = {
  arguments: {
    input: {
      appointments: [AppointmentInput];
    };
  };
};

exports.handler = async (event: AppSyncEvent) => {
  console.log('🕧 AppSync event:', JSON.stringify(event));

  const { appointments } = event.arguments.input;

  // Get all create, update, delete operations
  const createAppointments = appointments.filter((x) => x.status === 'new*');
  const updateAppointments = appointments.filter((x) => !x.status.endsWith('*'));
  const deleteAppointments = appointments.filter((x) => x.status === 'pending*');
  console.log('Create appointments:', JSON.stringify(createAppointments));

  // Create appointments
  let putRequests: WriteRequest[] = [];
  for (const appointment of createAppointments) {
    const item = {
      pk: appointment.pk,
      sk: appointment.sk,
      status: appointment.status,
      type: appointment.type,
      category: appointment.category,
      duration: appointment.duration,
      administratorDetails: marshall({
        id: appointment.administratorDetails.id,
        firstName: appointment.administratorDetails.firstName,
        lastName: appointment.administratorDetails.lastName,
      }),
    };

    const putRequest: WriteRequest = { PutRequest: { Item: marshall(item) } };
    putRequests.push(putRequest);
  }

  // Delete appointments
  let deletetRequests: any[] = [];
  for (const appointment of deleteAppointments) {
    const deleteRequest: DeleteRequest = { Key: marshall({ pk: appointment.pk, sk: appointment.sk }) };
    deletetRequests.push({ DeleteRequest: deleteRequest });
  }

  const input: BatchWriteItemInput = {
    RequestItems: {
      'schedular-Data': [...putRequests, ...deletetRequests],
    },
  };
  const result = await dynamoDbCommand(new BatchWriteItemCommand(input));

  // TODO Update appointments

  // TODO Return result
  console.log(`✅ Upsert Appointments completed: ${JSON.stringify({ result: result })}`);
  return {};
};

async function dynamoDbCommand(command: BatchWriteItemCommand): Promise<BatchWriteItemOutput | undefined> {
  var result;

  try {
    console.debug('ℹ️ Initializing DynamoDB client');
    var client = new DynamoDBClient({});
    //var client = DynamoDBDocumentClient.from(client);

    console.debug(`ℹ️ Executing DynamoDB command:\n${JSON.stringify(command)}`);
    result = await client.send(command);

    console.log(`🔔 DynamoDB result:\n${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`🛑 Error with DynamoDB command:\n`, error);
  }

  return result;
}
