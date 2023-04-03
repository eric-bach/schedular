import React, { useEffect } from 'react';
import { Amplify, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import Container from '@mui/material/Container';

import aws_exports from '../../aws-exports';
import { GET_CUSTOMER_APPOINTMENTS } from '../../graphql/queries';
import { GetCustomerAppointmentsResponse, CustomerAppointmentItem } from './Types';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

function Appointments() {
  const [customer, setCustomer] = React.useState<Customer | null>(null);
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
    Auth.currentAuthenticatedUser().then((user) => {
      setCustomer({
        id: user.attributes.sub,
        name: user.attributes.given_name,
        email: user.attributes.email,
        phone: user.attributes.phone_number,
      });

      getCustomerAppointments(user.attributes.sub).then((resp) => {
        console.log(resp);
      });
    });
  }, []);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      Appointments
    </Container>
  );
}

export default withAuthenticator(Appointments, {
  signUpAttributes: ['phone_number', 'given_name', 'family_name'],
  formFields: {
    signUp: {
      given_name: {
        label: 'First Name:',
        placeholder: 'Enter your first name',
        order: 1,
      },
      family_name: {
        label: 'Last Name:',
        placeholder: 'Enter your last name',
        order: 2,
      },
      phone_number: {
        order: 3,
      },
      username: {
        label: 'Email:',
        placeholder: 'Enter your email',

        order: 4,
      },
      password: {
        order: 5,
      },
      confirm_password: {
        order: 6,
      },
    },
  },
});
