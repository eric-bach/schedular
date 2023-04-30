import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { styled } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import Grid from '@mui/material/Unstable_Grid2';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from '../../types/BookingTypes';
import { formatLongDateString } from '../../helpers/utils';
import { Chip, TextField } from '@mui/material';

dayjs.extend(isBetweenPlugin);

interface CustomPickerDayProps extends PickersDayProps<Dayjs> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})<CustomPickerDayProps>(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(isLastDay && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
})) as React.ComponentType<CustomPickerDayProps>;

function Day(props: PickersDayProps<Dayjs> & { selectedDay?: Dayjs | null }) {
  const { day, selectedDay, ...other } = props;

  if (selectedDay == null) {
    return <PickersDay day={day} {...other} />;
  }

  const start = selectedDay.startOf('week');
  const end = selectedDay.endOf('week');

  const dayIsBetween = day.isBetween(start, end, null, '[]');
  const isFirstDay = day.isSame(start, 'day');
  const isLastDay = day.isSame(end, 'day');

  return (
    <CustomPickersDay
      {...other}
      day={day}
      sx={dayIsBetween ? { px: 2.5, mx: 0 } : {}}
      dayIsBetween={dayIsBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
    />
  );
}

function groupByDayOfWeek(items: AppointmentItem[] | undefined) {
  const map = new Map<string, [AppointmentItem | undefined]>();

  if (items) {
    items.forEach((item) => {
      const key = dayjs(item.sk).format('dddd'); //format('dddd, MMMM DD');
      const value = map.get(key);
      if (value) {
        value.push(item);
      } else {
        map.set(key, [item]);
      }
    });
  }

  console.log('[SCHEDULE] Mapping by day of week', map);
  // map?.forEach((values) => {
  //   {
  //     values.map((v) => {
  //       console.log(v?.sk);
  //     });
  //   }
  // });

  return map;
}

function Schedule() {
  const { authStatus } = useAuthenticator((context) => [context.route]);

  const [date, setDate] = React.useState<Dayjs | null>(dayjs());
  const [fromSunday, setFromSunday] = React.useState<Dayjs | null>(dayjs());

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<Map<string, [AppointmentItem | undefined]>>();

  const getAppointments = async (from: Dayjs, to: Dayjs) => {
    console.debug(`[SCHEDULE] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointments(groupByDayOfWeek(appointments.data?.getAppointments?.items));

    setLoading(false);

    return appointments.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs) {
    console.log('[SCHEDULE] Date selected', d);
    setDate(d);

    const result = await getAppointments(d.startOf('week'), d.endOf('week'));
    console.debug('[SCHEDULE] Found appointments', result);
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      getAppointments(dayjs().startOf('week'), dayjs().endOf('week')).then((resp) => {
        console.debug('[SCHEDULE] Loaded initial appointments', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  console.log('GROUPED APPOINTMENTS:', appointments);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Grid container spacing={{ md: 1, lg: 1 }} columns={{ md: 6, lg: 6 }}>
        <Grid md={2} lg={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={date}
              onChange={(newDate) => dateSelected(newDate ?? dayjs())}
              slots={{ day: Day }}
              slotProps={{
                day: {
                  selectedDay: date,
                } as any,
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid md={4} lg={4}>
          {isLoading ? (
            <Loader variation='linear' />
          ) : (
            <>
              <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
                Week of {formatLongDateString(date!.startOf('week'))} to {formatLongDateString(date!.endOf('week'))}
              </Typography>

              {/* {appointments?.forEach((values) => {
                values.map((appt: AppointmentItem | undefined) => {
                  return <Typography>{appt?.pk}</Typography>;
                });
              })} */}

              {/* This works */}
              {/* {appointments?.get('Thursday')?.map((appt: AppointmentItem | undefined) => {
                return <Typography>{appt?.pk}</Typography>;
              })} */}

              {appointments && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  {days.map((d) => {
                    return (
                      <React.Fragment>
                        <Accordion defaultExpanded={appointments?.get(d) != undefined}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
                            <Typography>{d}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {appointments?.get(d)?.map((appt: AppointmentItem | undefined) => {
                              return (
                                <React.Fragment>
                                  <Grid container spacing={{ xs: 1 }} columns={{ xs: 10 }}>
                                    <Grid xs={2}>
                                      <TimePicker
                                        label='Start Time'
                                        value={dayjs(appt?.sk)}
                                        disabled={appt?.status === 'booked'}
                                        // onChange={(newValue) => setFromSunday(newValue)}
                                      />
                                    </Grid>
                                    <Grid xs={2}>
                                      <TimePicker
                                        label='End Time'
                                        value={dayjs(appt?.sk).add(appt?.duration ?? 0, 'minutes')}
                                        disabled={appt?.status === 'booked'}
                                      />
                                    </Grid>
                                    <Grid xs={2}>
                                      <TextField label='Duration' value={dayjs(appt?.duration)} disabled />
                                    </Grid>
                                    <Grid xs={2}>
                                      <Chip
                                        label={appt?.status}
                                        color={appt?.status === 'booked' ? 'primary' : 'success'}
                                        variant={appt?.status === 'cancelled' ? 'outlined' : 'filled'}
                                        sx={{ mb: 1 }}
                                      />
                                    </Grid>
                                    {appt?.status === 'available' && (
                                      <Grid xs={2}>
                                        <Button>Remove</Button>
                                      </Grid>
                                    )}
                                  </Grid>
                                </React.Fragment>
                              );
                            })}
                            <Button>Add</Button>
                          </AccordionDetails>
                        </Accordion>
                      </React.Fragment>
                    );
                  })}
                </LocalizationProvider>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Schedule;
