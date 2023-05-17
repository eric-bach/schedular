import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Container, Chip, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from '../../types/BookingTypes';
import { formatLongDateString, formatLocalTimeString } from '../../helpers/utils';

function ManageBookings() {
  const { authStatus } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<AppointmentItem[]>([]);
  const [date, setDate] = React.useState<Dayjs | null>(dayjs());

  const getAppointments = async (d: Dayjs) => {
    let from = dayjs(d).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    let to = dayjs(d.add(1, 'day')).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();

    console.debug(`[APPOINTMENTS] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointments(appointments.data?.getAppointments?.items ?? []);

    setLoading(false);

    return appointments.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs | null) {
    setDate(d);
    await getAppointments(d ?? dayjs());

    console.debug('[APPOINTMENTS] Found appointments', appointments);
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const d = dayjs();
      setDate(d);

      getAppointments(d).then((resp) => {
        //console.debug('[APPOINTMENTS] Loaded initial appointments', resp);
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
            <DateCalendar value={date} minDate={dayjs()} maxDate={dayjs().add(1, 'month')} onChange={(newValue) => dateSelected(newValue)} />
          </LocalizationProvider>
        </Grid>

        <Grid md={4} lg={4}>
          {isLoading ? (
            <Loader variation='linear' />
          ) : (
            <>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                {/* Schedule for {dateHeading}: */}
                Schedule for {formatLongDateString(dayjs(date))}
              </Typography>
              <List sx={{ bgcolor: 'background.paper' }}>
                {(!appointments || appointments.length < 1) && <Typography>No Appointments Today 😄</Typography>}

                {appointments?.map((appt) => {
                  if (!appt) return <></>;

                  const heading = `${formatLocalTimeString(appt.sk, 0)} to ${formatLocalTimeString(appt.sk, appt.duration ?? 0)}`;

                  return (
                    <React.Fragment key={appt.pk}>
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
                              {appt?.bookingId ? (
                                <React.Fragment>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'block' }}>
                                    Customer:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails?.firstName} {appt?.customerDetails?.lastName}
                                    </Typography>
                                  </Typography>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'block' }}>
                                    Email:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails?.email}
                                    </Typography>
                                  </Typography>
                                  <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'block' }}>
                                    Phone:{' '}
                                    <Typography component='span' variant='body2'>
                                      {appt?.customerDetails?.phone}
                                    </Typography>
                                  </Typography>
                                </React.Fragment>
                              ) : (
                                <Typography component='span' variant='body2' color='green' sx={{ fontStyle: 'italic', display: 'block' }}>
                                  Appointment Available
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component='li' />
                    </React.Fragment>
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

export default ManageBookings;
