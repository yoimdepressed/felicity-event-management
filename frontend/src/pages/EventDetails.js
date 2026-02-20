import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  LocalOffer as PriceIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Category as CategoryIcon,
  Label as TagIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import FeedbackSection from '../components/FeedbackSection';
import AddToCalendar from '../components/AddToCalendar';
import DiscussionForum from '../components/DiscussionForum';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();


  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Registration form state
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState(['']);
  const [customFormData, setCustomFormData] = useState({});
  const [merchandiseData, setMerchandiseData] = useState({
    size: '',
    color: '',
    quantity: 1,
  });

  // Fetch event details
  useEffect(() => {
    fetchEventDetails();
    checkIfRegistered();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);

      // Initialize custom form data
      if (response.data.data.customRegistrationForm) {
        const initialFormData = {};
        response.data.data.customRegistrationForm.forEach(field => {
          initialFormData[field.fieldName] = '';
        });
        setCustomFormData(initialFormData);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfRegistered = async () => {
    try {
      const response = await api.get('/registrations/my');
      const registrations = response.data.data || [];
      // Only consider active registrations (Confirmed or Pending), not Cancelled or Rejected
      const isRegistered = registrations.some(reg =>
        reg.event._id === id &&
        (reg.registrationStatus === 'Confirmed' || reg.registrationStatus === 'Pending')
      );
      setAlreadyRegistered(isRegistered);
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  // Check if registration is allowed
  const getRegistrationStatus = () => {
    if (!event) return { allowed: false, reason: 'Loading...' };

    if (alreadyRegistered) {
      return { allowed: false, reason: 'Already Registered', color: 'info' };
    }

    const now = new Date();
    const deadline = new Date(event.registrationDeadline);

    if (now > deadline) {
      return { allowed: false, reason: 'Registration Deadline Passed', color: 'error' };
    }

    if (!event.registrationOpen) {
      return { allowed: false, reason: 'Registration Closed', color: 'error' };
    }

    // Check capacity for Normal events
    if (event.eventType === 'Normal' && event.maxParticipants) {
      if (event.currentRegistrations >= event.maxParticipants) {
        return { allowed: false, reason: 'Event Full - Capacity Reached', color: 'error' };
      }
    }

    // Check stock for Merchandise
    if (event.eventType === 'Merchandise') {
      if (event.availableStock !== null && event.availableStock <= 0) {
        return { allowed: false, reason: 'Out of Stock', color: 'error' };
      }
    }

    return { allowed: true, reason: 'Register Now', color: 'success' };
  };

  // Handle registration dialog open
  const handleOpenRegistration = () => {
    setRegistrationDialog(true);
    setRegistrationError('');
    setRegistrationSuccess(false);
  };

  // Handle registration submit
  const handleSubmitRegistration = async () => {
    try {
      setRegistering(true);
      setRegistrationError('');

      // Build registration payload
      const payload = {
        eventId: id,
      };

      // Add team info if team event
      if (event.eligibility === 'Team Event') {
        if (!teamName.trim()) {
          setRegistrationError('Team name is required');
          setRegistering(false);
          return;
        }
        payload.teamName = teamName;
        payload.teamMembers = teamMembers.filter(m => m.trim());
      }

      // Add custom form data for Normal events
      if (event.eventType === 'Normal' && event.customRegistrationForm?.length > 0) {
        const formDataArray = [];
        for (const field of event.customRegistrationForm) {
          if (field.required && !customFormData[field.fieldName]) {
            setRegistrationError(`${field.fieldLabel} is required`);
            setRegistering(false);
            return;
          }
          formDataArray.push({
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            answer: customFormData[field.fieldName] || '',
          });
        }
        payload.customFormData = formDataArray;
      }

      // Add merchandise data
      if (event.eventType === 'Merchandise') {
        if (!merchandiseData.size && event.sizes?.length > 0) {
          setRegistrationError('Please select a size');
          setRegistering(false);
          return;
        }
        if (!merchandiseData.color && event.colors?.length > 0) {
          setRegistrationError('Please select a color');
          setRegistering(false);
          return;
        }
        if (merchandiseData.quantity < 1) {
          setRegistrationError('Quantity must be at least 1');
          setRegistering(false);
          return;
        }
        payload.merchandiseDetails = merchandiseData;
      }

      // Submit registration
      console.log('📡 Submitting registration with payload:', payload);
      const response = await api.post('/registrations', payload);
      console.log('✅ Registration successful:', response.data);

      setRegistrationSuccess(true);
      setAlreadyRegistered(true); // Update registration status
      setTimeout(() => {
        setRegistrationDialog(false);
        navigate('/participant/my-events');
      }, 2000);
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      setRegistrationError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate capacity percentage
  const getCapacityPercentage = () => {
    if (!event) return 0;
    if (event.eventType === 'Normal' && event.maxParticipants) {
      return (event.currentRegistrations / event.maxParticipants) * 100;
    }
    if (event.eventType === 'Merchandise' && event.availableStock !== null) {
      const totalStock = event.availableStock + event.currentRegistrations;
      return ((totalStock - event.availableStock) / totalStock) * 100;
    }
    return 0;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Event not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/participant/browse-events')} sx={{ mt: 2 }}>
          Back to Browse Events
        </Button>
      </Container>
    );
  }

  const registrationStatus = getRegistrationStatus();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<BackIcon />} onClick={() => navigate('/participant/browse-events')} sx={{ mb: 2 }}>
        Back to Browse Events
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={event.eventType}
              color={event.eventType === 'Normal' ? 'primary' : 'secondary'}
            />
            <Chip
              label={event.eligibility}
              variant="outlined"
            />
          </Box>

          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {event.eventName}
          </Typography>

          {/* Organizer Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon color="action" />
              <Typography variant="body1">
                {event.organizer?.organizerName || 'Unknown'}
              </Typography>
            </Box>
            {event.organizer?.category && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CategoryIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {event.organizer.category}
                </Typography>
              </Box>
            )}
            {event.organizer?.contactEmail && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {event.organizer.contactEmail}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DescriptionIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Description
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {event.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Event Details Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Start Date */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="primary" />
                <Typography variant="h6">Event Start</Typography>
              </Box>
              <Typography variant="body1">{formatDate(event.eventStartDate)}</Typography>
            </Paper>
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimeIcon color="primary" />
                <Typography variant="h6">Event End</Typography>
              </Box>
              <Typography variant="body1">{formatDate(event.eventEndDate)}</Typography>
            </Paper>
          </Grid>

          {/* Registration Deadline */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="h6">Registration Deadline</Typography>
              </Box>
              <Typography variant="body1">{formatDate(event.registrationDeadline)}</Typography>
            </Paper>
          </Grid>

          {/* Venue */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="primary" />
                <Typography variant="h6">Venue</Typography>
              </Box>
              <Typography variant="body1">{event.venue}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Capacity/Stock Status */}
        {((event.eventType === 'Normal' && event.maxParticipants) ||
          (event.eventType === 'Merchandise' && event.availableStock !== null)) && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">
                  {event.eventType === 'Normal' ? 'Capacity Status' : 'Stock Availability'}
                </Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">
                    {event.eventType === 'Normal'
                      ? `${event.currentRegistrations} / ${event.maxParticipants} registered`
                      : `${event.availableStock} units available`}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {Math.round(getCapacityPercentage())}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getCapacityPercentage()}
                  color={getCapacityPercentage() > 80 ? 'error' : 'primary'}
                />
              </Paper>
            </Box>
          )}

        {/* Price (Merchandise) */}
        {event.eventType === 'Merchandise' && (
          <Box sx={{ mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PriceIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">
                  Price: ₹{event.price || 0}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TagIcon color="primary" />
              <Typography variant="h6">Tags</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {event.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Custom Registration Form Preview */}
        {event.eventType === 'Normal' && event.customRegistrationForm && event.customRegistrationForm.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Registration Form Fields
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {event.customRegistrationForm.map((field, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                  • {field.fieldLabel} {field.required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
              ))}
            </Paper>
          </Box>
        )}

        {/* Size & Color Options (Merchandise) */}
        {event.eventType === 'Merchandise' && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              {event.sizes && event.sizes.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Available Sizes</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {event.sizes.map((size, index) => (
                      <Chip key={index} label={size} />
                    ))}
                  </Box>
                </Grid>
              )}
              {event.colors && event.colors.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Available Colors</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {event.colors.map((color, index) => (
                      <Chip key={index} label={color} />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Registration Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={!registrationStatus.allowed || registering}
            onClick={handleOpenRegistration}
            color={registrationStatus.color}
            startIcon={registrationStatus.allowed ? <CheckIcon /> : <CancelIcon />}
            sx={{ minWidth: 250, py: 1.5 }}
          >
            {registrationStatus.reason}
          </Button>
          {!registrationStatus.allowed && registrationStatus.reason !== 'Already Registered' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Registration is currently not available
            </Typography>
          )}

          {/* Add to Calendar - shown when registered */}
          {alreadyRegistered && (
            <Box sx={{ mt: 2 }}>
              <AddToCalendar eventId={id} eventName={event?.eventName} />
            </Box>
          )}
        </Box>

        {/* Anonymous Feedback Section - shown when registered */}
        {alreadyRegistered && (
          <FeedbackSection eventId={id} isOrganizer={false} />
        )}

        {/* Discussion Forum - shown when registered */}
        {alreadyRegistered && (
          <DiscussionForum eventId={id} />
        )}
      </Paper>

      {/* Registration Dialog */}
      <Dialog
        open={registrationDialog}
        onClose={() => !registering && setRegistrationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {event?.eventType === 'Normal' ? 'Register for Event' : 'Purchase Merchandise'}
        </DialogTitle>
        <DialogContent>
          {!event ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Event information not available. Please try again.
            </Alert>
          ) : registrationSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting to My Events...
            </Alert>
          ) : (
            <>
              {registrationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {registrationError}
                </Alert>
              )}

              {/* Team Event Fields */}
              {event.eligibility === 'Team Event' && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Team Name *"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  {teamMembers.map((member, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      label={`Team Member ${index + 1}`}
                      value={member}
                      onChange={(e) => {
                        const newMembers = [...teamMembers];
                        newMembers[index] = e.target.value;
                        setTeamMembers(newMembers);
                      }}
                      sx={{ mb: 1 }}
                    />
                  ))}
                  <Button
                    size="small"
                    onClick={() => setTeamMembers([...teamMembers, ''])}
                  >
                    + Add Team Member
                  </Button>
                </Box>
              )}

              {/* Custom Form Fields (Normal Events) */}
              {event.eventType === 'Normal' && event.customRegistrationForm?.map((field, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  {field.fieldType === 'text' && (
                    <TextField
                      fullWidth
                      label={field.fieldLabel}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={customFormData[field.fieldName] || ''}
                      onChange={(e) =>
                        setCustomFormData({ ...customFormData, [field.fieldName]: e.target.value })
                      }
                    />
                  )}
                  {field.fieldType === 'number' && (
                    <TextField
                      fullWidth
                      type="number"
                      label={field.fieldLabel}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={customFormData[field.fieldName] || ''}
                      onChange={(e) =>
                        setCustomFormData({ ...customFormData, [field.fieldName]: e.target.value })
                      }
                    />
                  )}
                  {field.fieldType === 'textarea' && (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={field.fieldLabel}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={customFormData[field.fieldName] || ''}
                      onChange={(e) =>
                        setCustomFormData({ ...customFormData, [field.fieldName]: e.target.value })
                      }
                    />
                  )}
                  {field.fieldType === 'dropdown' && (
                    <FormControl fullWidth>
                      <InputLabel>{field.fieldLabel}</InputLabel>
                      <Select
                        value={customFormData[field.fieldName] || ''}
                        label={field.fieldLabel}
                        required={field.required}
                        onChange={(e) =>
                          setCustomFormData({ ...customFormData, [field.fieldName]: e.target.value })
                        }
                      >
                        {field.options?.map((option, idx) => (
                          <MenuItem key={idx} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {field.fieldType === 'checkbox' && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={customFormData[field.fieldName] === 'true'}
                          onChange={(e) =>
                            setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.checked ? 'true' : 'false',
                            })
                          }
                        />
                      }
                      label={field.fieldLabel}
                    />
                  )}
                </Box>
              ))}

              {/* Merchandise Fields */}
              {event.eventType === 'Merchandise' && (
                <>
                  {event.sizes && event.sizes.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Size *</InputLabel>
                      <Select
                        value={merchandiseData.size}
                        label="Size *"
                        onChange={(e) =>
                          setMerchandiseData({ ...merchandiseData, size: e.target.value })
                        }
                      >
                        {event.sizes.map((size) => (
                          <MenuItem key={size} value={size}>
                            {size}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {event.colors && event.colors.length > 0 && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Color *</InputLabel>
                      <Select
                        value={merchandiseData.color}
                        label="Color *"
                        onChange={(e) =>
                          setMerchandiseData({ ...merchandiseData, color: e.target.value })
                        }
                      >
                        {event.colors.map((color) => (
                          <MenuItem key={color} value={color}>
                            {color}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity *"
                    value={merchandiseData.quantity}
                    onChange={(e) =>
                      setMerchandiseData({
                        ...merchandiseData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    inputProps={{ min: 1, max: event.purchaseLimitPerParticipant || 999 }}
                    sx={{ mb: 2 }}
                  />

                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total: ₹{(event.price || 0) * merchandiseData.quantity}
                    </Typography>
                  </Paper>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationDialog(false)} disabled={registering}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRegistration}
            variant="contained"
            disabled={registering || registrationSuccess}
          >
            {registering ? 'Submitting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetails;
