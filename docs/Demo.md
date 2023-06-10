# Demo

## Admin: Creating a schedule

1. [Log in](https://schedular.ericbach.dev/login) to the application as an admin user
   ![login](/docs/img/admin_login.png)

2. click `Admin` -> `Manage Schedule` under the menu bar.
   ![schedule](/docs/img/admin_schedule1.png)

3. Select a date and click the ➕ icon to add a new timeslot. Click the ❌ icon to delete a timeslot.
   The `pending*` status indicates a timeslot that will be deleted upon saving.
   The `available*` status indicates a timeslot that will be deleted upon saving.
   If there are any booked appointments, they will not be deletable.
   ![schedule](/docs/img/admin_schedule2.png)

4. Click `Save` to save the changes. If there are any errors correc them before proceeding.
   ![schedule](/docs/img/admin_schedule3.png)

5. The created schedule will now appear in the calendar available for bookings.
   ![calendar](/docs/img/calendar1.png)

## New user sign-up

1. [Sign up](https://schedular.ericbach.dev/login) a new user

   ![sign up](/docs/img/sign_up1.png)

2. Verify email account

   ![sign up](/docs/img/sign_up2.png)

3. A newly signed up user will not have access to booking until authorized by an administrator.

## Admin: Authorize new user

1. [Log in](https://schedular.ericbach.dev/login) as admin

2. Click `Admin` -> `My Customers` under the menu to view all customers.
   ![customers](/docs/img/customers1.png)

3. Newly created users will appear under the `Unverified` tab. To authorize the user for booking, click their name. Verified users are allowed to make bookings.

   ![customers](/docs/img/customers2.png)

4. The user will now be able to view and make bookings.
   ![calendar](/docs/img/calendar1.png)

## Make a booking

1. To make a booking select a date and timeslot in the calendar.
   A 🟣 indicates a day with limited available appointments remaining. A 🔵 indicates a day with many available appointments remaining.
   ![booking](/docs/img/booking1.png)

2. Click `Confirm Appointment` to receive an email confirmation.
   ![booking](/docs/img/booking2.png)

3. To manage an existing booking, click the `User Avatar` -> `My Bookings`. This will allow users to view and cancel any upcoming bookings.
   ![booking](/docs/img/bookings3.png)

4. A booking reminder will be sent to the user email one day prior to the appointment.

## Admin: View Bookings

1. To view existing bookings go to `Admin` -> `View Bookings`.

2. The schedule will be listed after selecting a date in the calendar. A 🟣 indicates a day with one appointment booked. A 🔵 indicates a day with many appointments booked.

![booking](/docs/img/bookings4.png)

3. A daily summary of upcoming appointments will be sent a day before.
