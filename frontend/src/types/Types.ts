import { Base } from './BaseTypes';

// GetAvailableAppointments - /booking
export type AvailableAppointmentItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bookingId?: string;
  customerDetails?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};
export type GetAppointmentsResponse = {
  getAppointments: {
    items: AppointmentItem[];
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
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
  appointmentDetails: {
    duration: number;
    type: string;
    category: string;
  };
};
export type CreateBookingResponse = {
  createBooking: {
    pk: string;
    sk: string;
    type: string;
    administratorDetails: {
      id: string;
      firstName: string;
      lastName: string;
    };
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
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
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
  appointmentDetails: {
    pk: string;
    sk: string;
    type: string;
    category: string;
    status: string;
    duration: number;
  };
};
export type CancelBookingResponse = {
  cancelBooking: {
    pk: string;
    sk: string;
    type: string;
    administratorDetails: {
      id: string;
      firstName: string;
      lastName: string;
    };
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

// OnCancelBooking
export type OnCancelBookingResponse = {
  pk: string;
  sk: string;
  type: string;
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
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

// UpsertDeleteAppointments
export type UpsertedAppointmentsResponse = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  category: string;
  duration: number;
  administratorDetails: {
    id: string;
    firstName: string;
    lastName: string;
  };
};
export type UpsertDeleteAppointmentsResponse = {
  upserted: [UpsertedAppointmentsResponse];
  deleted: [Base];
};

// ListUsersInGroup
export type Users = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};
export type ListUsersResponse = {
  listUsersInGroup: {
    users: Users[];
    nextToken: string;
  };
};
