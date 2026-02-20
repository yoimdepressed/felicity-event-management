import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  LocalOffer as PriceIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BrowseEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState('All');
  const [eligibility, setEligibility] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followedOnly, setFollowedOnly] = useState(false);

  // Fetch trending events on mount
  useEffect(() => {
    fetchTrendingEvents();
  }, []);

  // Fetch events with filters
  useEffect(() => {
    fetchEvents();
  }, [searchQuery, eventType, eligibility, startDate, endDate, followedOnly]);

  // Fetch trending events
  const fetchTrendingEvents = async () => {
    try {
      setTrendingLoading(true);
      const response = await api.get('/events/trending');
      setTrendingEvents(response.data.data || []);
    } catch (err) {
      console.error('Error fetching trending events:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Fetch all events with filters
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query params
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (eventType !== 'All') params.eventType = eventType;
      if (eligibility !== 'All') params.eligibility = eligibility;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (followedOnly && user?.followedClubs?.length > 0) {
        params.followedClubs = JSON.stringify(user.followedClubs);
      }

      console.log('📡 Fetching events with params:', params);
      const response = await api.get('/events', { params });
      console.log('✅ Events response:', response.data);
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      console.error('Response:', err.response);
      setError(err.response?.data?.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input (debounced)
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setEventType('All');
    setEligibility('All');
    setStartDate('');
    setEndDate('');
    setFollowedOnly(false);
  };

  // Navigate to event details
  const handleViewDetails = (eventId) => {
    navigate(`/participant/event/${eventId}`);
  };

  // Format date for display
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

  // Event card component
  const EventCard = ({ event, isTrending = false }) => (
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
        border: isTrending ? '2px solid #ff6b35' : 'none',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Event Type Badge */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={event.eventType}
            size="small"
            color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
          />
          {isTrending && (
            <Chip
              icon={<TrendingIcon />}
              label="Trending"
              size="small"
              sx={{ backgroundColor: '#ff6b35', color: 'white' }}
            />
          )}
        </Box>

        {/* Event Name */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {event.eventName}
        </Typography>

        {/* Organizer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {event.organizer?.organizerName || 'Unknown'}
          </Typography>
        </Box>

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

        {/* Price */}
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
              event.registrationOpen && new Date() <= new Date(event.registrationDeadline)
                ? 'Registration Open'
                : 'Registration Closed'
            }
            size="small"
            color={
              event.registrationOpen && new Date() <= new Date(event.registrationDeadline)
                ? 'success'
                : 'default'
            }
          />
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleViewDetails(event._id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/participant')}
          variant="outlined"
        >
          Back to Home
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            Browse Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and register for events happening at IIIT
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search events by name or organizer..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          {/* Event Type */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventType}
                label="Event Type"
                onChange={(e) => setEventType(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Normal">Normal Events</MenuItem>
                <MenuItem value="Merchandise">Merchandise</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Eligibility */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Eligibility</InputLabel>
              <Select
                value={eligibility}
                label="Eligibility"
                onChange={(e) => setEligibility(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Open to All">Open to All</MenuItem>
                <MenuItem value="IIIT Students Only">IIIT Students Only</MenuItem>
                <MenuItem value="Team Event">Team Event</MenuItem>
                <MenuItem value="First Year Only">First Year Only</MenuItem>
                <MenuItem value="Final Year Only">Final Year Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Clear Filters Button */}
          <Grid item xs={12} sm={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleClearFilters}
              sx={{ height: '40px' }}
            >
              Clear
            </Button>
          </Grid>

          {/* Followed Clubs Checkbox */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={followedOnly}
                  onChange={(e) => setFollowedOnly(e.target.checked)}
                  disabled={!user?.followedClubs || user.followedClubs.length === 0}
                />
              }
              label="Show only followed clubs"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Trending Events Section */}
      {trendingEvents.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingIcon sx={{ color: '#ff6b35' }} />
            <Typography variant="h5" fontWeight="bold">
              Trending Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Last 24 hours)
            </Typography>
          </Box>

          {trendingLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#ccc',
                  borderRadius: 4,
                },
              }}
            >
              {trendingEvents.map((event) => (
                <Box key={event._id} sx={{ minWidth: 300, maxWidth: 300 }}>
                  <EventCard event={event} isTrending={true} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* All Events Section */}
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          All Events
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : events.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
            }}
          >
            <EventIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search query
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <EventCard event={event} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default BrowseEvents;
