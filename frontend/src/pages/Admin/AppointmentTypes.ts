import { Base } from '../../types/BaseTypes';

export type CustomerViewModel = {
  name: string;
  email: string;
  phone: string;
};

export type AppointmentItem = {
  pk: string;
  sk: string;
  duration: number;
  customerId: string;
  customerDetails: CustomerViewModel;
  status: string;
  type: string;
  confirmationId: string;
};

export type GetAppointmentsResponse = {
  getAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};
