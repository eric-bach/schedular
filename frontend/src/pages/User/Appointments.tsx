import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';

import aws_exports from '../../aws-exports';
import { CANCEL_BOOKING, GET_BOOKINGS } from '../../graphql/queries';
import { GetBookingsResponse, BookingItem, CancelBookingInput, CancelBookingResponse } from '../../types/BookingTypes';

import '@aws-amplify/ui-react/styles.css';
import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';
import Stack from '@mui/material/Stack';

Amplify.configure(aws_exports);

function Appointments() {
  const { user, authStatus } = useAuthenticator((context) => [context.route]);
  const navigate = useNavigate();

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [bookings, setBookings] = React.useState<[BookingItem | undefined]>();
  const [isError, setError] = React.useState<boolean>(false);

  const getCustomerAppointments = async (customerId: string) => {
    //console.debug('[APPOINTMENTS] Getting appointments for', customerId);
    console.debug('[APPOINTMENTS] Getting appointments for', new Date().toISOString());

    setLoading(true);
    const result = await API.graphql<GraphQLQuery<GetBookingsResponse>>(
      graphqlOperation(GET_BOOKINGS, {
        customerId: customerId,
        datetime: new Date().toISOString(),
      })
    );

    setBookings(result.data?.getBookings?.items);

    setLoading(false);

    return result.data?.getBookings?.items;
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && user.attributes) {
      getCustomerAppointments(user.attributes.sub).then((resp) => {
        console.debug('[APPOINTMENTS] Found bookings', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  const cancelAppointment = async (booking: BookingItem) => {
    const input: CancelBookingInput = {
      bookingId: booking.pk,
      appointmentDetails: booking.appointmentDetails,
      envName: 'dev',
    };

    console.debug('[APPOINTMENTS] Cancel booking:', input);

    const result = await API.graphql<GraphQLQuery<CancelBookingResponse>>(graphqlOperation(CANCEL_BOOKING, { input: input }));

    console.debug('[APPOINTMENTS] Cancel booking result:', result);

    if (!result.errors) {
      navigate(0);
    } else {
      setError(true);
      // TODO display error
    }
  };

  function dismissError() {
    setError(false);
  }

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Upcoming Appointments:
      </Typography>

      {isError && (
        <Alert
          severity='error'
          onClose={() => {
            dismissError();
          }}
        >
          <AlertTitle>Error</AlertTitle>
          Could not cancel appointment. Please try again or contact the SPA.
        </Alert>
      )}

      {isLoading ? (
        <Loader variation='linear' />
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {bookings && bookings.length > 0 ? (
            bookings?.map((booking) => {
              if (!booking) return <></>;

              const { status } = booking.appointmentDetails;
              let heading = `${formateLocalLongDate(booking.sk)} at ${formatLocalTimeString(booking.sk, 0)}`;
              let chipColor = status === 'booked' ? '#1976D2' : status === 'cancelled' ? '#CD5C5C' : 'white';

              return (
                <React.Fragment key={booking.pk}>
                  <ListItem
                    alignItems='flex-start'
                    secondaryAction={
                      <Stack direction='row' spacing={1}>
                        <Chip
                          label={status}
                          variant={status === 'booked' ? 'filled' : 'outlined'}
                          sx={{ mb: 1, backgroundColor: chipColor, color: 'white' }}
                        />
                        {status === 'booked' && (
                          <Chip
                            label='cancel'
                            onClick={() => cancelAppointment(booking)}
                            onDelete={() => cancelAppointment(booking)}
                            sx={{ backgroundColor: '#FA5F55', color: 'white', mb: 1 }}
                            deleteIcon={<DeleteIcon />}
                          />
                        )}
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={heading}
                      secondary={
                        <React.Fragment>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'block' }}>
                            Type: {booking.appointmentDetails.category}
                          </Typography>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'block' }}>
                            Confirmation Id: {booking.pk.split('#')[1]}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component='li' />
                </React.Fragment>
              );
            })
          ) : (
            <Typography variant='body1' align='left' color='textPrimary'>
              No Upcoming Appointments
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}

export default Appointments;
