import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  Event,
  Group,
  Person,
  Logout,
  Menu as MenuIcon,
  Add,
  EventAvailable,
  AdminPanelSettings,
  VpnKey,
  Business,
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Participant navigation items
  const participantNavItems = [
    { label: 'Dashboard', path: '/participant', icon: <Dashboard /> },
    { label: 'Browse Events', path: '/participant/browse-events', icon: <Event /> },
    { label: 'My Events', path: '/participant/my-events', icon: <EventAvailable /> },
    { label: 'Clubs', path: '/participant/clubs', icon: <Group /> },
  ];

  // Organizer navigation items
  const organizerNavItems = [
    { label: 'Dashboard', path: '/organizer', icon: <Dashboard /> },
    { label: 'Create Event', path: '/organizer/create-event', icon: <Add /> },
    { label: 'My Events', path: '/organizer/my-events', icon: <EventAvailable /> },
    { label: 'Ongoing Events', path: '/organizer/ongoing-events', icon: <Event /> },
  ];

  // Admin navigation items
  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: <Dashboard /> },
    { label: 'Manage Clubs/Organizers', path: '/admin/organizers', icon: <Business /> },
    { label: 'Password Reset Requests', path: '/admin/password-resets', icon: <VpnKey /> },
  ];

  // Get navigation items based on role
  const getNavItems = () => {
    if (user?.role === 'participant') return participantNavItems;
    if (user?.role === 'organizer') return organizerNavItems;
    if (user?.role === 'admin') return adminNavItems;
    return [];
  };

  const navItems = getNavItems();

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        {/* Logo/Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 0, mr: 4, fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => navigate(user?.role === 'participant' ? '/participant' : user?.role === 'organizer' ? '/organizer' : '/admin')}
        >
          Felicity
        </Typography>

        {/* Navigation Links - Desktop */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                fontWeight: isActive(item.path) ? 'bold' : 'normal',
                borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                borderRadius: 0,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User Info & Profile Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.firstName?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            
            {user?.role === 'participant' && (
              <MenuItem
                onClick={() => {
                  navigate('/participant/profile');
                  handleProfileMenuClose();
                }}
              >
                <Person sx={{ mr: 1 }} fontSize="small" />
                Edit Profile
              </MenuItem>
            )}

            {user?.role === 'organizer' && (
              <MenuItem
                onClick={() => {
                  navigate('/organizer/profile');
                  handleProfileMenuClose();
                }}
              >
                <Person sx={{ mr: 1 }} fontSize="small" />
                Profile
              </MenuItem>
            )}
            
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Mobile Menu Icon */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'block', md: 'none' }, ml: 2 }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
