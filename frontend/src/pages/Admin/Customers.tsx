import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLQuery } from '@aws-amplify/api';
import { Loader } from '@aws-amplify/ui-react';

import { ADD_USER_TO_GROUP, LIST_USERS_IN_GROUP } from '../../graphql/queries';

type Users = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};
type ListUsersResponse = {
  listUsersInGroup: {
    users: Users[];
    nextToken: string;
  };
};

const data = [{ name: 'John Doe' }, { name: 'Jane Doe' }, { name: 'Bob Doe' }];
const groupNames: string[] = ['Public', 'Clients', 'Admins'];

function stringAvatar(name: string) {
  return {
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  };
}

function Customers() {
  const [users, setUsers] = useState<Users[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [tab, setTab] = React.useState(0);

  const listUsersInGroup = async (index: number, nextToken: string | undefined) => {
    setLoading(true);
    const result = await API.graphql<GraphQLQuery<ListUsersResponse>>(
      graphqlOperation(LIST_USERS_IN_GROUP, { groupName: groupNames[index], limit: 1, nextToken: nextToken })
    );

    if (nextToken && result.data?.listUsersInGroup.users) {
      setUsers(users.concat(result.data?.listUsersInGroup.users));
    } else {
      setUsers(result.data?.listUsersInGroup.users ?? []);
    }

    setNextToken(result.data?.listUsersInGroup.nextToken);
    setLoading(false);
    console.log('[CUSTOMERS] Users:', result);
    console.log('[CUSTOMERS] Next Token:', result.data?.listUsersInGroup.nextToken);
  };

  async function addToGroup(index: number) {
    const user = users[index];

    const result = await API.graphql<GraphQLQuery<Boolean>>(
      graphqlOperation(ADD_USER_TO_GROUP, {
        userId: user.id,
        groupName: 'Clients',
      })
    );

    console.log('[CUSTOMERS] Added user to group:', result);

    await listUsersInGroup(tab, undefined);
    setOpen(true);
  }

  useEffect(() => {
    setTab(0);
    listUsersInGroup(0, undefined);
  }, []);

  const handleClick = async (index: number) => {
    console.log('Clicked User ', users[index]);

    if (tab === 0) {
      await addToGroup(index);
    } else {
      // TODO Open user profile
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    listUsersInGroup(newValue, undefined);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  console.log(users);

  return (
    <Container maxWidth='md' sx={{ mt: 5 }}>
      <Typography variant='h5' fontWeight='bold' align='left' color='textPrimary' gutterBottom sx={{ mt: 2 }}>
        Users
      </Typography>
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tabs value={tab} onChange={handleChange} aria-label='icon label tabs example'>
          <Tab icon={<GppMaybeIcon />} label='Unverified' />
          <Tab icon={<VerifiedUserIcon />} label='Verified' />
          <Tab icon={<AdminPanelSettingsIcon />} label='Administrators' />
        </Tabs>
        <Autocomplete
          disabled // TODO Search feature not built yet
          freeSolo
          options={users.map((option: any) => `${option.firstName} ${option.lastName}`)}
          onKeyDown={(e: any) => {
            if (e.keyCode === 13) {
              console.log('Search Key', e.target.value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Search User'
              InputProps={{
                ...params.InputProps,
                type: 'search',
              }}
              sx={{ mt: '0.5rem', minWidth: '300px' }}
            />
          )}
        />
      </Box>
      {isLoading && <Loader variation='linear' style={{ margin: '15' }} />}
      {!isLoading && (
        <React.Fragment>
          {(!users || users.length < 1) && <Typography sx={{ mt: '1rem' }}>No users found</Typography>}
          <List sx={{ bgcolor: 'background.paper' }}>
            {users.map((user, index) => (
              <List key={user.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleClick(index)}>
                    <ListItemAvatar>
                      <Avatar {...stringAvatar(`${user.firstName} ${user.lastName}`)} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={
                        <React.Fragment>
                          <Typography sx={{ display: 'block' }} component='span' variant='body2'>
                            {user.email} | {user.phoneNumber}
                          </Typography>
                          <Typography sx={{ display: 'block' }} component='span' variant='body2'></Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            ))}
          </List>
          {nextToken && (
            <Button variant='outlined' onClick={() => listUsersInGroup(tab, nextToken)}>
              Load More
            </Button>
          )}
        </React.Fragment>
      )}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity='success' sx={{ width: '100%' }}>
          User Authorized
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Customers;
