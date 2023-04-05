import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { formatTime } from '../../helpers/utils';

export default function Confirmation() {
  const { id: confirmationId } = useParams();
  const { state } = useLocation();

  const navigate = useNavigate();

  let date = state.timeslot.substring(0, 10);
  let time = state.timeslot.substring(11, 16);

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
        Date: {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at{' '}
        {formatTime(time)}
      </Typography>

      <Typography variant='h6' gutterBottom>
        Booking Reference:
      </Typography>
      <Typography variant='body1'>Confirmation Id: {confirmationId}</Typography>

      <Button
        variant='contained'
        sx={{ mt: 2 }}
        onClick={() => {
          navigate('/user/appointments');
        }}
      >
        See My Appointments
      </Button>
    </Container>
  );
}
