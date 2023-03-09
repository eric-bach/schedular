import { LastEvaluatedKey } from '../types/AppSync';

async function getScheduledAppointments(
  date: string,
  lastEvaluatedKey: LastEvaluatedKey
) {
  console.debug('🕧 getScheduledAppointments Initialized');
}

export default getScheduledAppointments;
