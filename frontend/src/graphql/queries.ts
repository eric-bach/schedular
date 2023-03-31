export const GET_APPOINTMENTS = `query GetAppointments($date: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(date: $date, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      type
      status
      appointmentDetails {
        date
        startTime
        endTime
        duration
      }
      confirmationId    
    }
    lastEvaluatedKey
    {
      pk
      sk
    }
  }
}`;

export const BOOK_APPOINTMENT = `mutation BookAppointment($input: BookingInput!) {
  bookAppointment(bookingInput: $input) {
    pk
    sk
    status
    appointmentDetails {
      date
      startTime
      endTime
      duration
    }
    confirmationId
    customerId
    customerDetails
    {
      name
      email
      phone
    }
  }
}`;
