import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import SpaIcon from '@mui/icons-material/Spa';

const pages = ['Services', 'Pricing', 'Book Appointment'];
const settings = ['Profile', 'Appointments', 'Logout'];
const adminPages = ['Customers', 'Schedule', 'Manage'];

export function Header() {
  const { authStatus, user, signOut } = useAuthenticator((context) => [context.route, context.signOut]);
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [anchorElAdmin, setAnchorElAdmin] = React.useState<null | HTMLElement>(null);

  const groups = user?.getSignInUserSession()?.getAccessToken()?.payload['cognito:groups'];
  const isAdmin = groups?.includes('Admins');

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleOpenAdminMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElAdmin(event.currentTarget);
  };

  const handleCloseNavMenu = (e: any) => {
    setAnchorElNav(null);

    if (e.target.textContent === 'Services') {
      navigate('/services');
    } else if (e.target.textContent === 'Pricing') {
      navigate('/pricing');
    } else if (e.target.textContent === 'Book Appointment') {
      navigate('/booking');
    }
  };

  const handleCloseUserMenu = (e: any) => {
    setAnchorElUser(null);

    if (e.target.textContent === 'Profile') {
      navigate('/user/profile');
    } else if (e.target.textContent === 'Appointments') {
      navigate('/user/appointments');
    } else if (e.target.textContent === 'Logout') {
      signOut();
      navigate('/');
    }
  };

  const handleCloseAdminMenu = (e: any) => {
    setAnchorElAdmin(null);

    if (e.target.textContent === 'Schedule') {
      navigate('/admin/schedule');
    }
  };

  return (
    <>
      <AppBar position='static'>
        <Container maxWidth='xl'>
          <Toolbar disableGutters>
            <SpaIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant='h6'
              noWrap
              component='a'
              href='/'
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SPA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size='large'
                aria-label='account of current user'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                onClick={handleOpenNavMenu}
                color='inherit'
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id='menu-appbar'
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={(e) => handleCloseNavMenu(e)}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page} onClick={(e) => handleCloseNavMenu(e)}>
                    <Typography textAlign='center'>{page}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <SpaIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Typography
              variant='h5'
              noWrap
              component='a'
              href=''
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SPA
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button key={page} onClick={(e) => handleCloseNavMenu(e)} sx={{ my: 2, color: 'white', display: 'block' }}>
                  {page}
                </Button>
              ))}
            </Box>

            {authStatus === 'authenticated' && isAdmin && (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title='Open settings'>
                  <Button onClick={handleOpenAdminMenu} sx={{ pr: 5, color: 'white' }}>
                    Admin
                  </Button>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id='menu-appbar'
                  anchorEl={anchorElAdmin}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElAdmin)}
                  onClose={(e) => handleCloseAdminMenu(e)}
                >
                  {adminPages.map((setting) => (
                    <MenuItem key={setting} onClick={(e) => handleCloseAdminMenu(e)}>
                      <Typography textAlign='center'>{setting}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}

            {authStatus === 'authenticated' && (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title='Open settings'>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar src='/broken-image.jpg' />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id='menu-appbar'
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={(e) => handleCloseUserMenu(e)}
                >
                  {settings.map((setting) => (
                    <MenuItem key={setting} onClick={(e) => handleCloseUserMenu(e)}>
                      <Typography textAlign='center'>{setting}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Outlet />
    </>
  );
}
