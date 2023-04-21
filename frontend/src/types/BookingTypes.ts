import { Base } from './BaseTypes';

export type AppointmentItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  bookingId: string;
};

export type GetAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};

export type BookingItem = {
  pk: string;
  sk: string;
  type: string;
  appointmentId: string;
  appointmentDetails: {
    pk: string;
    sk: string;
    type: string;
    category: string;
    status: string;
    duration: number;
  };
  customerId: String;
  customerDetails: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export type GetBookingsResponse = {
  getBookings: {
    items: [BookingItem];
  };
  lastEvaluatedKey: Base;
};

export type CancelBookingInput = {
  bookingId: string;
  appointmentId: string;
  sk: string;
  envName: string;
};

// CreateBooking
export type CreateBookingResponse = {
  createBooking: {
    pk: string;
    sk: string;
    type: string;
    appointmentId: string;
    appointmentDetails: {
      pk: string;
      sk: string;
      type: string;
      category: string;
      status: string;
      duration: number;
    };
    customerId: string;
    customerDetails: {
      id: string | undefined;
      firstName: string | undefined;
      lastName: string | undefined;
      email: string | undefined;
      phone: string | undefined;
    };
  };
};

// CancelBooking
export type CancelBookingResponse = {
  cancelBooking: {
    pk: string;
    sk: string;
    type: string;
    appointmentId: string;
    appointmentDetails: {
      pk: string;
      sk: string;
      type: string;
      category: string;
      status: string;
      duration: number;
    };
    customerDetails: {
      id: string | undefined;
      firstName: string | undefined;
      lastName: string | undefined;
      email: string | undefined;
      phone: string | undefined;
    };
  };
};

// CreateBooking
export type CreateBookingInput = {
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
