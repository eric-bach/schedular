import { Base } from './BaseTypes';

// GetAvailableAppointments - /booking
export type AvailableAppointmentItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  bookingId: string;
};
export type GetAvailableAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AvailableAppointmentItem];
  };
  lastEvaluatedKey: Base;
};

// GetAppointments - /admin/schedule
export type AppointmentItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  customerDetails: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  bookingId: string;
};
export type GetAppointmentsResponse = {
  getAppointments: {
    items: [AppointmentItem];
  };
  lastEvaluatedKey: Base;
};

// CreateBooking - /booking
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
export type CreateBookingResponse = {
  createBooking: {
    pk: string;
    sk: string;
    type: string;
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

// GetBookings = /user/appointments
export type BookingItem = {
  pk: string;
  sk: string;
  type: string;
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

// CancelBooking - /user/appointments
export type CancelBookingInput = {
  bookingId: string;
  appointmentId: string;
  sk: string;
  envName: string;
};
export type CancelBookingResponse = {
  cancelBooking: {
    pk: string;
    sk: string;
    type: string;
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
