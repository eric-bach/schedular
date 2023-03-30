//https://blog.jarrodwatts.com/why-you-should-be-using-react-context

import React, { useState, useEffect } from 'react';
import { createContext, useContext } from 'react';
import { Auth, Hub } from 'aws-amplify';

// initialize the context with an empty object
const UserContext = createContext({ user: {} });

export default function AuthContext({ children }: any) {
  // Store the user in a state variable
  const [user, setUser] = useState({});
  useEffect(() => {
    checkUser();
  }, []);

  // (Only once) - when the component mounts, create a listener for any auth events.
  useEffect(() => {
    Hub.listen('auth', () => {
      // Hub listens for auth events that happen.
      // i.e. Sign in, sign out, sign up, etc.
      // Whenever an event gets detected, run the checkUser function
      checkUser();
    });
  }, []);

  async function checkUser() {
    try {
      // Get the current authenticated user
      const user = await Auth.currentAuthenticatedUser();
      if (user) {
        // set the user in state
        setUser(user);
      }
    } catch (error) {
      // Error occurs if there is no user signed in.
      // set the user to null if there is no user.
      setUser({});
    }
  }

  return (
    <UserContext.Provider
      value={{
        user, // the value of the current user
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// export the hook so we can use it in other components.
export const useUser = () => useContext(UserContext);
