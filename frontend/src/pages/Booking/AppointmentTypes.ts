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
};

export type GetAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};

export type AppointmentBookingResponse = {
  createBooking: {
    cancellationReasons: string;
    keys: [Base];
  };
};
