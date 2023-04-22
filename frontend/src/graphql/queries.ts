export const GET_AVAILABLE_APPOINTMENTS = `query GetAvailableAppointments($to: String!, $from: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(from: $from, to: $to, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      status
      type
      category
      duration
      bookingId
      customerDetails {
        id
        firstName
        lastName
        email
        phone
      }
    }
    lastEvaluatedKey
    {
      pk
      sk
    }
  }
}`;

export const GET_APPOINTMENTS = `query GetAppointments($from: String!, $to: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAppointments(from: $from, to: $to, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      status
      type
      category
      duration
      bookingId
      customerDetails{
        id
        firstName
        lastName
        email
        phone
      }
    }
    lastEvaluatedKey
    {
      pk
      sk
    }
  }
}`;

export const GET_BOOKINGS = `query GetBookings($customerId: String!, $datetime: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getBookings(customerId: $customerId, datetime: $datetime, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      type
      appointmentDetails {
        pk
        sk
        duration
        type
        category
        status
      }
      customerId
      customerDetails {
        id
        firstName
        lastName
        email
        phone
      }
    }
    lastEvaluatedKey
    {
      pk
      sk
    }
  }
}`;

export const CREATE_BOOKING = `mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    pk
    sk
    type
    appointmentDetails {
      pk
      sk
      type
      category
      status
      duration
    }
    customerId
    customerDetails {
      id
      firstName
      lastName
      email
      phone
    }
  }
}`;

export const CANCEL_BOOKING = `mutation CancelBooking($input: CancelBookingInput!) {
  cancelBooking(input: $input) {
    pk
    sk
    type
    appointmentDetails {
      pk
      sk
      type
      category
      status
      duration
    }
    customerId
    customerDetails {
      id
      firstName
      lastName
      email
      phone
    }
  }
}`;
