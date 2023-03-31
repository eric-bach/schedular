export type Base = {
  pk: string;
  sk: string;
};

export type AppointmentItem = {
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
  confirmationId: string;
};

export type GetAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};

export type AppointmentBookingResponse = {
  bookAppointment: {
    pk: string;
    sk: string;
    confirmationId: string;
    status: string;
    appointmentDetails: {
      date: string;
      startTime: string;
      endTime: string;
      duration: number;
    };
    customerId: string;
    customerDetails: {
      name: string;
      email: string;
      phone: string;
    };
  };
};
