import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarToday,
  People,
  CheckCircle,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import api from '../services/api';

const OrganizerOngoingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOngoingEvents();
  }, []);

  const fetchOngoingEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/events/my-events');
      
      if (response.data.success) {
        const now = new Date();
        
        // Filter for ongoing events (started but not ended, and active)
        const ongoingEvents = response.data.data.filter(event => {
          const startDate = new Date(event.eventStartDate);
          const endDate = new Date(event.eventEndDate);
          return event.isActive !== false && startDate <= now && endDate >= now;
        });
        
        setEvents(ongoingEvents);
      }
    } catch (err) {
      console.error('Error fetching ongoing events:', err);
      setError(err.response?.data?.message || 'Failed to fetch ongoing events');
    } finally {
      setLoading(false);
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

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/organizer')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" gutterBottom>
              Ongoing Events
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Events currently in progress
            </Typography>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* No Ongoing Events */}
        {!loading && !error && events.length === 0 && (
          <Card>
            <CardContent>
              <Box textAlign="center" py={8}>
                <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Ongoing Events
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  You don't have any events currently in progress.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<EventIcon />}
                  onClick={() => navigate('/organizer/my-events')}
                >
                  View All Events
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Ongoing Events Table */}
        {!loading && !error && events.length > 0 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  {events.length} Event{events.length !== 1 ? 's' : ''} in Progress
                </Typography>
                <Chip
                  icon={<CheckCircle />}
                  label="Live"
                  color="success"
                  size="small"
                />
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Event Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Started</strong></TableCell>
                      <TableCell><strong>Ends</strong></TableCell>
                      <TableCell><strong>Registrations</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <EventIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={500}>
                              {event.eventName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.eventType}
                            size="small"
                            color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(event.eventStartDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(event.eventEndDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <People fontSize="small" color="action" />
                            <Typography variant="body2">
                              {event.currentRegistrations || 0}
                              {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<CheckCircle />}
                            label="Ongoing"
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            to={`/organizer/event/${event._id}`}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Event Cards Grid (Alternative View) */}
        {!loading && !error && events.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Event Cards
            </Typography>
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} md={6} key={event._id}>
                  <Card
                    sx={{
                      border: '2px solid',
                      borderColor: 'success.main',
                      boxShadow: 3,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Typography variant="h6" gutterBottom>
                          {event.eventName}
                        </Typography>
                        <Chip
                          icon={<CheckCircle />}
                          label="Live"
                          size="small"
                          color="success"
                        />
                      </Box>

                      <Box mb={2}>
                        <Chip
                          label={event.eventType}
                          size="small"
                          color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={event.eligibility}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" mb={2}>
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Started: {formatDate(event.eventStartDate)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" mb={2}>
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Ends: {formatDate(event.eventEndDate)}
                      </Typography>

                      <Typography variant="body2" mb={2}>
                        <People fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        <strong>{event.currentRegistrations || 0}</strong> registrations
                        {event.maxParticipants && ` (max: ${event.maxParticipants})`}
                      </Typography>

                      <Button
                        fullWidth
                        variant="contained"
                        component={Link}
                        to={`/organizer/event/${event._id}`}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
};

export default OrganizerOngoingEvents;
