import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuthenticator, View } from '@aws-amplify/ui-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

export function Login() {
  const { route } = useAuthenticator((context) => [context.route]);
  const location = useLocation();
  const navigate = useNavigate();

  const formFields = {
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
  };

  let from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (route === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [route, navigate, from]);

  return (
    <View className='auth-wrapper' padding='5rem'>
      <Authenticator signUpAttributes={['family_name', 'phone_number']} formFields={formFields}></Authenticator>
    </View>
  );
}
