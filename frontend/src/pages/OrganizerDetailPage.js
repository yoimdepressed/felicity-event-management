import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  LocalOffer as PriceIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrganizerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 = Upcoming, 1 = Past

  // Fetch organizer details and events
  useEffect(() => {
    fetchOrganizerDetails();
    fetchOrganizerEvents();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching organizer details for ID:', id);
      const response = await api.get(`/public/organizers/${id}`);
      console.log('✅ Organizer response:', response.data);
      setOrganizer(response.data.data);
    } catch (err) {
      console.error('❌ Error fetching organizer:', err);
      console.error('Response:', err.response);
      setError(err.response?.data?.message || 'Failed to load organizer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerEvents = async () => {
    try {
      console.log('📡 Fetching events for organizer:', id);
      const response = await api.get(`/events?organizer=${id}`);
      console.log('✅ Events response:', response.data);
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
    }
  };

  // Filter events by tab
  const getFilteredEvents = () => {
    const now = new Date();
    
    if (activeTab === 0) {
      // Upcoming events (event start date is in the future)
      return events.filter(event => new Date(event.eventStartDate) >= now);
    } else {
      // Past events (event end date is in the past)
      return events.filter(event => new Date(event.eventEndDate) < now);
    }
  };

  // Format date
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

  // Navigate to event details
  const handleViewEvent = (eventId) => {
    navigate(`/participant/event/${eventId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !organizer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Organizer not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/participant/clubs')} sx={{ mt: 2 }}>
          Back to Clubs
        </Button>
      </Container>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<BackIcon />} onClick={() => navigate('/participant/clubs')} sx={{ mb: 2 }}>
        Back to Clubs
      </Button>

      {/* Organizer Info Card */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            {/* Category Badge */}
            {organizer.category && (
              <Box sx={{ mb: 1 }}>
                <Chip
                  icon={<CategoryIcon />}
                  label={organizer.category}
                  color="primary"
                />
              </Box>
            )}

            {/* Organizer Name */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {organizer.organizerName}
            </Typography>

            {/* Contact Email */}
            {organizer.contactEmail && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon color="action" />
                <Typography variant="body1" color="text.secondary">
                  {organizer.contactEmail}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Description */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DescriptionIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              About
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {organizer.description || 'No description available'}
          </Typography>
        </Box>
      </Paper>

      {/* Events Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <EventIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Events
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Upcoming Events" />
          <Tab label="Past Events" />
        </Tabs>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
            }}
          >
            <EventIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {activeTab === 0 ? 'upcoming' : 'past'} events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This organizer has no {activeTab === 0 ? 'upcoming' : 'past'} events at the moment
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Event Type Badge */}
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={event.eventType}
                        size="small"
                        color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
                      />
                    </Box>

                    {/* Event Name */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {event.eventName}
                    </Typography>

                    {/* Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.eventStartDate)}
                      </Typography>
                    </Box>

                    {/* Venue */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.venue}
                      </Typography>
                    </Box>

                    {/* Price (Merchandise) */}
                    {event.eventType === 'Merchandise' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <PriceIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          ₹{event.price || 0}
                        </Typography>
                      </Box>
                    )}

                    {/* Status */}
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={
                          activeTab === 0
                            ? event.registrationOpen && new Date() <= new Date(event.registrationDeadline)
                              ? 'Registration Open'
                              : 'Registration Closed'
                            : 'Event Completed'
                        }
                        size="small"
                        color={
                          activeTab === 0
                            ? event.registrationOpen && new Date() <= new Date(event.registrationDeadline)
                              ? 'success'
                              : 'default'
                            : 'default'
                        }
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleViewEvent(event._id)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default OrganizerDetailPage;
