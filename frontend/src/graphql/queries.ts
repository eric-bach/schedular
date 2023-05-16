export const GET_AVAILABLE_APPOINTMENTS = `query GetAvailableAppointments($to: String!, $from: String!, $lastEvaluatedKey: LastEvaluatedKey) {
  getAvailableAppointments(from: $from, to: $to, lastEvaluatedKey: $lastEvaluatedKey) {
    items {
      pk
      sk
      status
      type
      category
      duration
      administratorDetails {
        id
        firstName
        lastName
      }
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
      administratorDetails {
        id
        firstName
        lastName
      }
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
      administratorDetails {
        id
        firstName
        lastName
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
    administratorDetails {
      id
      firstName
      lastName
    }
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
    administratorDetails {
      id
      firstName
      lastName
    }
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

export const UPSERT_DELETE_APPOINTMENTS = `mutation UpsertDeleteAppointments($input: UpsertAppointmentsInput!) {
  upsertDeleteAppointments(input: $input) {
    upserted {
      pk
      sk
      status
      type
      category
      duration
      administratorDetails {
        id
        firstName
        lastName
      }
    }
    deleted {
      pk
      sk
    }
  }
}`;

export const LIST_USERS_IN_GROUP = `query ListUsersInGroup($groupName: String!, $limit: Int, $nextToken: String) {
  listUsersInGroup(groupName: $groupName, limit: $limit, nextToken: $nextToken) {
    users {
      id
      firstName
      lastName
      email
      phoneNumber
    }
    nextToken
  }
}`;

export const ADD_USER_TO_GROUP = `mutation AddUserToGroup($userId: String!, $groupName: String!) {
  addUserToGroup(userId: $userId, groupName: $groupName) 
}`;

export const ON_CANCEL_BOOKING = `subscription OnCancelBooking {
  onCancelBooking {
    pk
    sk
    type
    administratorDetails {
      id
      firstName
      lastName
    }
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
} 
`;
