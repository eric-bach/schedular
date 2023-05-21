import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertTitle, Button, Container, Chip, Typography } from '@mui/material';

import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';

export default function Confirmation() {
  const { id: confirmationId } = useParams();
  const { state } = useLocation();

  const navigate = useNavigate();

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Alert severity='success' sx={{ mb: 2 }}>
        <AlertTitle>Success</AlertTitle>
        Your appointment has been successfully booked
      </Alert>

      <Typography variant='h4' component='h4' gutterBottom>
        Appointment Details <Chip label='booked' color='primary' />
      </Typography>

      <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
        Client Information:
      </Typography>
      <Typography variant='body1'>
        {state.customer.given_name} {state.customer.family_name}
      </Typography>
      <Typography variant='body1'>{state.customer.email}</Typography>
      <Typography variant='body1' gutterBottom sx={{ mb: 3 }}>
        {state.customer.phone_number}
      </Typography>

      <Typography variant='h6' gutterBottom>
        Appointment Information:
      </Typography>
      <Typography variant='body1'>{formateLocalLongDate(state.appointment.sk)}</Typography>
      <Typography variant='body1'>{formatLocalTimeString(state.appointment.sk, 0)}</Typography>
      <Typography variant='body1' gutterBottom>
        with {state.appointment.administratorDetails.firstName} {state.appointment.administratorDetails.lastName}
      </Typography>

      <Button
        variant='contained'
        sx={{ mt: 2 }}
        onClick={() => {
          navigate('/user/bookings');
        }}
      >
        See My Appointments
      </Button>
    </Container>
  );
}
