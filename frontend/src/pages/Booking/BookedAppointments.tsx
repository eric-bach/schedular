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
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import Switch, { SwitchProps } from '@mui/material/Switch';

import { GetUserBookingsResponse, BookingItem, CancelBookingInput, CancelBookingResponse, OnCancelBookingResponse } from '../../types/Types';
import { CANCEL_BOOKING, GET_USER_BOOKINGS, ON_CANCEL_BOOKING } from '../../graphql/queries';
import { formatLocalTimeString, formateLocalLongDate } from '../../helpers/utils';

import '@aws-amplify/ui-react/styles.css';

const IOSSwitch = styled((props: SwitchProps) => <Switch focusVisibleClassName='.Mui-focusVisible' disableRipple {...props} />)(({ theme }) => ({
  width: 42,
  height: 25,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#1976d2',
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 21,
  },
  '& .MuiSwitch-track': {
    borderRadius: 25 / 2,
    backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

function BookedAppointments(state: any) {
  const { customer } = state;

  const [isLoading, setLoading] = useState<boolean>(false);
  const [bookings, setBookings] = useState<(BookingItem | undefined)[]>();
  const [displayBookings, setDisplayBookings] = useState<(BookingItem | undefined)[]>();
  const [showCancelledBookings, setShowCancelledBookings] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem>();
  const [isError, setError] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getUserBookings = async (customerId: string) => {
    //console.debug('[BOOKINGS] Getting appointments for', new Date().toISOString());

    try {
      setLoading(true);
      const result = await API.graphql<GraphQLQuery<GetUserBookingsResponse>>(
        graphqlOperation(GET_USER_BOOKINGS, {
          customerId: customerId,
          datetime: new Date().toISOString(),
        })
      );

      console.debug('[BOOKINGS] Found bookings', result);
      setBookings(result.data?.getUserBookings?.items);
      setDisplayBookings(
        showCancelledBookings
          ? result.data?.getUserBookings?.items
          : result.data?.getUserBookings?.items.filter((b) => b.appointmentDetails.status !== 'cancelled')
      );
      setLoading(false);

      return result.data?.getUserBookings?.items;
    } catch (error) {
      console.error('[BOOKINGS] Error', error);
      setLoading(false);
    }
  };

  // Subscribe to creation of Todo
  useEffect(() => {
    const onCancelBookingListener = API.graphql<GraphQLSubscription<OnCancelBookingResponse>>(graphqlOperation(ON_CANCEL_BOOKING)).subscribe({
      next: async ({ provider, value }: any) => {
        console.log('[BOOKINGS] Received subscription event', value);
        setOpen(false);

        // Update bookings with cancelled booking from GraphQL subscription without calling server
        let filteredBookings = bookings?.filter((b) => b?.pk !== value.data.onCancelBooking.pk);
        filteredBookings?.push(value.data.onCancelBooking);
        console.log('[BOOKINGS] Updated bookings:', filteredBookings);
        setBookings(filteredBookings);
        setDisplayBookings(showCancelledBookings ? filteredBookings : filteredBookings?.filter((b) => b?.appointmentDetails.status !== 'cancelled'));
      },
      error: (error: any) => setError(true),
    });

    return () => onCancelBookingListener.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  useEffect(() => {
    getUserBookings(customer.id).then((resp) => {
      //console.debug('[BOOKINGS] Found bookings', resp);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleToggle = () => {
    setDisplayBookings(!showCancelledBookings ? bookings : bookings?.filter((b) => b?.appointmentDetails.status !== 'cancelled'));
    setShowCancelledBookings(!showCancelledBookings);
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
          Could not cancel appointment. Please try again or contact us.
        </Alert>
      )}

      {isLoading && <Loader variation='linear' filledColor='#1976d2' />}

      {!isLoading && (!displayBookings || displayBookings.length < 1) && (
        <Typography variant='body1' align='left' color='textPrimary'>
          No Upcoming Appointments
        </Typography>
      )}

      {!isLoading && displayBookings && displayBookings.length > 0 && (
        <List sx={{ bgcolor: 'background.paper' }}>
          <FormGroup>
            <FormControlLabel
              control={<IOSSwitch sx={{ ml: 3.5, mr: 1, mb: 0.5 }} defaultChecked onChange={() => handleToggle()} />}
              label='Show cancelled bookings'
            />
          </FormGroup>
          {displayBookings?.map((booking) => {
            if (!booking) return <></>;

            const { status } = booking.appointmentDetails;
            let heading = `${formateLocalLongDate(booking.sk)} at ${formatLocalTimeString(booking.sk, 0)}`;

            return (
              <React.Fragment key={booking.pk}>
                <ListItem
                  alignItems='flex-start'
                  secondaryAction={
                    <Stack direction='row' spacing={1}>
                      {status === 'cancelled' && <Chip label='cancelled' sx={{ mb: 1, backgroundColor: 'red', color: 'white' }} />}
                      {status === 'booked' && (
                        <Chip
                          label='cancel'
                          onClick={() => handleClickOpen(booking)}
                          onDelete={() => handleClickOpen(booking)}
                          sx={{ backgroundColor: '#1976D2', color: 'white', mb: 1 }}
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
                        <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                          Status:{' '}
                        </Typography>
                        <Typography component='span' variant='button' sx={{ color: status === 'booked' ? 'green' : 'red', display: 'inline' }}>
                          {status}
                        </Typography>
                        <Typography sx={{ display: 'block' }} />
                        <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                          Duration:{' '}
                        </Typography>
                        {booking.appointmentDetails.duration}
                        <Typography sx={{ display: 'block' }} />
                        <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                          Therapist:{' '}
                        </Typography>
                        {booking.administratorDetails.firstName} {booking.administratorDetails.lastName}
                      </React.Fragment>
                    }
                  />
                  {selectedBooking && (
                    <Dialog fullScreen={fullScreen} open={open} onClose={handleClose} aria-labelledby='responsive-dialog-title'>
                      <DialogTitle id='responsive-dialog-title'>{'Cancel appointment?'}</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          Are you sure you want to cancel your appointment on {formateLocalLongDate(selectedBooking.appointmentDetails.sk)} at{' '}
                          {formatLocalTimeString(selectedBooking.sk, 0)}?
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
          })}
        </List>
      )}
    </React.Fragment>
  );
}

export default BookedAppointments;
