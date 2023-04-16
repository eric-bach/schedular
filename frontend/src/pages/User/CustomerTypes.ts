import { Base } from '../../types/BaseTypes';

export type BookingItem = {
  pk: string;
  sk: string;
  status: string;
  type: string;
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
