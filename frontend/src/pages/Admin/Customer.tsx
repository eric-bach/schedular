import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Loader } from '@aws-amplify/ui-react';
import { BookingItem, GetBookingsResponse } from '../../types/BookingTypes';
import { GET_BOOKINGS } from '../../graphql/queries';
import Bookings from './Bookings';

function Customer() {
  const { id: customerId } = useParams();
  const { state } = useLocation();

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Customer Profile for {state.customer.firstName} {state.customer.lastName}
      </Typography>
      <Bookings customer={state.customer} />
    </Container>
  );
}

export default Customer;
