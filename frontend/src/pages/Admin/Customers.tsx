import React, { useEffect, useState } from 'react';
import { Avatar, Container, IconButton, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { API, graphqlOperation } from 'aws-amplify';

import { LIST_USERS_IN_GROUP } from '../../graphql/queries';
import { GraphQLQuery } from '@aws-amplify/api';
import { Divider } from '@aws-amplify/ui-react';

type Users = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};
type ListUsersResponse = {
  listUsersInGroup: Users[];
};

function stringAvatar(name: string) {
  return {
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  };
}

function Customers() {
  const [users, setUsers] = useState<Users[]>([]);

  const listUsersInGroup = async () => {
    const result = await API.graphql<GraphQLQuery<ListUsersResponse>>(graphqlOperation(LIST_USERS_IN_GROUP, { groupName: 'Pending' }));

    setUsers(result.data?.listUsersInGroup ?? []);
    console.log('[CUSTOMERS] Users:', result);
  };

  useEffect(() => {
    listUsersInGroup();
  }, []);

  function addToGroup(index: number) {
    console.log('clicked', users[index]);
  }

  return (
    <Container maxWidth='lg' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Customers (Pending)
      </Typography>

      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        {users.map((user, index) => (
          <React.Fragment key={user.id}>
            <ListItem
              alignItems='flex-start'
              secondaryAction={
                <IconButton edge='end' aria-label='delete' onClick={(e) => addToGroup(index)}>
                  <AddTaskIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar {...stringAvatar(`${user.firstName} ${user.lastName}`)} />
              </ListItemAvatar>
              <ListItemText
                primary={`${user.firstName} ${user.lastName}`}
                secondary={
                  <React.Fragment>
                    <Typography sx={{ display: 'block' }} component='span' variant='body2'>
                      {user.email}
                    </Typography>
                    <Typography sx={{ display: 'block' }} component='span' variant='body2'>
                      {user.phoneNumber}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
}

export default Customers;
