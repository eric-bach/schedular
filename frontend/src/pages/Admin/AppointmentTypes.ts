import { Base } from '../../types/BaseTypes';

export type AppointmentItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  date: string;
  duration: number;
  bookingId: string;
  customerDetails: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export type GetAppointmentsResponse = {
  getAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};
