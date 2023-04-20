export const GET_AVAILABLE_APPOINTMENTS = `query GetAvailableAppointments($to: String!, $from: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(from: $from, to: $to, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      status
      type
      category
      date
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
      date
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
      status
      type
      appointmentDetails {
        sk
        duration
        type
        category
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

export const CREATE_BOOKING = `mutation CreateBooking($input: BookingInput!) {
  createBooking(bookingInput: $input) {
    pk
    sk
    status
    type
    category
    date
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
}`;
