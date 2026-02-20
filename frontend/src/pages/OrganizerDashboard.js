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
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add,
  Event as EventIcon,
  ChevronLeft,
  ChevronRight,
  Visibility,
  Edit,
  TrendingUp,
  People,
  AttachMoney,
  CheckCircle,
  Assessment,
  CalendarToday,
  Inventory,
} from '@mui/icons-material';
import api from '../services/api';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    totalSales: 0,
    averageAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const itemsPerPage = 3; // Show 3 cards at a time

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all events
      const eventsResponse = await api.get('/events/my-events');

      if (eventsResponse.data.success) {
        const allEvents = eventsResponse.data.data.filter(event => event.isActive !== false);
        setEvents(allEvents);

        // Filter completed events (ended events)
        const now = new Date();
        const completed = allEvents.filter(event =>
          new Date(event.eventEndDate) < now
        );
        setCompletedEvents(completed);

        // Calculate analytics for completed events
        calculateAnalytics(completed);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (completedEvts) => {
    let totalRegs = 0;
    let totalRev = 0;
    let totalSales = 0;

    completedEvts.forEach(event => {
      totalRegs += event.currentRegistrations || 0;

      if (event.eventType === 'Merchandise') {
        totalSales += event.currentRegistrations || 0;
        totalRev += (event.price || 0) * (event.currentRegistrations || 0);
      } else {
        totalRev += (event.price || 0) * (event.currentRegistrations || 0);
      }
    });

    const avgAttendance = completedEvts.length > 0
      ? Math.round(totalRegs / completedEvts.length)
      : 0;

    setAnalytics({
      totalRegistrations: totalRegs,
      totalRevenue: totalRev,
      totalSales: totalSales,
      averageAttendance: avgAttendance,
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);
    const regDeadline = new Date(event.registrationDeadline);

    if (!event.isApproved) return { label: 'Draft', color: 'default' };
    if (endDate < now) return { label: 'Closed', color: 'error' };
    if (startDate <= now && endDate >= now) return { label: 'Ongoing', color: 'success' };
    if (regDeadline < now) return { label: 'Registration Closed', color: 'warning' };
    return { label: 'Published', color: 'primary' };
  };

  const handlePrevious = () => {
    setCarouselIndex(prev => Math.max(0, prev - itemsPerPage));
  };

  const handleNext = () => {
    setCarouselIndex(prev =>
      Math.min(events.length - itemsPerPage, prev + itemsPerPage)
    );
  };

  const visibleEvents = events.slice(carouselIndex, carouselIndex + itemsPerPage);
  const canGoPrevious = carouselIndex > 0;
  const canGoNext = carouselIndex + itemsPerPage < events.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.organizerName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your events and track performance
          </Typography>
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

        {!loading && !error && (
          <>
            {/* Event Analytics Section */}
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="600">
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Event Analytics
                </Typography>
                <Chip
                  label={`${completedEvents.length} Completed Events`}
                  color="success"
                  icon={<CheckCircle />}
                />
              </Box>

              <Grid container spacing={3}>
                {/* Total Registrations */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: 3,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {analytics.totalRegistrations}
                          </Typography>
                          <Typography variant="body2">
                            Total Registrations
                          </Typography>
                        </Box>
                        <People sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Revenue */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      boxShadow: 3,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h4" fontWeight="bold" gutterBottom>
                            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2">
                            Total Revenue
                          </Typography>
                        </Box>
                        <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Sales (Merchandise) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      boxShadow: 3,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {analytics.totalSales}
                          </Typography>
                          <Typography variant="body2">
                            Merchandise Sales
                          </Typography>
                        </Box>
                        <Inventory sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Average Attendance */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      color: 'white',
                      boxShadow: 3,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {analytics.averageAttendance}
                          </Typography>
                          <Typography variant="body2">
                            Avg. Attendance
                          </Typography>
                        </Box>
                        <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Analytics Details */}
              {completedEvents.length > 0 && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Completed Events Breakdown
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      {completedEvents.map((event) => (
                        <Grid item xs={12} key={event._id}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box flex={1}>
                                <Typography variant="body1" fontWeight="500">
                                  {event.eventName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(event.eventStartDate)} - {formatDate(event.eventEndDate)}
                                </Typography>
                              </Box>
                              <Box display="flex" gap={3} alignItems="center">
                                <Box textAlign="center">
                                  <Typography variant="h6" color="primary">
                                    {event.currentRegistrations || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Registrations
                                  </Typography>
                                </Box>
                                <Box textAlign="center">
                                  <Typography variant="h6" color="success.main">
                                    ₹{((event.price || 0) * (event.currentRegistrations || 0)).toLocaleString('en-IN')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Revenue
                                  </Typography>
                                </Box>
                                <Chip
                                  label={event.eventType}
                                  size="small"
                                  color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
                                />
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {completedEvents.length === 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  No completed events yet. Analytics will appear here once your events are finished.
                </Alert>
              )}
            </Box>

            {/* Events Carousel Section */}
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight="600">
                  <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your Events
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/organizer/create-event')}
                  >
                    Create Event
                  </Button>
                </Box>
              </Box>

              {events.length === 0 ? (
                <Card>
                  <CardContent>
                    <Box textAlign="center" py={8}>
                      <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No Events Yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Create your first event to get started!
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/organizer/create-event')}
                      >
                        Create First Event
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Box position="relative">
                  {/* Carousel Navigation */}
                  <Box display="flex" alignItems="center" gap={2}>
                    <IconButton
                      onClick={handlePrevious}
                      disabled={!canGoPrevious}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': { bgcolor: 'grey.300' },
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>

                    {/* Event Cards */}
                    <Grid container spacing={3} flex={1}>
                      {visibleEvents.map((event) => {
                        const status = getEventStatus(event);
                        return (
                          <Grid item xs={12} md={4} key={event._id}>
                            <Card
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: 3,
                                '&:hover': {
                                  boxShadow: 6,
                                  transform: 'translateY(-4px)',
                                  transition: 'all 0.3s',
                                },
                              }}
                            >
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                  <Chip
                                    label={status.label}
                                    color={status.color}
                                    size="small"
                                  />
                                  <Chip
                                    label={event.eventType}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>

                                <Typography variant="h6" gutterBottom sx={{ minHeight: 48 }}>
                                  {event.eventName}
                                </Typography>

                                <Box mb={2}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <CalendarToday sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                    {formatDate(event.eventStartDate)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <People sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                    {event.currentRegistrations || 0} registrations
                                    {event.maxParticipants && ` / ${event.maxParticipants}`}
                                  </Typography>
                                  {event.price > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                      <AttachMoney sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                      ₹{event.price}
                                    </Typography>
                                  )}
                                </Box>

                                <Box>
                                  <Chip label={event.eligibility} size="small" sx={{ mr: 1 }} />
                                  {event.tags && event.tags.slice(0, 2).map((tag, idx) => (
                                    <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ mr: 1 }} />
                                  ))}
                                </Box>
                              </CardContent>

                              <Divider />

                              <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                                <Button
                                  size="small"
                                  startIcon={<Visibility />}
                                  component={Link}
                                  to={`/organizer/event/${event._id}`}
                                >
                                  View
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                                >
                                  Edit
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>

                    <IconButton
                      onClick={handleNext}
                      disabled={!canGoNext}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': { bgcolor: 'grey.300' },
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Box>

                  {/* Carousel Indicator */}
                  <Box textAlign="center" mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Showing {carouselIndex + 1} - {Math.min(carouselIndex + itemsPerPage, events.length)} of {events.length} events
                    </Typography>
                  </Box>

                  {/* View All Button */}
                  <Box textAlign="center" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/organizer/my-events')}
                    >
                      View All Events
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default OrganizerDashboard;
