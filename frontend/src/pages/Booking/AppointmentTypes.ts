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

export type BookingInput = {
  pk: string;
  sk: string;
  customer: {
    id: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    email: string | undefined;
    phone: string | undefined;
  };
  appointmentDetails: {
    duration: number;
    type: string;
    category: string;
  };
  envName: string;
};
