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
import Chip from '@mui/material/Chip';

import aws_exports from '../../aws-exports';
import { GET_CUSTOMER_APPOINTMENTS } from '../../graphql/queries';
import { GetCustomerAppointmentsResponse, CustomerAppointmentItem } from './CustomerTypes';

import '@aws-amplify/ui-react/styles.css';
import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';
import Stack from '@mui/material/Stack';

Amplify.configure(aws_exports);

function Appointments() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [appointments, setAppointments] = React.useState<[CustomerAppointmentItem | undefined]>();

  const getCustomerAppointments = async (customerId: string) => {
    //console.debug('[APPOINTMENTS] Getting appointments for', customerId);

    setLoading(true);
    const appointments = await API.graphql<GraphQLQuery<GetCustomerAppointmentsResponse>>(
      graphqlOperation(GET_CUSTOMER_APPOINTMENTS, {
        customerId: customerId,
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
        //console.debug('[APPOINTMENTS] Found appointments', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Upcoming Appointments:
      </Typography>

      {isLoading ? (
        <Loader variation='linear' />
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {appointments && appointments.length > 0 ? (
            appointments?.map((appt) => {
              if (!appt) return <></>;

              let heading = `${formateLocalLongDate(appt.sk)} at ${formatLocalTimeString(appt.sk, 0)}`;

              return (
                <React.Fragment>
                  <ListItem
                    alignItems='flex-start'
                    secondaryAction={
                      <Chip label={appt.status} color='primary' variant={appt.status === 'booked' ? 'filled' : 'outlined'} sx={{ mb: 1 }} />
                    }
                  >
                    <ListItemText
                      primary={heading}
                      secondary={
                        <Stack>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                            Type:{' '}
                            <Typography component='span' variant='body2'>
                              {appt.type}
                            </Typography>
                          </Typography>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                            Confirmation Id:{' '}
                            <Typography component='span' variant='body2'>
                              {appt.confirmationId}
                            </Typography>
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  <Divider component='li' />
                </React.Fragment>
              );
            })
          ) : (
            <Typography variant='body1' align='left' color='textPrimary'>
              No Upcoming Appointments
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}

export default Appointments;
