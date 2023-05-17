import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import BookedAppointments from '../Booking/BookedAppointments';

function ManageCustomer() {
  const { state } = useLocation();
  const { customer } = state;

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Customer Profile for {customer.firstName} {customer.lastName}
      </Typography>
      <BookedAppointments customer={customer} />
    </Container>
  );
}

export default ManageCustomer;
