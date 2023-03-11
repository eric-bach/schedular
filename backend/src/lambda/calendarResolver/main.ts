import getAvailableAppointments from './getAvailableAppointments';
import getScheduledAppointments from './getScheduledAppointments';
import bookAppointment from './bookAppointment';

import { AppSyncEvent } from '../types/AppSync';

exports.handler = async (event: AppSyncEvent) => {
  console.debug(`🕧 AppSync event: ${JSON.stringify(event)}`);
  console.debug(`🕧 AppSync info: ${JSON.stringify(event.info)}`);
  console.debug(`🕧 AppSync arguments: ${JSON.stringify(event.arguments)}`);

  switch (event.info.fieldName) {
    // Queries
    case 'getAvailableAppointments':
      console.debug(`🔔 getAvailableAppointments: ${JSON.stringify(event.arguments.date)}`);
      return await getAvailableAppointments(event.arguments.date, event.arguments.lastEvaluatedKey);
    case 'getScheduledAppointments':
      console.debug(`🔔 getScheduledAppointments: ${JSON.stringify(event.arguments.date)}`);
      return await getScheduledAppointments(event.arguments.date, event.arguments.lastEvaluatedKey);

    // Mutations
    case 'bookAppointment':
      console.debug(`🔔 bookAppointment: ${JSON.stringify(event.arguments.bookingInput)}`);
      return await bookAppointment(event.arguments.bookingInput);

    default:
      console.error(`🛑 No AppSync resolver defined for ${event.info.fieldName}`);
      return null;
  }
};
