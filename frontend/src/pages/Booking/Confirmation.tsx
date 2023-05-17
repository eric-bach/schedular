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
        Appointment Details <Chip label='booked' color='success' />
      </Typography>

      <Typography variant='h6' gutterBottom>
        Client Information:
      </Typography>
      <Typography variant='body1'>{state.customer.name}</Typography>
      <Typography variant='body1'>{state.customer.email}</Typography>
      <Typography variant='body1' gutterBottom>
        {state.customer.phone}
      </Typography>

      <Typography variant='h6' gutterBottom>
        Appointment Information:
      </Typography>
      <Typography variant='body1' gutterBottom>
        Date: {formateLocalLongDate(state.appointment.sk)} at {formatLocalTimeString(state.appointment.sk, 0)}
      </Typography>
      <Typography variant='body1' gutterBottom>
        Therapist: {state.appointment.administratorDetails.firstName} {state.appointment.administratorDetails.lastName}
      </Typography>
      <Typography variant='h6' gutterBottom>
        Booking Reference:
      </Typography>
      <Typography variant='body1'>Confirmation Id: {confirmationId}</Typography>

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
