import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs, { Dayjs } from 'dayjs';

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from './AppointmentTypes';
import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';

function Schedule() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<[AppointmentItem | undefined]>();
  const [dateHeading, setDateHeading] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Dayjs | null>(dayjs());

  const getAppointments = async (date: string) => {
    setLoading(true);
    console.log('GETTING APPOINTMENTS FOR', date);
    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(
      graphqlOperation(GET_APPOINTMENTS, {
        date: date,
      })
    );

    setDateHeading(`${formateLocalLongDate(date + 'T06:00:00Z')}`);

    setAppointments(appointments.data?.getAppointments?.items);

    setLoading(false);

    return appointments.data?.getAppointments?.items;
  };

  function dateSelected(date: Dayjs | null) {
    setDate(date);
    const newDate = date ?? dayjs();
    getAppointments(newDate.toISOString().substring(0, 10));
  }

  useEffect(() => {
    if (user.attributes) {
      getAppointments(new Date().toISOString().slice(0, 10)).then((resp) => {
        console.log('Appointments ', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container spacing={{ md: 1, lg: 1 }} columns={{ md: 6, lg: 6 }}>
        <Grid md={2} lg={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar value={date} minDate={dayjs()} maxDate={dayjs().add(1, 'month')} onChange={(newDate) => dateSelected(newDate)} />
          </LocalizationProvider>
        </Grid>

        <Grid md={4} lg={4}>
          {isLoading ? (
            <Loader variation='linear' />
          ) : (
            <>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                Schedule for {dateHeading}:
              </Typography>
              <List sx={{ bgcolor: 'background.paper' }}>
                {(!appointments || appointments.length < 1) && <Typography>No Appointments Today 😄</Typography>}

                {appointments?.map((appt) => {
                  if (!appt) return <></>;

                  const heading = `${formatLocalTimeString(appt.sk, 0)} to ${formatLocalTimeString(appt.sk, appt.duration ?? 0)}`;

                  return (
                    <div key={appt.sk}>
                      <ListItem
                        alignItems='flex-start'
                        secondaryAction={
                          <Chip
                            label={appt?.status}
                            color={appt?.status === 'booked' ? 'primary' : 'success'}
                            variant={appt?.status === 'cancelled' ? 'outlined' : 'filled'}
                            sx={{ mb: 1 }}
                          />
                        }
                      >
                        <ListItemText
                          primary={heading}
                          secondary={
                            <React.Fragment>
                              {appt?.customerDetails ? (
                                <Stack>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                                    Customer:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails.name}
                                    </Typography>
                                  </Typography>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                                    Email:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails.email}
                                    </Typography>
                                  </Typography>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                                    Phone:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails.phone}
                                    </Typography>
                                  </Typography>
                                </Stack>
                              ) : (
                                <Stack>
                                  <Typography
                                    component='span'
                                    variant='body2'
                                    color='green'
                                    sx={{ fontStyle: 'italic', display: 'inline' }}
                                  >
                                    Appointment Available
                                  </Typography>
                                </Stack>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component='li' />
                    </div>
                  );
                })}
              </List>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Schedule;
