import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';

import dayjs, { Dayjs } from 'dayjs';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import aws_exports from '../../aws-exports';
import { GET_AVAILABLE_APPOINTMENTS, CREATE_BOOKING } from '../../graphql/queries';
import {
  GetAvailableAppointmentsResponse,
  AvailableAppointmentItem,
  CreateBookingResponse,
  CreateBookingInput,
} from '../../types/BookingTypes';
import { formatLocalTimeSpanString, formatLongDateString } from '../../helpers/utils';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Booking() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [date, setDate] = React.useState<Dayjs | null>(dayjs());
  const [availableAppointments, setAvailableAppointments] = React.useState<[AvailableAppointmentItem | undefined]>();
  const [appointment, setAppointment] = React.useState<AvailableAppointmentItem>();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [isError, setError] = React.useState<boolean>(false);

  const navigate = useNavigate();

  const getAppointments = async (date: Dayjs) => {
    let fromDate = dayjs(date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).valueOf();
    let from = new Date(Math.max(new Date().getTime(), fromDate)).toISOString();
    let to = dayjs(date.add(1, 'day')).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    console.debug(`[BOOKING] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const appointments = await API.graphql<GraphQLQuery<GetAvailableAppointmentsResponse>>(
      graphqlOperation(GET_AVAILABLE_APPOINTMENTS, { from, to })
    );
    setAvailableAppointments(appointments.data?.getAvailableAppointments?.items);

    setLoading(false);

    return appointments.data?.getAvailableAppointments?.items;
  };

  useEffect(() => {
    getAppointments(date ?? dayjs());
  }, []);

  async function dateSelected(date: Dayjs | null) {
    // Reset timeslot
    setAppointment(undefined);
    setError(false);
    setDate(date);

    await getAppointments(date ?? dayjs());
    console.debug('[BOOKING] Available appointments', availableAppointments);
  }

  function appointmentSelected(appointment: AvailableAppointmentItem) {
    console.debug('[BOOKING] Selected appointment', appointment);
    setAppointment(appointment);
  }

  async function bookAppointment() {
    if (!appointment || !appointment.sk) {
      setError(true);
      return;
    }

    const input: CreateBookingInput = {
      pk: appointment.pk,
      sk: appointment.sk,
      customer: {
        id: user.attributes?.sub,
        firstName: user.attributes?.given_name,
        lastName: user.attributes?.family_name,
        email: user.attributes?.email,
        phone: user.attributes?.phone_number,
      },
      administratorDetails: {
        id: appointment.administratorDetails.id,
        firstName: appointment.administratorDetails.firstName,
        lastName: appointment.administratorDetails.lastName,
      },
      appointmentDetails: {
        type: appointment.type,
        category: appointment.category,
        duration: appointment.duration,
      },
      envName: aws_exports.env_name,
    };

    console.debug('[BOOKING] Booking input', input);
    const result = await API.graphql<GraphQLQuery<CreateBookingResponse>>(graphqlOperation(CREATE_BOOKING, { input: input }));
    console.debug('[BOOKING] Booking result', result.data?.createBooking);

    if (result.data?.createBooking.appointmentDetails.status === 'booked') {
      navigate(`/confirmation/${result.data.createBooking.pk.slice(8)}`, {
        state: { customer: user.attributes, appointment: appointment },
      });
    } else {
      await dateSelected(date);
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
              value={date}
              minDate={dayjs()}
              maxDate={dayjs().add(1, 'month')}
              onChange={(newValue) => dateSelected(newValue)}
            />
          </LocalizationProvider>
        </Grid>
        <Grid xs={6} sm={6} md={6} lg={3}>
          {isLoading && <Loader size='large' />}
          {date && !isLoading && (
            <>
              <Stack spacing={2} alignItems='flex-start'>
                <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                  Available Times:
                </Typography>
                {(!availableAppointments || availableAppointments.length < 1) && <Typography>No times available today 😢</Typography>}

                {availableAppointments?.map((m) => {
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

              {appointment && (
                <>
                  <Stack alignItems='flex-start'>
                    <Typography sx={{ mt: 4 }}>
                      {formatLongDateString(date)} with {appointment.administratorDetails.firstName}{' '}
                      {appointment.administratorDetails.lastName} from {formatLocalTimeSpanString(appointment.sk, appointment.duration)}
                    </Typography>
                    <Button variant='contained' color='success' onClick={bookAppointment}>
                      Confirm Appointment
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </Grid>
        <Grid xs={0} sm={0} md={0} lg={3} />
      </Grid>
    </Box>
  );
}

export default Booking;
