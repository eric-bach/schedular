import React from 'react';
import { Amplify } from 'aws-amplify';
import { useAuthenticator, AccountSettings, Alert, TextField } from '@aws-amplify/ui-react';
import Container from '@mui/material/Container';

import aws_exports from '../../aws-exports';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Profile() {
  const { user } = useAuthenticator((context) => [context.route]);

  const [visible, setVisible] = React.useState(false);

  const handleSuccess = () => {
    setVisible(true);
  };

  return (
    <Container maxWidth='xs' sx={{ mt: 5 }}>
      {visible && (
        <Alert isDismissible={true} hasIcon={true} heading='Success' variation='success' style={{ marginBottom: '12px' }}>
          Password successfully changed
        </Alert>
      )}
      <TextField label='First Name' disabled value={user.attributes?.given_name} style={{ marginBottom: '12px' }} />
      <TextField label='Last Name' disabled value={user.attributes?.family_name} style={{ marginBottom: '12px' }} />
      <TextField label='Email' disabled value={user.attributes?.email} style={{ marginBottom: '12px' }} />
      <TextField label='Phone' disabled value={user.attributes?.phone_number} style={{ marginBottom: '12px' }} />
      <AccountSettings.ChangePassword onSuccess={handleSuccess} />
    </Container>
  );
}

export default Profile;
