```
query GetAvailableAppointments {
  getAvailableAppointments(from: "2023-04-20T06:00:00Z", to: "2023-04-22T06:00:00Z")
  {
    items {
      pk
      sk
      status
      type
      category
      duration
      bookingId
      updatedAt
      createdAt
    }
  }
}

query GetAppointments {
  getAppointments(from: "2023-04-21T06:00:00Z", to: "2023-04-22T06:00:00Z")
  {
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

      updatedAt
      createdAt
    }
  }
}

query GetBookings {
  getBookings(customerId: "79aea011-a655-447a-92d4-1d17be6d0ea4", datetime: "2023-04-16T00:00:00Z")
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
		pk: "appt#a8680d6a-4011-4805-a79e-5a201137ce66",
		sk: "2023-04-21T18:00:00.000Z"
		customer: {
      id: "79aea011-a655-447a-92d4-1d17be6d0ea4",
      firstName: "Eric",
      lastName: "Test",
      email: "test@test.com",
      phone: "123"
    },
    appointmentDetails: {
      duration: 60,
      type: "appt",
      category: "massage"
    },
    envName: "dev"
  })
  {
    pk
    sk
    type
    appointmentDetails {
      pk
      sk
      duration
      type
      category
    }
    customerId
    customerDetails  {
      id
      firstName
      lastName
      email
      phone
    }
  }
}

mutation CancelBooking {
  cancelBooking(input: {
    bookingId: "booking#4265920a-db4a-439e-a922-fd575d7c2871",
    appointmentId: "appt#dba247d8-86f8-4a97-859c-95a292416879",
    sk: "2023-04-20T14:00:00.000Z",
    envName: "dev"
  })
  {
    cancellationReasons
    keys {
      pk
      sk
    }
  }
}
```