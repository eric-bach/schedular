import { useLocation, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

export function RequireAdminAuth({ children }: any) {
  const location = useLocation();
  const { route, user } = useAuthenticator((context) => [context.route]);
  const groups = user?.getSignInUserSession()?.getAccessToken()?.payload['cognito:groups'];

  if (route !== 'authenticated' || !groups.includes('Admins')) {
    return <Navigate to='/' state={{ from: location }} replace />;
  }

  return children;
}
