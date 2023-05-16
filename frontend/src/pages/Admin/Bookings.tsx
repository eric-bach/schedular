import React, { useEffect, useState } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery, GraphQLSubscription } from '@aws-amplify/api';
import { Loader } from '@aws-amplify/ui-react';
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  GetBookingsResponse,
  BookingItem,
  CancelBookingInput,
  CancelBookingResponse,
  OnCancelBookingResponse,
} from '../../types/BookingTypes';
import { CANCEL_BOOKING, GET_BOOKINGS, ON_CANCEL_BOOKING } from '../../graphql/queries';
import { formatLocalTimeString, formateLocalLongDate } from '../../helpers/utils';

import '@aws-amplify/ui-react/styles.css';

function Bookings(state: any) {
  const { customer } = state;

  const [isLoading, setLoading] = useState<boolean>(false);
  const [bookings, setBookings] = useState<(BookingItem | undefined)[]>();
  const [selectedBooking, setSelectedBooking] = useState<BookingItem>();
  const [isError, setError] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getBookings = async (customerId: string) => {
    //console.debug('[BOOKINGS] Getting appointments for', new Date().toISOString());

    try {
      setLoading(true);
      const result = await API.graphql<GraphQLQuery<GetBookingsResponse>>(
        graphqlOperation(GET_BOOKINGS, {
          customerId: customerId,
          datetime: new Date().toISOString(),
        })
      );

      console.debug('[BOOKINGS] Found bookings', result);
      setBookings(result.data?.getBookings?.items);
      setLoading(false);

      return result.data?.getBookings?.items;
    } catch (error) {
      console.error('[BOOKINGS] Error', error);
      setLoading(false);
    }
  };

  // Subscribe to creation of Todo
  useEffect(() => {
    const onCancelBookingListener = API.graphql<GraphQLSubscription<OnCancelBookingResponse>>(
      graphqlOperation(ON_CANCEL_BOOKING)
    ).subscribe({
      next: async ({ provider, value }: any) => {
        console.log('[BOOKINGS] Received subscription event', value);
        setOpen(false);

        // Update bookings with cancelled booking from GraphQL subscription without calling server
        let filteredBookings = bookings?.filter((b) => b?.pk !== value.data.onCancelBooking.pk);
        filteredBookings?.push(value.data.onCancelBooking);
        console.log('[BOOKINGS] Updated bookings:', filteredBookings);
        setBookings(filteredBookings);
      },
      error: (error: any) => setError(true),
    });

    return () => onCancelBookingListener.unsubscribe();
  }, [bookings]);

  useEffect(() => {
    getBookings(customer.id).then((resp) => {
      //console.debug('[BOOKINGS] Found bookings', resp);
    });
  }, []);

  function dismissError() {
    setError(false);
  }

  const cancelAppointment = async (booking: BookingItem) => {
    const input: CancelBookingInput = {
      bookingId: booking.pk,
      appointmentDetails: booking.appointmentDetails,
    };

    console.debug('[BOOKINGS] Cancel booking:', input);
    const result = await API.graphql<GraphQLQuery<CancelBookingResponse>>(graphqlOperation(CANCEL_BOOKING, { input: input }));
    console.debug('[BOOKINGS] Cancel booking result:', result);
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
    <React.Fragment>
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
                            Therapist: {booking.administratorDetails.firstName} {booking.administratorDetails.lastName}
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
    </React.Fragment>
  );
}

export default Bookings;
