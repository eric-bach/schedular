import React from 'react';
import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
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

export default Profile;
