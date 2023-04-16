# Tech

- [x] Clean up types for Booking.tsx
- [x] Switch to AppSync JS Resolvers
- [x] SignIn/SignOut does not toggle Avatar properly
- [x] Save object (Customer, Date/Time) in DynamoDB
- [x] withAuthenticator - https://ui.docs.amplify.aws/react/guides/auth-protected
- [x] Fix up UTC to local time translation
- [] Update to use new table schema
  - [x] Generate new seed data
  - [x] Update GraphQL schema
  - [x] Update DynamoDB GSIs
  - [x] Update JS Resolvers
  - [x] Update example Queries/Mutations
  - [] Update React API calls
  - [] Update React component views
- [] Add more resolver tests
- [] Clean up styling
- [] Build out a proper Appointment Confirmation email template
- [] Verify email domain to remove spoofing warning

# User

- [x] As a user I want to be able to sign up
- [x] As a user I want to be able to book an appointment
- [x] As a user I want a confirmation of a booked appointment
- [x] As a user I want to receive a confirmation email for an appointment
- [x] As a user I want to see my upcoming appointments
- [] As a user I want the ability to cancel an appointment
- [] As a user I want to receive notification email of an upcoming appointment
- [] As a user I want to see my past appointments

# Admin

- [x] As a massage therapist I want to be able to see all my daily appointments
- [] As a massage therapist I want to be able to set my availability
- [] As a massage therapist I want to require a phone consultation before a massage booking
- [] As a massage therapist I want to be able to see and manage a users bookings

```
query GetAvailableAppointments {
  getAvailableAppointments(date: "2023-04-20")
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
    }
  }
}

query GetAppointments {
  getAppointments(date: "2023-04-20")
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
    pk: "appt#96823928-2bc3-4a25-8b3f-0904b3f160b7",
    sk: "2023-04-20T20:00:00.000Z",
    customer: {
      id: "79aea011-a655-447a-92d4-1d17be6d0ea4",
      name: "Eric",
      email: "test@test.com",
      phone: "123"
    },
    appointmentDetails: {
      duration: 60,
      type: "appt",
      category: "massage"
    }
  })
  {
    cancellationReasons
    keys
    {
      pk
      sk
    }
  }
}
```
