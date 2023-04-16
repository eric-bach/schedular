export const GET_AVAILABLE_APPOINTMENTS = `query GetAvailableAppointments($date: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(date: $date, lastEvaluatedKey: $lastEvaluatedKey) {
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

export const GET_APPOINTMENTS = `query GetAppointments($date: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAppointments(date: $date, lastEvaluatedKey: $lastEvaluatedKey) {
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
    cancellationReasons
    keys
    {
      pk
      sk
    }
  }
}`;
