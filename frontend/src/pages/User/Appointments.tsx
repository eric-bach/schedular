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
import DeleteIcon from '@mui/icons-material/Delete';

import aws_exports from '../../aws-exports';
import { GET_BOOKINGS } from '../../graphql/queries';
import { GetBookingsResponse, BookingItem } from './CustomerTypes';

import '@aws-amplify/ui-react/styles.css';
import { formateLocalLongDate, formatLocalTimeString } from '../../helpers/utils';
import Stack from '@mui/material/Stack';

Amplify.configure(aws_exports);

function Appointments() {
  const { user, authStatus } = useAuthenticator((context) => [context.route]);

  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [bookings, setBookings] = React.useState<[BookingItem | undefined]>();

  const getCustomerAppointments = async (customerId: string) => {
    //console.debug('[APPOINTMENTS] Getting appointments for', customerId);
    console.debug('[APPOINTMENTS] Getting appointments for', new Date().toISOString());

    setLoading(true);
    const result = await API.graphql<GraphQLQuery<GetBookingsResponse>>(
      graphqlOperation(GET_BOOKINGS, {
        customerId: customerId,
        datetime: new Date().toISOString(),
      })
    );
    setBookings(result.data?.getBookings?.items);

    setLoading(false);

    return result.data?.getBookings?.items;
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && user.attributes) {
      getCustomerAppointments(user.attributes.sub).then((resp) => {
        console.debug('[APPOINTMENTS] Found appointments', resp);
      });
    } else {
      // TODO Return error
    }
  }, []);

  const handleDelete = () => {
    console.info('Delete.');
  };

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Upcoming Appointments:
      </Typography>

      {isLoading ? (
        <Loader variation='linear' />
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {bookings && bookings.length > 0 ? (
            bookings?.map((booking) => {
              if (!booking) return <></>;

              let heading = `${formateLocalLongDate(booking.sk)} at ${formatLocalTimeString(booking.sk, 0)}`;
              let chipColor = booking.status === 'booked' ? '#1976D2' : booking.status === 'cancelled' ? '#CD5C5C' : 'white';

              return (
                <React.Fragment key={booking.sk}>
                  <ListItem
                    alignItems='flex-start'
                    secondaryAction={
                      <Stack direction='row' spacing={1}>
                        <Chip
                          label={booking.status}
                          variant={booking.status === 'booked' ? 'filled' : 'outlined'}
                          sx={{ mb: 1, backgroundColor: chipColor, color: 'white' }}
                        />
                        {booking.status === 'booked' && (
                          <Chip
                            label='cancel'
                            onClick={handleDelete}
                            onDelete={handleDelete}
                            sx={{ backgroundColor: '#FA5F55', color: 'white', mb: 1 }}
                            deleteIcon={<DeleteIcon />}
                          />
                        )}
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={heading}
                      secondary={
                        <Stack>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                            Type:{' '}
                            <Typography component='span' variant='body2'>
                              {booking.appointmentDetails.category}
                            </Typography>
                          </Typography>
                          <Typography component='span' variant='subtitle2' color='text.primary' sx={{ display: 'inline' }}>
                            Confirmation Id:{' '}
                            <Typography component='span' variant='body2'>
                              {booking.pk.split('#')[1]}
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
