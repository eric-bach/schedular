import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Container, Chip, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';

import ServerDay, { HighlightedDay } from '../../components/ServerDay';
import { GET_APPOINTMENTS, GET_APPOINTMENTS_COUNTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem, GetAppointmentsCountsResponse } from '../../types/Types';
import { formatLongDateString, formatLocalTimeString, formatLocalDateString } from '../../helpers/utils';

function ManageBookings() {
  const { authStatus } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<AppointmentItem[]>([]);
  const [highlightedDays, setHighlightedDays] = React.useState<HighlightedDay[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());

  const getAppointments = async (d: Dayjs) => {
    let from = dayjs(d).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    let to = dayjs(d.add(1, 'day')).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    //console.debug(`[MANGE BOOKINGS] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointments(appointments.data?.getAppointments?.items ?? []);

    setLoading(false);

    return appointments.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs | null) {
    setSelectedDate(d);
    await getAppointments(d ?? dayjs());

    //console.debug('[MANGE BOOKINGS] Found appointments', appointments);
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const d = dayjs();
      setSelectedDate(d);

      getAppointments(d).then((resp) => {
        //console.debug('[MANGE BOOKINGS] Loaded initial appointments', resp);
      });
    } else {
      // TODO Return error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHighlightedDays(selectedDate ?? dayjs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHighlightedDays = async (date: Dayjs) => {
    // Convert sk to local date range for entire month
    const from = formatLocalDateString(date);
    const to = formatLocalDateString(date.add(1, 'month'));

    const result = await API.graphql<GraphQLQuery<GetAppointmentsCountsResponse>>(graphqlOperation(GET_APPOINTMENTS_COUNTS, { from, to, status: 'booked' }));
    // console.debug('[MANAGE BOOKINGS] Get Appointment Counts', result);
    const datesWithAppointments = result.data?.getAppointmentCounts;
    // console.debug('[MANAGE BOOKINGS] Found dates with appointments', datesWithAppointments);

    let daysToHighlight: HighlightedDay[] = [];
    datesWithAppointments?.forEach((x) => {
      daysToHighlight.push({ day: new Date(x.date).getDate() + 1, count: x.count });
    });
    //console.debug('[MANAGE BOOKINGS] Days with appointments', daysToHighlight);

    setHighlightedDays(daysToHighlight);
    setLoading(false);
  };

  const handleMonthChange = async (date: Dayjs) => {
    setLoading(true);
    setHighlightedDays([]);

    await fetchHighlightedDays(date);
  };

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container justifyContent='center' columns={12}>
        <Grid xs={12} lg={4}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedDate}
              minDate={dayjs()}
              maxDate={dayjs().add(3, 'month')}
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

        <Grid xs={10} lg={5}>
          {isLoading && <Loader variation='linear' filledColor='#1976d2' />}
          {!isLoading && (
            <React.Fragment>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 1 }}>
                Schedule for {formatLongDateString(dayjs(selectedDate))}
              </Typography>
              <List sx={{ bgcolor: 'background.paper' }}>
                {(!appointments || appointments.length < 1) && <Typography>No Appointments Today 😄</Typography>}

                {appointments?.map((appt) => {
                  const heading = `${formatLocalTimeString(appt.sk, 0)} to ${formatLocalTimeString(appt.sk, appt.duration ?? 0)}`;

                  return (
                    <React.Fragment key={appt.pk}>
                      <ListItem
                        alignItems='flex-start'
                        secondaryAction={
                          <Chip
                            label={appt?.status}
                            color={appt?.status === 'booked' ? 'success' : 'primary'}
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
            </React.Fragment>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default ManageBookings;
