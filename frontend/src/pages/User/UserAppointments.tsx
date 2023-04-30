import React, { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery, GraphQLSubscription } from '@aws-amplify/api';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import aws_exports from '../../aws-exports';
import { CANCEL_BOOKING, GET_BOOKINGS, ON_CANCEL_BOOKING } from '../../graphql/queries';
import {
  GetBookingsResponse,
  BookingItem,
  CancelBookingInput,
  CancelBookingResponse,
  OnCancelBookingResponse,
} from '../../types/BookingTypes';

import '@aws-amplify/ui-react/styles.css';
import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';
import Stack from '@mui/material/Stack';

Amplify.configure(aws_exports);

function UserAppointments() {
  const { user, authStatus } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [bookings, setBookings] = React.useState<(BookingItem | undefined)[]>();
  const [selectedBooking, setSelectedBooking] = React.useState<BookingItem>();
  const [isError, setError] = React.useState<boolean>(false);
  const [open, setOpen] = React.useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getBookings = async (customerId: string) => {
    //console.debug('[USER APPOINTMENTS] Getting appointments for', customerId);
    console.debug('[USER APPOINTMENTS] Getting appointments for', new Date().toISOString());

    setLoading(true);
    const result = await API.graphql<GraphQLQuery<GetBookingsResponse>>(
      graphqlOperation(GET_BOOKINGS, {
        customerId: customerId,
        datetime: new Date().toISOString(),
      })
    );

    console.debug('[USER APPOINTMENTS] Found appointments', result);
    setBookings(result.data?.getBookings?.items);

    setLoading(false);

    return result.data?.getBookings?.items;
  };

  // Subscribe to creation of Todo
  useEffect(() => {
    const onCancelBookingListener = API.graphql<GraphQLSubscription<OnCancelBookingResponse>>(
      graphqlOperation(ON_CANCEL_BOOKING)
    ).subscribe({
      next: async ({ provider, value }: any) => {
        console.log('[USER APPOINTMENTS] Received subscription event', value);
        setOpen(false);

        // Update bookings with cancelled booking from GraphQL subscription without calling server
        let filteredBookings = bookings?.filter((b) => b?.pk !== value.data.onCancelBooking.pk);
        filteredBookings?.push(value.data.onCancelBooking);
        console.log('[USER APPOINTMENTS] Updated bookings:', filteredBookings);
        setBookings(filteredBookings);
      },
      error: (error: any) => setError(true),
    });

    return () => onCancelBookingListener.unsubscribe();
  }, [bookings]);

  useEffect(() => {
    if (authStatus === 'authenticated' && user.attributes) {
      getBookings(user.attributes.sub).then((resp) => {
        console.debug('[USER APPOINTMENTS] Found bookings', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  function dismissError() {
    setError(false);
  }

  const cancelAppointment = async (booking: BookingItem) => {
    const input: CancelBookingInput = {
      bookingId: booking.pk,
      appointmentDetails: booking.appointmentDetails,
      envName: aws_exports.env_name,
    };

    console.debug('[USER APPOINTMENTS] Cancel booking:', input);

    const result = await API.graphql<GraphQLQuery<CancelBookingResponse>>(graphqlOperation(CANCEL_BOOKING, { input: input }));

    console.debug('[USER APPOINTMENTS] Cancel booking result:', result);
  };

  const handleClickOpen = (booking: BookingItem) => {
    console.log(booking);
    setSelectedBooking(booking);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
                            onClick={() => handleClickOpen(booking)}
                            onDelete={() => handleClickOpen(booking)}
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
                    {selectedBooking && (
                      <Dialog fullScreen={fullScreen} open={open} onClose={handleClose} aria-labelledby='responsive-dialog-title'>
                        <DialogTitle id='responsive-dialog-title'>{'Cancel appointment?'}</DialogTitle>
                        <DialogContent>
                          <DialogContentText>
                            Are you sure you want to cancel your appointment on{' '}
                            {formateLocalLongDate(selectedBooking.appointmentDetails.sk)} at {formatLocalTimeString(selectedBooking.sk, 0)}?
                          </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                          <Button autoFocus onClick={handleClose}>
                            No
                          </Button>
                          <Button color='primary' onClick={() => cancelAppointment(selectedBooking)} autoFocus>
                            Yes
                          </Button>
                        </DialogActions>
                      </Dialog>
                    )}
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

export default UserAppointments;
