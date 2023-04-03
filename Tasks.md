# Tech

- [x] Clean up types for Booking.tsx
- [x] Switch to AppSync JS Resolvers
- [x] SignIn/SignOut does not toggle Avatar properly
- [x] Save object (Customer, Date/Time) in DynamoDB
- [x] withAuthenticator - https://ui.docs.amplify.aws/react/guides/auth-protected
- \*[] clean up frontend types
- [] Build out a proper Appointment Confirmation email template
- [] Verify email domain to remove spoofing warning

# User

- [x] As a user I want to be able to sign up
- [x] As a user I want to be able to book an appointment
- [x] As a user I want a confirmation of a booked appointment
- [x] As a user I want to receive a confirmation email for an appointment
- [x] As a user I want to see my past/upcoming appointments
- [] As a user I want the ability to cancel an appointment
- [] As a user I want to receive notification email of an upcoming appointment

# Admin

- \*[] As a massage therapist I want to be able to see all my daily appointments
- \*[] As a massage therapist I want to be able to set my availability
- [] As a massage therapist I want to require a phone consultation before a massage booking
- [] As a massage therapist I want to be able to see and manage a users bookings

```
mutation BookAppointment {
  bookAppointment(bookingInput: {customer: {id: "123", email: "test@test.com", name: "Eric", phone: "123"}, pk: "123", sk: "123"})
  {
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
}


query GetAvailableAppointments {
  getAvailableAppointments(date: "2023-04-05")
  {
    items {
      pk
      sk
      type
      status
      appointmentDateEpoch
      appointmentDetails {
        date
        startTime
        endTime
        duration
      }
      confirmationId
    }
  }
}

query GetCustomerAppointments {
  getCustomerAppointments(customerId: "79aea011-a655-447a-92d4-1d17be6d0ea4", appointmentDateEpoch: 1680595200000)
  {
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
      customerId
      customerDetails
      {
        name
        email
        phone
      }
    }
  }
}
```
