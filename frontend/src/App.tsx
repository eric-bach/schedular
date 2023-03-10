import React, { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';

import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import aws_exports from './aws-exports';
import { GET_APPOINTMENTS } from './graphql/queries';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function App() {
  const [date, setDate] = React.useState<Dayjs | null>(null);
  const [timeslot, setTimeslot] = React.useState<string | null>(null);

  const today = dayjs();
  const oneMonth = dayjs().add(1, 'month');

  const getAppointments = async (date: Dayjs | null) => {
    console.log('GETTING APPOINTMENTS FOR ', dayjs(date).format('YYYY-MM-DD'));
    const appointments = await API.graphql<GraphQLQuery<string>>(
      graphqlOperation(GET_APPOINTMENTS, {
        date: dayjs(date).format('YYYY-MM-DD'),
      })
    );
    console.log('FOUND APPOINTMENTS: ', appointments);
  };

  useEffect(() => {
    // TODO TEST ONLY - Remove this later
    //getAppointments(today);
  }, []);

  async function dateSelected(date: Dayjs | null) {
    // Reset timeslow
    setTimeslot(null);

    console.log('Selected Date: ', date);
    setDate(date);
    await getAppointments(date);
  }

  function timeSelected(time: string) {
    console.log('Selected Time: ', time);
    setTimeslot(time);
  }

  return (
    <Box sx={{ flexGrow: 1, mt: 5 }}>
      <Grid
        container
        spacing={2}
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
        <Grid xs={3} />
        <Grid xs={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={date}
              minDate={today}
              maxDate={oneMonth}
              onChange={(newValue) => dateSelected(newValue)}
            />
          </LocalizationProvider>
        </Grid>
        <Grid xs={3}>
          {date && (
            <>
              <Stack spacing={2} alignItems='flex-start'>
                <Typography
                  variant='subtitle1'
                  fontWeight='bold'
                  align='left'
                  color='textPrimary'
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Available Times:
                </Typography>
                <Button
                  variant='contained'
                  sx={{ width: '174px' }}
                  onClick={(e) => {
                    //@ts-ignore
                    timeSelected(e.target.textContent);
                  }}
                >
                  9:00 AM - 10:00 AM
                </Button>
                <Button
                  variant='contained'
                  sx={{ width: '174px' }}
                  onClick={(e) => {
                    //@ts-ignore
                    timeSelected(e.target.textContent);
                  }}
                >
                  11:00 AM - 12:00 PM
                </Button>
                <Button
                  variant='contained'
                  sx={{ width: '174px' }}
                  onClick={(e) => {
                    //@ts-ignore
                    timeSelected(e.target.textContent);
                  }}
                >
                  1:00 PM - 2:00 PM
                </Button>
              </Stack>

              {timeslot && (
                <>
                  <Stack alignItems='flex-start'>
                    <Typography sx={{ mt: 4 }}>
                      {dayjs(date).format('MMM DD, YYYY')} from{' '}
                      {timeslot.toString()}
                    </Typography>
                    <Button
                      variant='contained'
                      color='success'
                      onClick={(e) => {
                        //@ts-ignore
                        timeSelected(e.target.textContent);
                      }}
                    >
                      Confirm Appointment
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </Grid>
        <Grid xs={3} />
      </Grid>
    </Box>
  );
}

export default withAuthenticator(App);
