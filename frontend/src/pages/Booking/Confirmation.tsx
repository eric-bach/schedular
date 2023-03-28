import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';

export default function Confirmation() {
  const { id: confirmationId } = useParams();
  const { state } = useLocation();
  console.log(state);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Alert severity='success' sx={{ mb: 2 }}>
        <AlertTitle>Success</AlertTitle>
        Appointment successfully booked
      </Alert>
      <Typography variant='h5' component='h5'>
        Name: {state.customer.name}
      </Typography>
      <Typography variant='h5' component='h5'>
        Email: {state.customer.email}
      </Typography>
      <Typography variant='h5' component='h5'>
        Phone: {state.customer.phone}
      </Typography>
      <Typography variant='h5' component='h5'>
        Appointment Date: {state.timeslot}
      </Typography>
      <Typography variant='h5' component='h5'>
        Massage Therapist:
      </Typography>
      <Typography variant='h5' component='h5'>
        Confirmation Id: {confirmationId}
      </Typography>
    </Container>
  );
}
