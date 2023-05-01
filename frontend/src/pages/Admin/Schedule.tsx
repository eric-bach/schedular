import React, { useEffect } from 'react';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { styled } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from '../../types/BookingTypes';
import { formatLongDateString } from '../../helpers/utils';
import ScheduleDay from './ScheduleDay';

dayjs.extend(isBetweenPlugin);

interface CustomPickerDayProps extends PickersDayProps<Dayjs> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
}

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
  const map = new Map<string, [AppointmentItem]>();

  if (items) {
    items.forEach((item) => {
      const key = dayjs(item.sk).format('dddd, MMM D, YYYY'); //format('dddd, MMMM DD');
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
  const [appointmentsMap, setAppointmentsMap] = React.useState<Map<string, [AppointmentItem]>>();

  const getAppointments = async (from: Dayjs, to: Dayjs) => {
    console.debug(`[SCHEDULE] Getting schedule from ${from} to ${to}`);

    setLoading(true);

    const result = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(graphqlOperation(GET_APPOINTMENTS, { from, to }));
    setAppointmentsMap(groupByDayOfWeek(result.data?.getAppointments?.items));

    setLoading(false);

    return result.data?.getAppointments?.items;
  };

  async function dateSelected(d: Dayjs) {
    console.log('[SCHEDULE] Date selected', d);
    setDate(d);

    const result = await getAppointments(d.startOf('week'), d.endOf('week'));
    console.debug('[SCHEDULE] Found appointments', result);
  }

  function addFields(appointments: any, d: any) {
    console.log('[SCHEDULE]: Add Fields ', appointments, d);

    // create a new AppointmentItem
    let newField = {
      pk: 'asdf',
      sk: 'asdf',
      status: 'available',
      type: 'appt',
      category: 'massage',
      duration: 60,
    };

    // add to the Appointments array
    //setAppointments().push(newField);
    // update the UI
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

  console.log('GROUPED APPOINTMENTS:', appointmentsMap);

  // Get days of week in map
  let keys: string[] = [];
  if (appointmentsMap) {
    keys = Array.from(appointmentsMap.keys());
  }

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

              {appointmentsMap && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  {keys.map((date) => {
                    const appointments = appointmentsMap?.get(date);

                    return <ScheduleDay appointments={appointments} date={date} key={date} />;
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
