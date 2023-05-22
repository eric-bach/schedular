import React from 'react';
import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Container, Typography } from '@mui/material';

import BookedAppointments from '../Booking/BookedAppointments';

// import aws_exports from '../../aws-exports';
import '@aws-amplify/ui-react/styles.css';

// Amplify.configure(aws_exports);

function Bookings() {
  const { user } = useAuthenticator((context) => [context.route]);

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Upcoming Bookings:
      </Typography>
      <BookedAppointments
        customer={{
          id: user.attributes?.sub,
          firstName: user.attributes?.firstName,
          lastName: user.attributes?.lastName,
          email: user.attributes?.email,
          phoneNumber: user.attributes?.phone_number,
        }}
      />
    </Container>
  );
}

export default Bookings;
