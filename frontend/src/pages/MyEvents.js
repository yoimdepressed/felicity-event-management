import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  EventAvailable as EventAvailableIcon,
  ArrowBack,
  EventBusy as EventBusyIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch organizer's events
  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/events/my-events');
      
      if (response.data.success) {
        // Filter out deleted events (isActive: false)
        const activeEvents = response.data.data.filter(event => event.isActive !== false);
        setEvents(activeEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to fetch your events');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete event
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/events/${eventToDelete._id}`);
      
      if (response.data.success) {
        // Remove deleted event from state
        setEvents(events.filter(e => e._id !== eventToDelete._id));
        setDeleteDialogOpen(false);
        setEventToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.response?.data?.message || 'Failed to delete event');
      setDeleteDialogOpen(false);
    }
  };

  // Handle toggle registration
  const handleToggleRegistration = async (eventId, currentStatus) => {
    try {
      const response = await api.patch(`/events/${eventId}/toggle-registration`);
      
      if (response.data.success) {
        // Update event in state
        setEvents(events.map(e => 
          e._id === eventId 
            ? { ...e, registrationOpen: !currentStatus }
            : e
        ));
      }
    } catch (err) {
      console.error('Error toggling registration:', err);
      setError(err.response?.data?.message || 'Failed to toggle registration');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Check if event is past
  const isPastEvent = (eventEndDate) => {
    return new Date(eventEndDate) < new Date();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your events...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/organizer')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all events you've created
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Create Event Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/organizer/create-event')}
          size="large"
        >
          Create New Event
        </Button>
      </Box>

      {/* Events List */}
      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No events created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by creating your first event!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/organizer/create-event')}
          >
            Create Event
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={6} key={event._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: isPastEvent(event.eventEndDate) ? 0.7 : 1,
                }}
              >
                {/* Event Type Badge */}
                <Chip
                  label={event.eventType}
                  color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1,
                  }}
                />

                {/* Status Badge */}
                <Chip
                  label={event.status || 'Draft'}
                  size="small"
                  color={
                    event.status === 'Draft' ? 'default' :
                    event.status === 'Published' ? 'primary' :
                    event.status === 'Ongoing' ? 'warning' :
                    event.status === 'Completed' ? 'success' : 'error'
                  }
                  sx={{
                    position: 'absolute',
                    top: 52,
                    right: 16,
                    zIndex: 1,
                  }}
                />

                {/* Past Event Badge */}
                {isPastEvent(event.eventEndDate) && (
                  <Chip
                    label="Past Event"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 1,
                      bgcolor: 'grey.500',
                      color: 'white',
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, pt: 6 }}>
                  {/* Event Name */}
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {event.eventName}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2 }}
                    paragraph
                  >
                    {event.description.length > 150
                      ? `${event.description.substring(0, 150)}...`
                      : event.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Event Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.eventStartDate)} - {formatDate(event.eventEndDate)}
                      </Typography>
                    </Box>

                    {/* Venue */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.venue}
                      </Typography>
                    </Box>

                    {/* Event Type Specific Info */}
                    {event.eventType === 'Normal' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Max: {event.maxParticipants} participants
                        </Typography>
                      </Box>
                    )}

                    {event.eventType === 'Merchandise' && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Stock: {event.availableStock}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            ₹{event.price}
                          </Typography>
                        </Box>
                        {event.sizes && event.sizes.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              Sizes:
                            </Typography>
                            {event.sizes.map((size) => (
                              <Chip 
                                key={size} 
                                label={size} 
                                size="small" 
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </>
                    )}

                    {/* Registration Status */}
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={event.registrationOpen ? <EventAvailableIcon /> : <EventBusyIcon />}
                        label={event.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                        color={event.registrationOpen ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/organizer/event/${event._id}`)}
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                      title="Edit Event"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(event)}
                      title="Delete Event"
                      disabled={event.status !== 'Draft'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    color={event.registrationOpen ? 'error' : 'success'}
                    onClick={() => handleToggleRegistration(event._id, event.registrationOpen)}
                  >
                    {event.registrationOpen ? 'Close' : 'Open'} Registration
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{eventToDelete?.eventName}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyEvents;
