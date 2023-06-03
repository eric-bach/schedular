```
query GetAvailableAppointments {
  getAvailableAppointments(from: "2023-05-04T06:00:00Z", to: "2023-05-05T06:00:00Z")
  {
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
      updatedAt
      createdAt
    }
  }
}

query GetAppointments {
  getAppointments(from: "2023-05-04T06:00:00Z", to: "2023-05-05T06:00:00Z")
  {
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
      updatedAt
      createdAt
    }
  }
}

query GetBookings {
  getBookings(datetime: "2023-04-16T00:00:00Z")
  {
    items {
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
  }
}

query GetUserBookings {
  getUserBookings(customerId: "79aea011-a655-447a-92d4-1d17be6d0ea4", datetime: "2023-04-16T00:00:00Z")
  {
    items {
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
  }
}

mutation CreateBooking {
  createBooking(input: {
		pk: "appt#4f81b5a0-f23b-4d7e-a97f-e31e12c2ddae",
		sk: "2023-06-01T15:00:00.000Z"
    customer: {
      id: "dac04046-6c46-4f93-a61b-bef3292b723b",
      firstName: "Eric",
      lastName: "Test",
      email: "test@test.com",
      phone: "123"
    },
    administratorDetails: {
      id: "dac04046-6c46-4f93-a61b-bef3292b723b",
      firstName: "Jane"
      lastName: "Doe"
    },
    appointmentDetails: {
      duration: 60,
      type: "appt",
      category: "massage"
    },
  })
  {
    pk
    sk
    type
    administratorDetails {
      firstName
      lastName
    }
    appointmentDetails {
      pk
      sk
      duration
      type
      category
    }
  }
}

mutation CancelBooking {
  cancelBooking(input: {
    bookingId: "booking#4265920a-db4a-439e-a922-fd575d7c2871",
    appointmentId: "appt#dba247d8-86f8-4a97-859c-95a292416879",
    sk: "2023-04-20T14:00:00.000Z",
  })
  {
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
  }
}

mutation UpsertDeleteAppointments {
  upsertDeleteAppointments(input: {
    appointments: [{
      pk: "12345",
			sk: "2023-06-01T14:00:00.000Z",
      status: "new*",
      type: "appt",
      category: "massage",
      duration: 60,
      administratorDetails: {
        id: "123",
        firstName: "Jane",
        lastName: "Doe"
      }
    },
    {
      pk: "appt#5d0cf170-dfe1-4d87-8a03-fa62cee9d573",
 			sk: "2023-05-09T14:00:00.000Z",
 			status: "pending*",
      type: "appt",
      category: "massage",
      duration: 60,
      administratorDetails: {
        id: "123",
        firstName: "Jane",
        lastName: "Doe"
      }
    }]
  })
  {
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
}

query ListUsersInGroup {
  listUsersInGroup(groupName: "Clients", limit: 1) {
    users {
      id
      firstName
      lastName
      email
      phoneNumber
    }
    nextToken
  }
}

mutation AddUserToGroup {
  addUserToGroup(userId: "123", groupName: "Clients") {
    id
    firstName
    lastName
		email
    phoneNumber
  }
}
```
