import { Base } from '../../types/BaseTypes';

export type CustomerViewModel = {
  name: string;
  email: string;
  phone: string;
};

export type CustomerAppointmentItem = {
  pk: string;
  sk: string;
  duration: number;
  status: string;
  type: string;
  customerId: String;
  customerDetails: CustomerViewModel;
  confirmationId: string;
};

export type GetCustomerAppointmentsResponse = {
  getCustomerAppointments: {
    items: [CustomerAppointmentItem];
  };
  lastEvaluatedKey: Base;
};
