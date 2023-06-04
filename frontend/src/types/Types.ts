import { Base } from './BaseTypes';

// GetAvailableAppointments
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
};
export type GetAvailableAppointmentsResponse = {
  getAvailableAppointments: {
    items: [AvailableAppointmentItem];
  };
  lastEvaluatedKey: Base;
};

// GetAppointments
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

// CreateBooking
export type CreateBookingInput = {
  pk: string;
  sk: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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
  };
};

// GetUserBookings
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
};
export type GetUserBookingsResponse = {
  getUserBookings: {
    items: [BookingItem];
  };
  lastEvaluatedKey: Base;
};

// CancelBooking
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

// GetAppointmentCounts
export type GetAppointmentCount = {
  sk: string;
  count: number;
  day: number;
};
export type GetAppointmentCountItems = {
  items: [GetAppointmentCount];
};
export type GetAppointmentCountsResponse = {
  getAppointmentCounts: GetAppointmentCountItems;
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
