export type Base = {
  pk: string;
  sk: string;
};

export type AppointmentItem = {
  pk: string;
  sk: string;
  duration: number;
  status: string;
  type: string;
};

export type GetAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};

export type AppointmentBookingResponse = {
  bookAppointment: {
    httpStatusCode: number;
    requestId: string;
    attempts: number;
    totalRetryDelay: number;
    confirmationId: string;
  };
};
