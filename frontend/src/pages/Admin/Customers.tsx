import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { API, graphqlOperation } from 'aws-amplify';

import { ADD_USER_TO_GROUP, LIST_USERS_IN_GROUP } from '../../graphql/queries';
import { GraphQLQuery } from '@aws-amplify/api';
import { Divider, Loader } from '@aws-amplify/ui-react';

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
  const [open, setOpen] = React.useState(false);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [tab, setTab] = React.useState(0);

  const listUsersInGroup = async (index: number) => {
    setLoading(true);
    const result = await API.graphql<GraphQLQuery<ListUsersResponse>>(graphqlOperation(LIST_USERS_IN_GROUP, { groupName: groupNames[index], limit: 2 }));

    setUsers(result.data?.listUsersInGroup.users ?? []);
    setLoading(false);
    console.log('[CUSTOMERS] Users:', result);
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

    await listUsersInGroup(tab);
    setOpen(true);
  }

  useEffect(() => {
    setTab(0);
    listUsersInGroup(0);
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    listUsersInGroup(newValue);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

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
          freeSolo
          id='free-solo-2-demo'
          disableClearable
          options={data.map((option: any) => option.name)}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Search user'
              InputProps={{
                ...params.InputProps,
                type: 'search',
              }}
              sx={{ mt: '0.5rem', minWidth: '300px' }}
            />
          )}
        />
      </Box>
      {isLoading ? (
        <Loader variation='linear' style={{ margin: '15' }} />
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {users.map((user, index) => (
            <React.Fragment key={user.id}>
              <ListItem
                alignItems='flex-start'
                secondaryAction={
                  tab === 0 ? (
                    <IconButton edge='end' aria-label='delete' onClick={(e) => addToGroup(index)}>
                      <AddTaskIcon />
                    </IconButton>
                  ) : (
                    <React.Fragment />
                  )
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
                        {user.email} | {user.phoneNumber}
                      </Typography>
                      <Typography sx={{ display: 'block' }} component='span' variant='body2'></Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
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
