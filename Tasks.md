# Tech

- [x] Clean up types for Booking.tsx
- [x] Switch to AppSync JS Resolvers
- [x] SignIn/SignOut does not toggle Avatar properly

# User

- [x] As a user I want to be able to sign up
- [x] As a user I want to be able to book an appointment
- [x] As a user I want a confirmation of a booked appointment
- [x] As a user I want to receive a confirmation email for an appointment
- [] As a user I want to see my past/upcoming appointments
- [] As a user I want the ability to cancel an appointment
- [] As a user I want to receive notification email of an upcoming appointment

# Admin

- [] As a massage therapist I want to be able to see all my daily appointments
- [] As a massage therapist I want to be able to set my availability
- [] As a massage therapist I want to require a phone consultation before a massage booking
- [] As a massage therapist I want to be able to see and manage a users bookings

```
mutation BookAppointment {
  bookAppointment(bookingInput: {customer: {email: "test@test.com", name: "Eric", phone: "123"}, pk: "123", sk: "123"})
  {
    pk
    sk
    confirmationId
    status
    customerName
    customerEmail
    customerPhone
  }
}


query GetAvailableAppointments {
  getAvailableAppointments(date: "2023-03-31")
  {
    items {
      pk
      sk
      type
      date
      startTime
      endTime
      duration
      status
    }
  }
}
```
