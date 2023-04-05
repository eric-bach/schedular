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

import { GET_APPOINTMENTS } from '../../graphql/queries';
import { GetAppointmentsResponse, AppointmentItem } from './AppointmentTypes';

function formatTime(timeString: string) {
  return new Date('1970-01-01T' + timeString + 'Z').toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}

function Schedule() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<[AppointmentItem | undefined]>();
  const [dateHeading, setDateHeading] = React.useState<string | undefined>();

  const getAppointments = async (date: string) => {
    setLoading(true);
    console.log('GETTING APPOINTMENTS FOR', date);
    const appointments = await API.graphql<GraphQLQuery<GetAppointmentsResponse>>(
      graphqlOperation(GET_APPOINTMENTS, {
        date: date,
      })
    );

    setDateHeading(
      `${new Date(date ?? new Date('1901-01-01')).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`
    );
    console.log(dateHeading);

    setAppointments(appointments.data?.getAppointments?.items);

    setLoading(false);

    return appointments.data?.getAppointments?.items;
  };

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
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Schedule for {dateHeading}
      </Typography>

      {isLoading && <Loader variation='linear' />}

      {!isLoading && (
        <List sx={{ bgcolor: 'background.paper' }}>
          {appointments?.map((appt) => {
            return (
              <div key={appt?.sk}>
                <ListItem alignItems='flex-start'>
                  <ListItemText
                    primary={
                      appt?.status === 'booked' ? (
                        <Chip label={appt?.status} color='primary' sx={{ mb: 1 }} />
                      ) : (
                        <Chip label={appt?.status} color='success' variant='outlined' sx={{ mb: 1 }} />
                      )
                    }
                    secondary={
                      <React.Fragment>
                        <Typography sx={{ display: 'inline' }} component='span' variant='body2' color='text.primary'>
                          {appt?.appointmentDetails.startTime}
                        </Typography>
                        {' - '}
                        {appt?.type}
                        {appt?.customerDetails ? (
                          <div>
                            {appt?.customerDetails.name} {appt?.customerDetails.email} {appt?.customerDetails.phone}
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant='inset' component='li' />
              </div>
            );
          })}
        </List>
      )}
    </Container>
  );
}

export default Schedule;
