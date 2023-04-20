import { Base } from '../../types/BaseTypes';

export type BookingItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
  appointmentId: string;
  appointmentDetails: {
    sk: string;
    duration: number;
    type: string;
    category: string;
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

export type CancelBookingResponse = {
  cancelBooking: {
    pk: string;
    sk: string;
    status: string;
    type: string;
    appointmentId: string;
    appointmentDetails: {
      sk: string;
      duration: number;
      type: string;
      category: string;
    };
    customerDetails: {
      id: string | undefined;
      firstName: string | undefined;
      lastName: string | undefined;
      email: string | undefined;
      phone: string | undefined;
    };
    bookingId: string;
  };
};
