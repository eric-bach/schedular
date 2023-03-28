# Tech

- [x] Clean up types for Booking.tsx
- [x] Switch to AppSync JS Resolvers
  - Send email from Lambda resolver
  - Save additional fields in booking (email, name, phone)

# User

- [x] As a user I want to be able to sign up
- [x] As a user I want to be able to book an appointment
- [] As a user I want a confirmation of a booked appointment
  - Clean up confirmation page layout, include more fields from backend
- [] As a user I want to receive a confirmation email for an appointment
  - Test email is sent out
  - Move email sending to asynchronous event (EB->SQS->Lambda)
- [] As a user I want to see my past/upcoming appointments
- [] As a user I want the ability to cancel an appointment
- [] As a user I want to receive notification email of an upcoming appointment

# Admin

- [] As a massage therapist I want to be able to see all my daily appointments
- [] As a massage therapist I want to be able to set my availability
- [] As a massage therapist I want to require a phone consultation before a massage booking
- [] As a massage therapist I want to be able to see and manage a users bookings
