export type Base = {
  pk: string;
  sk: string;
};

export type CustomerViewModel = {
  name: string;
  email: string;
  phone: string;
};

export type CustomerAppointmentItem = {
  pk: string;
  sk: string;
  appointmentDetails: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  };
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
