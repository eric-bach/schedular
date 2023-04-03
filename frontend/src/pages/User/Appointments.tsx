import React, { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Loader, useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import aws_exports from '../../aws-exports';
import { GET_CUSTOMER_APPOINTMENTS } from '../../graphql/queries';
import { GetCustomerAppointmentsResponse, CustomerAppointmentItem } from './CustomerTypes';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function formatTime(timeString: string) {
  return new Date('1970-01-01T' + timeString + 'Z').toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
  });
}

function Appointments() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<[CustomerAppointmentItem | undefined]>();

  const getCustomerAppointments = async (customerId: string) => {
    setLoading(true);
    console.log('GETTING CUSTOMER APPOINTMENTS');
    const appointments = await API.graphql<GraphQLQuery<GetCustomerAppointmentsResponse>>(
      graphqlOperation(GET_CUSTOMER_APPOINTMENTS, {
        customerId: customerId, //customer?.id,
        appointmentDateEpoch: new Date().getTime(),
      })
    );
    setAppointments(appointments.data?.getCustomerAppointments?.items);

    setLoading(false);

    return appointments.data?.getCustomerAppointments?.items;
  };

  useEffect(() => {
    if (user.attributes) {
      getCustomerAppointments(user.attributes.sub).then((resp) => {
        console.log('Appointments ', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Upcoming Appointments:
      </Typography>

      {isLoading && <Loader variation='linear' />}
      {!isLoading && (
        <List sx={{ bgcolor: 'background.paper' }}>
          {appointments?.map((appt) => {
            let heading = `${new Date(appt?.appointmentDetails?.date ?? new Date('1901-01-01')).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} at ${formatTime(appt?.appointmentDetails?.startTime ?? '00:00:00')}`;

            return (
              <div key={appt?.sk}>
                <ListItem alignItems='flex-start'>
                  <ListItemText
                    primary={heading}
                    secondary={
                      <React.Fragment>
                        <Typography sx={{ display: 'inline' }} component='span' variant='body2' color='text.primary'>
                          {appt?.customerDetails.name}
                        </Typography>
                        {' - '}
                        {appt?.type}
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

export default Appointments;
