import React from 'react';
import { Amplify } from 'aws-amplify';
import { AccountSettings, Alert } from '@aws-amplify/ui-react';
import { Container } from '@mui/material';

import aws_exports from '../../aws-exports';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(aws_exports);

function Profile() {
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

      <AccountSettings.ChangePassword onSuccess={handleSuccess} />
    </Container>
  );
}

export default Profile;
