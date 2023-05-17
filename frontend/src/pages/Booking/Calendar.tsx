import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Alert, AlertTitle, Box, Button, Card, CardActions, CardContent, CardMedia, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import { GET_AVAILABLE_APPOINTMENTS, CREATE_BOOKING } from '../../graphql/queries';
import {
  GetAvailableAppointmentsResponse,
  AvailableAppointmentItem,
  CreateBookingResponse,
  CreateBookingInput,
} from '../../types/BookingTypes';
import { formatLocalTimeSpanString, formatLocalTimeString, formatLongDateString } from '../../helpers/utils';

import aws_exports from '../../aws-exports';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Calendar() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [appointments, setAppointments] = React.useState<[AvailableAppointmentItem | undefined]>();
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());
  const [selectedAppointment, setSelectedAppointment] = React.useState<AvailableAppointmentItem>();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [isError, setError] = React.useState<boolean>(false);

  const navigate = useNavigate();

  const getAppointments = async (date: Dayjs) => {
    let fromDate = dayjs(date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).valueOf();
    let from = new Date(Math.max(new Date().getTime(), fromDate)).toISOString();
    let to = dayjs(date.add(1, 'day')).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    console.debug(`[BOOKING] Getting schedule from ${from} to ${to}`);

    try {
      setLoading(true);
      const appointments = await API.graphql<GraphQLQuery<GetAvailableAppointmentsResponse>>(
        graphqlOperation(GET_AVAILABLE_APPOINTMENTS, { from, to })
      );
      setAppointments(appointments.data?.getAvailableAppointments?.items);
      setLoading(false);

      return appointments.data?.getAvailableAppointments?.items;
    } catch (error) {
      console.error('[BOOKING] Error', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getAppointments(selectedDate ?? dayjs());
  }, []);

  async function dateSelected(date: Dayjs | null) {
    // Reset timeslot
    setSelectedAppointment(undefined);
    setError(false);
    setSelectedDate(date);

    await getAppointments(date ?? dayjs());
    console.debug('[BOOKING] Available appointments', appointments);
  }

  function appointmentSelected(appointment: AvailableAppointmentItem) {
    console.debug('[BOOKING] Selected appointment', appointment);
    setSelectedAppointment(appointment);
  }

  async function bookAppointment() {
    if (!selectedAppointment || !selectedAppointment.sk) {
      setError(true);
      return;
    }

    const input: CreateBookingInput = {
      pk: selectedAppointment.pk,
      sk: selectedAppointment.sk,
      customer: {
        id: user.attributes?.sub,
        firstName: user.attributes?.given_name,
        lastName: user.attributes?.family_name,
        email: user.attributes?.email,
        phone: user.attributes?.phone_number,
      },
      administratorDetails: {
        id: selectedAppointment.administratorDetails.id,
        firstName: selectedAppointment.administratorDetails.firstName,
        lastName: selectedAppointment.administratorDetails.lastName,
      },
      appointmentDetails: {
        type: selectedAppointment.type,
        category: selectedAppointment.category,
        duration: selectedAppointment.duration,
      },
    };

    console.debug('[BOOKING] Booking input', input);
    const result = await API.graphql<GraphQLQuery<CreateBookingResponse>>(graphqlOperation(CREATE_BOOKING, { input: input }));
    console.debug('[BOOKING] Booking result', result.data?.createBooking);

    if (result.data?.createBooking.appointmentDetails.status === 'booked') {
      navigate(`/confirmation/${result.data.createBooking.pk.slice(8)}`, {
        state: { customer: user.attributes, appointment: selectedAppointment },
      });
    } else {
      await dateSelected(selectedDate);
      setError(true);
    }
  }

  function dismissError() {
    setError(false);
  }

  return (
    <Box sx={{ flexGrow: 1, mt: 5 }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3, md: 3, lg: 3 }}
        columns={{ xs: 4, sm: 8, md: 12, lg: 12 }}
        // sx={{
        //   '--Grid-borderWidth': '1px',
        //   borderTop: 'var(--Grid-borderWidth) solid',
        //   borderLeft: 'var(--Grid-borderWidth) solid',
        //   borderColor: 'divider',
        //   '& > div': {
        //     borderRight: 'var(--Grid-borderWidth) solid',
        //     borderBottom: 'var(--Grid-borderWidth) solid',
        //     borderColor: 'divider',
        //   },
        // }}
      >
        <Grid xs={0} sm={0} md={3} />
        <Grid xs={12} sm={12} md={6}>
          {isError && (
            <Alert
              severity='error'
              onClose={() => {
                dismissError();
              }}
            >
              <AlertTitle>Error</AlertTitle>
              Could not book appointment, the time may no longer be available. Please try again.
            </Alert>
          )}
        </Grid>
        <Grid xs={0} sm={0} md={3} />

        <Grid xs={0} sm={0} md={0} lg={3} />
        <Grid xs={6} sm={6} md={6} lg={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedDate}
              minDate={dayjs()}
              maxDate={dayjs().add(1, 'month')}
              onChange={(newValue) => dateSelected(newValue)}
            />
          </LocalizationProvider>
        </Grid>
        <Grid xs={6} sm={6} md={6} lg={3}>
          {isLoading && <Loader size='large' />}
          {selectedDate && !isLoading && (
            <>
              <Stack spacing={2} alignItems='flex-start'>
                <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                  Available Times:
                </Typography>
                {(!appointments || appointments.length < 1) && <Typography>No times available today 😢</Typography>}

                {appointments?.map((m) => {
                  if (!m) return <></>;

                  return (
                    <Button
                      key={m.sk}
                      variant='contained'
                      sx={{ width: '174px' }}
                      onClick={() => {
                        appointmentSelected(m);
                      }}
                      id={m.sk}
                    >
                      {formatLocalTimeSpanString(m.sk, m.duration)}
                    </Button>
                  );
                })}
              </Stack>

              {selectedAppointment && (
                <Card sx={{ maxWidth: 345, mt: 3, ml: -2, border: 'none' }} raised={true} variant='outlined'>
                  <CardContent>
                    <Typography gutterBottom variant='h5' component='div'>
                      Confirm Appointment
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {formatLongDateString(selectedDate)} at {formatLocalTimeString(selectedAppointment.sk, 0)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      with {selectedAppointment.administratorDetails.firstName} {selectedAppointment.administratorDetails.lastName}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button variant='contained' color='success' onClick={bookAppointment} sx={{ ml: 0.5 }}>
                      Confirm Appointment
                    </Button>
                  </CardActions>
                </Card>
              )}
            </>
          )}
        </Grid>
        <Grid xs={0} sm={0} md={0} lg={3} />
      </Grid>
    </Box>
  );
}

export default Calendar;
