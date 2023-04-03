import React from 'react';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import Container from '@mui/material/Container';

import aws_exports from '../../aws-exports';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Profile() {
  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      Profile
    </Container>
  );
}

export default withAuthenticator(Profile, {
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
