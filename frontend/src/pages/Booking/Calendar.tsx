import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Alert, AlertTitle, Box, Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import ServerDay, { HighlightedDay } from '../../components/ServerDay';
import { GET_AVAILABLE_APPOINTMENTS, CREATE_BOOKING, GET_APPOINTMENTS_COUNTS } from '../../graphql/queries';
import {
  GetAvailableAppointmentsResponse,
  AvailableAppointmentItem,
  CreateBookingResponse,
  CreateBookingInput,
  GetAppointmentsCountsResponse,
} from '../../types/Types';

import { formatLocalTimeSpanString, formatLocalTimeString, formatLongDateString, formatLocalDateString } from '../../helpers/utils';

import aws_exports from '../../aws-exports';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Calendar() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [appointments, setAppointments] = React.useState<[AvailableAppointmentItem | undefined]>();
  const [highlightedDays, setHighlightedDays] = React.useState<HighlightedDay[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());
  const [selectedAppointment, setSelectedAppointment] = React.useState<AvailableAppointmentItem>();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [isError, setError] = React.useState<boolean>(false);

  const navigate = useNavigate();

  const getAppointments = async (date: Dayjs) => {
    let fromDate = dayjs(date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).valueOf();
    let from = new Date(Math.max(new Date().getTime(), fromDate)).toISOString();
    let to = dayjs(date.add(1, 'day')).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    //console.debug(`[CALENDAR] Getting schedule from ${from} to ${to}`);

    try {
      setLoading(true);
      const appointments = await API.graphql<GraphQLQuery<GetAvailableAppointmentsResponse>>(graphqlOperation(GET_AVAILABLE_APPOINTMENTS, { from, to }));
      setAppointments(appointments.data?.getAvailableAppointments?.items);
      setLoading(false);

      return appointments.data?.getAvailableAppointments?.items;
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getAppointments(selectedDate ?? dayjs());
  }, [selectedDate]);

  useEffect(() => {
    fetchHighlightedDays(selectedDate ?? dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function dateSelected(date: Dayjs | null) {
    // Reset timeslot
    setSelectedAppointment(undefined);
    setError(false);
    setSelectedDate(date);

    await getAppointments(date ?? dayjs());
    //console.debug('[CALENDAR] Available appointments', appointments);
  }

  function appointmentSelected(appointment: AvailableAppointmentItem) {
    //console.debug('[CALENDAR] Selected appointment', appointment);
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
        id: user.attributes?.sub!,
        firstName: user.attributes?.given_name!,
        lastName: user.attributes?.family_name!,
        email: user.attributes?.email!,
        phone: user.attributes?.phone_number!,
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

    const result = await API.graphql<GraphQLQuery<CreateBookingResponse>>(graphqlOperation(CREATE_BOOKING, { input: input }));
    //console.debug('[CALENDAR] Booking result', result.data?.createBooking);

    if (result.data?.createBooking.appointmentDetails.status === 'booked') {
      navigate(`/confirmation/${result.data.createBooking.pk.slice(8)}`, {
        state: { customer: user.attributes, appointment: selectedAppointment },
      });
    } else {
      await dateSelected(selectedDate);
      setError(true);
    }
  }

  const fetchHighlightedDays = async (date: Dayjs) => {
    // Convert sk to local date range for entire month
    const from = formatLocalDateString(date);
    const to = formatLocalDateString(date.add(1, 'month'));

    const result = await API.graphql<GraphQLQuery<GetAppointmentsCountsResponse>>(graphqlOperation(GET_APPOINTMENTS_COUNTS, { from, to, status: 'available' }));
    const datesWithAppointments = result.data?.getAppointmentCounts;
    // console.debug('[CALENDAR] Found dates with appointments', datesWithAppointments);

    let daysToHighlight: HighlightedDay[] = [];
    datesWithAppointments?.forEach((x) => {
      daysToHighlight.push({ day: new Date(x.date).getDate() + 1, count: x.count });
    });
    console.debug('[CALENDAR] Days with appointments', daysToHighlight);

    setHighlightedDays(daysToHighlight);
    setLoading(false);
  };

  const handleMonthChange = async (date: Dayjs) => {
    setLoading(true);
    setHighlightedDays([]);

    await fetchHighlightedDays(date);
  };

  function dismissError() {
    setError(false);
  }

  return (
    <Box sx={{ mt: 5 }}>
      <Grid
        container
        justifyContent='center'
        columns={12}
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
        {isError && (
          <Grid xs={2}>
            <Alert
              severity='error'
              onClose={() => {
                dismissError();
              }}
            >
              <AlertTitle>Error</AlertTitle>
              Could not book appointment, the time may no longer be available. Please try again.
            </Alert>
          </Grid>
        )}
        <Grid xs={12} lg={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedDate}
              minDate={dayjs()}
              maxDate={dayjs().add(1, 'month')}
              onChange={(newValue) => dateSelected(newValue)}
              onMonthChange={handleMonthChange}
              renderLoading={() => <DayCalendarSkeleton />}
              slots={{
                day: ServerDay,
              }}
              slotProps={{
                day: {
                  highlightedDays,
                } as any,
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid xs={8} lg={3}>
          {isLoading && <Loader variation='linear' filledColor='#1976d2' style={{ marginTop: 5 }} />}
          {selectedDate && !isLoading && (
            <React.Fragment>
              <Stack spacing={1.5} alignItems='flex-start'>
                <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 1 }}>
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
                <Card sx={{ mt: 2, ml: -2, border: 'none' }} variant='outlined'>
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
                    <Button variant='contained' color='success' onClick={bookAppointment} sx={{ ml: 0.5, mt: -2 }}>
                      Confirm Appointment
                    </Button>
                  </CardActions>
                </Card>
              )}
            </React.Fragment>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Calendar;
