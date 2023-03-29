import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
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
import Loading from '../../components/Loading';
import { GET_APPOINTMENTS, BOOK_APPOINTMENT } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem, AppointmentBookingResponse } from './Types';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

function Booking() {
  const [date, setDate] = React.useState<Dayjs | null>(null);
  const [timeslot, setTimeslot] = React.useState<string | null>(null);
  const [timeslotText, setTimeslotText] = React.useState<string | null>(null);
  const [availableAppts, setAppts] = React.useState<[AppointmentItem | undefined]>();
  const [numAppts, setNumAppts] = React.useState<number>(0);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [isError, setError] = React.useState<boolean>(false);

  const navigate = useNavigate();
  const today = dayjs();
  const oneMonth = dayjs().add(1, 'month');

  const getAppointments = async (date: Dayjs | null) => {
    setLoading(true);
    console.log('GETTING APPOINTMENTS FOR ', dayjs(date).format('YYYY-MM-DD'));
    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(
      graphqlOperation(GET_APPOINTMENTS, {
        date: dayjs(date).format('YYYY-MM-DD'),
      })
    );
    console.log('FOUND APPOINTMENTS: ', appointments);

    console.log(appointments.data?.getAvailableAppointments?.items);
    setAppts(appointments.data?.getAvailableAppointments?.items);
    setNumAppts(appointments.data?.getAvailableAppointments?.items.length ?? 0);

    setLoading(false);

    return appointments.data?.getAvailableAppointments?.items;
  };

  useEffect(() => {
    Auth.currentAuthenticatedUser().then((user) => {
      console.log('Authenticated User: ', user);
      console.log('Authenticated User Attributes: ', user.attributes);
      setCustomer({
        id: user.attributes.sub,
        name: user.attributes.given_name,
        email: user.attributes.email,
        phone: user.attributes.phone_number,
      });
    });
  }, []);

  async function dateSelected(date: Dayjs | null) {
    // Reset timeslow
    setTimeslot(null);
    setTimeslotText(null);
    setError(false);

    setDate(date);
    let appts = await getAppointments(date);
    console.log('AVAILABLE APPOINTMENTS: ', appts);
  }

  function timeSelected(target: any) {
    console.log('Selected sk: ', target.id);
    console.log('Selected Time: ', target.textContent);
    setTimeslot(target.id);
    setTimeslotText(target.textContent);
  }

  async function bookAppointment() {
    console.log('Booking time: ', timeslot);

    const input = {
      pk: 'appt',
      sk: timeslot,
      customer: {
        id: customer?.id,
        name: customer?.name,
        email: customer?.email,
        phone: customer?.phone,
      },
    };

    const result = await API.graphql<GraphQLQuery<AppointmentBookingResponse>>(graphqlOperation(BOOK_APPOINTMENT, { input: input }));

    console.log('Booked: ', result.data?.bookAppointment);

    if (result.data?.bookAppointment.confirmationId) {
      navigate(`/confirmation/${result.data.bookAppointment.confirmationId}`, { state: { customer: customer, timeslot: timeslot } });
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
        sx={{
          '--Grid-borderWidth': '1px',
          borderTop: 'var(--Grid-borderWidth) solid',
          borderLeft: 'var(--Grid-borderWidth) solid',
          borderColor: 'divider',
          '& > div': {
            borderRight: 'var(--Grid-borderWidth) solid',
            borderBottom: 'var(--Grid-borderWidth) solid',
            borderColor: 'divider',
          },
        }}
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
            <DateCalendar value={date} minDate={today} maxDate={oneMonth} onChange={(newValue) => dateSelected(newValue)} />
          </LocalizationProvider>
        </Grid>
        <Grid xs={6} sm={6} md={6} lg={3}>
          {isLoading && <Loading />}
          {date && !isLoading && (
            <>
              <Stack spacing={2} alignItems='flex-start'>
                <Typography variant='subtitle1' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                  Available Times:
                </Typography>
                {numAppts < 1 && <Typography>No times available today 😢</Typography>}
                {availableAppts?.map((m) => {
                  return (
                    <Button
                      key={m?.sk}
                      variant='contained'
                      sx={{ width: '174px' }}
                      onClick={(e) => {
                        timeSelected(e.target);
                      }}
                      id={m?.sk}
                    >
                      {m?.sk.substring(11, 16)} ({m?.duration} mins)
                    </Button>
                  );
                })}
              </Stack>

              {timeslotText && (
                <>
                  <Stack alignItems='flex-start'>
                    <Typography sx={{ mt: 4 }}>
                      {dayjs(date).format('MMM DD, YYYY')} from {timeslotText.toString()}
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

export default withAuthenticator(Booking, {
  signUpAttributes: ['phone_number', 'given_name', 'family_name'],
  formFields: {
    signUp: {
      given_name: {
        label: 'First Name:',
        placeholder: 'Enter your first name',
        order: 1,
      },
      family_name: {
        label: 'Last Name:',
        placeholder: 'Enter your last name',
        order: 2,
      },
      phone_number: {
        order: 3,
      },
      username: {
        label: 'Email:',
        placeholder: 'Enter your email',

        order: 4,
      },
      password: {
        order: 5,
      },
      confirm_password: {
        order: 6,
      },
    },
  },
});
