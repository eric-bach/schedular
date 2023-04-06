export const GET_AVAILABLE_APPOINTMENTS = `query GetAvailableAppointments($date: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(date: $date, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      type
      status
      appointmentDateEpoch
      duration
      confirmationId    
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
      type
      status
      appointmentDateEpoch
      duration
      customerId
      customerDetails {
        name
        email
        phone
      }
      confirmationId
    }
  }
}`;

export const GET_CUSTOMER_APPOINTMENTS = `query GetCustomerAppointments($customerId: String!, $appointmentDateEpoch: Float!, $lastEvaluatedKey: LastEvaluatedKey) {
  getCustomerAppointments(customerId: $customerId, appointmentDateEpoch: $appointmentDateEpoch, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      type
      status
      duration
      confirmationId    
      customerId
      customerDetails {
        name
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

export const BOOK_APPOINTMENT = `mutation BookAppointment($input: BookingInput!) {
  bookAppointment(bookingInput: $input) {
    pk
    sk
    status
    duration
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
