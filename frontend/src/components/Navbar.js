import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
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
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Popover,
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
  VpnKey,
  Business,
  Notifications as NotificationsIcon,
  Campaign,
  Chat,
  DoneAll,
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ limit: 10 });
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationAPI.markAsRead(notif._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      }
      // Navigate to the event
      if (notif.event?._id) {
        const basePath = user?.role === 'participant' ? '/participant/event' : '/organizer/event';
        navigate(`${basePath}/${notif.event._id}`);
      }
      handleNotifClose();
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

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

  const formatTimeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

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
    { label: 'Ongoing Events', path: '/organizer/ongoing-events', icon: <Event /> },
    { label: 'Profile', path: '/organizer/profile', icon: <Person /> },
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

        {/* User Info & Notifications & Profile Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notification Bell - for participants and organizers */}
          {user && user.role !== 'admin' && (
            <>
              <IconButton color="inherit" onClick={handleNotifOpen}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <Popover
                open={Boolean(notifAnchorEl)}
                anchorEl={notifAnchorEl}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Paper sx={{ width: 360, maxHeight: 420, overflow: 'auto' }}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Button size="small" startIcon={<DoneAll />} onClick={handleMarkAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </Box>

                  {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No notifications yet
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {notifications.map((notif) => (
                        <ListItem
                          key={notif._id}
                          button
                          onClick={() => handleNotifClick(notif)}
                          sx={{
                            bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                            borderBottom: '1px solid #f0f0f0',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {notif.type === 'announcement' ? (
                              <Campaign color="primary" fontSize="small" />
                            ) : (
                              <Chat color="action" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600} noWrap>
                                {notif.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                                  {notif.message}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {formatTimeAgo(notif.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Popover>
            </>
          )}

          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>
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
