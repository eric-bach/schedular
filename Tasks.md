# Tech

- [x] Clean up types for Booking.tsx
- [x] Switch to AppSync JS Resolvers
- [x] SignIn/SignOut does not toggle Avatar properly
- [x] Save object (Customer, Date/Time) in DynamoDB
- [x] withAuthenticator - https://ui.docs.amplify.aws/react/guides/auth-protected
- [x] Fix up UTC to local time translation
- [x] Update to use new table schema
- [x] Add more resolver tests
- [x] Switch resolvers to TypeScript
- [x] Fix UTC to local date/time
- [x] Fix email notifications
- [] Add pagination to bookings/appointments list
- [] Switch to use SES email templates
- [] Clean up styling
- [] Verify email domain to remove spoofing warning

# User

- [x] As a user I want to be able to sign up
- [x] As a user I want to be able to book an appointment
- [x] As a user I want a confirmation of a booked appointment
- [x] As a user I want to receive a confirmation email for an appointment
- [x] As a user I want to see my upcoming appointments
- [x] Bug: Fix issue with Bookings showing available appointments that have past
- [x] As a user I want the ability to cancel an appointment
- [] As a user I want to see my past appointments
  - [] Sort appointments
- [] As a user I want to receive notification email of an upcoming appointment

# Admin

- [x] As a massage therapist I want to be able to see all my daily appointments
- [] As a massage therapist I want to be able to set my availability
- [] As a massage therapist I want to require a phone consultation before a massage booking
- [] As a massage therapist I want to be able to see and manage a users bookings

```
query GetAvailableAppointments {
  getAvailableAppointments(from: "2023-04-20T06:00:00Z", to: "2023-04-21T06:00:00Z")
  {
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
      updatedAt
      createdAt
    }
  }
}

query GetAppointments {
  getAppointments(from: "2023-04-20T06:00:00Z", to: "2023-04-21T06:00:00Z")
  {
    items {
      pk
      sk
      status
      type
      category
      date
      duration
      bookingId
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
  }
}

mutation CreateBooking {
  createBooking(bookingInput: {
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
    status
    type
    category
    date
    duration
    bookingId
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
