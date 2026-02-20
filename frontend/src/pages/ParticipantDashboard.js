import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Link as MuiLink,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Logout,
  Edit,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalOffer as PriceIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import api from '../services/api';

const ParticipantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for registrations
  const [registrations, setRegistrations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Normal, 2: Merchandise, 3: Completed, 4: Cancelled

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/registrations/my');
      const allRegistrations = response.data.data || [];
      setRegistrations(allRegistrations);

      // Filter upcoming events (active registrations for events that haven't started)
      const upcomingFiltered = allRegistrations.filter(reg => 
        (reg.registrationStatus === 'Confirmed' || reg.registrationStatus === 'Pending') && 
        new Date(reg.event?.eventStartDate) > new Date()
      );
      
      // Deduplicate: Keep only latest registration per event
      // This handles cases where user cancelled and re-registered
      const eventMap = new Map();
      upcomingFiltered.forEach(reg => {
        const eventId = reg.event?._id;
        if (eventId) {
          if (!eventMap.has(eventId) || 
              new Date(reg.createdAt) > new Date(eventMap.get(eventId).createdAt)) {
            eventMap.set(eventId, reg);
          }
        }
      });
      
      setUpcomingEvents(Array.from(eventMap.values()));
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter registrations based on selected tab
  const getFilteredRegistrations = () => {
    switch (tabValue) {
      case 0: // All
        return registrations;
      case 1: // Normal Events
        return registrations.filter(reg => reg.event?.eventType === 'Normal');
      case 2: // Merchandise
        return registrations.filter(reg => reg.event?.eventType === 'Merchandise');
      case 3: // Completed
        return registrations.filter(reg => 
          reg.registrationStatus === 'Confirmed' && 
          new Date(reg.event?.eventEndDate) < new Date()
        );
      case 4: // Cancelled/Rejected
        return registrations.filter(reg => 
          reg.registrationStatus === 'Cancelled' || reg.registrationStatus === 'Rejected'
        );
      default:
        return registrations;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  // Get unique clubs (remove duplicates) and handle both ID strings and populated objects
  const uniqueFollowedClubs = user?.followedClubs 
    ? Array.from(new Map(
        user.followedClubs.map(club => {
          // Handle both string IDs and populated objects
          if (typeof club === 'string') {
            // If it's just an ID string, we can't display it properly
            // This shouldn't happen if /auth/me properly populates followedClubs
            return [club, null]; // Will be filtered out
          } else {
            // It's a populated object with _id and organizerName
            return [club._id, club.organizerName];
          }
        })
      ).values())
      .filter(name => name !== null) // Remove entries where we only had IDs
    : [];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4">
            Welcome, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.role === 'participant' ? 'Explore events and manage your registrations' : ''}
          </Typography>
        </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Your Profile
                </Typography>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  component={Link}
                  to="/participant/profile"
                >
                  Edit
                </Button>
              </Box>
              <Box mt={2}>
                <Typography variant="body1">
                  <strong>Name:</strong> {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body1">
                  <strong>College:</strong> {user?.college}
                </Typography>
                <Typography variant="body1">
                  <strong>Type:</strong> {user?.participantType}
                </Typography>
                <Typography variant="body1">
                  <strong>Contact:</strong> {user?.contactNumber}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Interests
              </Typography>
              {user?.interests && user.interests.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.interests.map((interest) => (
                    <Chip key={interest} label={interest} color="primary" size="small" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No interests set.{' '}
                  <MuiLink component={Link} to="/participant/profile" underline="hover">
                    Add interests
                  </MuiLink>
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Following Clubs
              </Typography>
              {uniqueFollowedClubs.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {uniqueFollowedClubs.map((clubName, index) => (
                    <Chip 
                      key={`club-${index}`}
                      label={clubName} 
                      color="secondary" 
                      size="small" 
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not following any clubs yet.{' '}
                  <MuiLink component={Link} to="/participant/clubs" underline="hover">
                    Browse clubs
                  </MuiLink>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Upcoming Events
                </Typography>
                <Button
                  size="small"
                  component={Link}
                  to="/participant/browse-events"
                  variant="outlined"
                >
                  Browse More Events
                </Button>
              </Box>
              
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : upcomingEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You have no upcoming events.{' '}
                  <MuiLink component={Link} to="/participant/browse-events" underline="hover">
                    Browse events
                  </MuiLink>
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Event Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Organizer</strong></TableCell>
                        <TableCell><strong>Start Date</strong></TableCell>
                        <TableCell><strong>Venue</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcomingEvents.slice(0, 5).map((reg) => (
                        <TableRow key={reg._id} hover>
                          <TableCell>
                            <MuiLink
                              component={Link}
                              to={`/participant/event/${reg.event?._id}`}
                              underline="hover"
                              sx={{ fontWeight: 500 }}
                            >
                              {reg.event?.eventName}
                            </MuiLink>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={reg.event?.eventType} 
                              size="small"
                              color={reg.event?.eventType === 'Normal' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{reg.event?.organizer?.organizerName}</TableCell>
                          <TableCell>{formatDate(reg.event?.eventStartDate)}</TableCell>
                          <TableCell>{reg.event?.venue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Participation History
                </Typography>
              </Box>

              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="All" />
                <Tab label="Normal" />
                <Tab label="Merchandise" />
                <Tab label="Completed" />
                <Tab label="Cancelled/Rejected" />
              </Tabs>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : getFilteredRegistrations().length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No registrations found in this category.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Event Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Organizer</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Team Name</strong></TableCell>
                        <TableCell><strong>Ticket ID</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredRegistrations().map((reg) => (
                        <TableRow key={reg._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <EventIcon fontSize="small" color="action" />
                              <MuiLink
                                component={Link}
                                to={`/participant/event/${reg.event?._id}`}
                                underline="hover"
                                sx={{ fontWeight: 500 }}
                              >
                                {reg.event?.eventName}
                              </MuiLink>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={reg.event?.eventType} 
                              size="small"
                              color={reg.event?.eventType === 'Normal' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PersonIcon fontSize="small" color="action" />
                              {reg.event?.organizer?.organizerName}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={reg.registrationStatus} 
                              size="small"
                              color={getStatusColor(reg.registrationStatus)}
                            />
                          </TableCell>
                          <TableCell>
                            {reg.teamName || '-'}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <ReceiptIcon fontSize="small" color="primary" />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: 'primary.main',
                                  cursor: 'pointer'
                                }}
                                title="Click to copy"
                              >
                                {reg.ticketId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <CalendarIcon fontSize="small" color="action" />
                              {formatDate(reg.createdAt)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
};

export default ParticipantDashboard;
