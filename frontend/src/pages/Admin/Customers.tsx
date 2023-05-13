import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { API, graphqlOperation } from 'aws-amplify';

import { GET_USERS } from '../../graphql/queries';
import { GraphQLQuery } from '@aws-amplify/api';

type Users = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};
type GetUsersResponse = {
  getUsers: Users[];
};

function Customers() {
  const [users, setUsers] = useState<Users[]>([]);

  const getUsers = async () => {
    const result = await API.graphql<GraphQLQuery<GetUsersResponse>>(graphqlOperation(GET_USERS));

    setUsers(result.data?.getUsers ?? []);
    console.log('[CUSTOMERS] Users:', result);
  };

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Typography>Customers - Pending</Typography>
      {users.map((u) => (
        <Typography>
          {u.id} {u.firstName} {u.lastName}
        </Typography>
      ))}
    </Container>
  );
}

export default Customers;
