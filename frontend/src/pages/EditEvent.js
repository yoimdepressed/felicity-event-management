import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FormBuilder from '../components/FormBuilder';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Grid,
  InputAdornment,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Event as EventIcon,
  Description,
  LocationOn,
  CalendarToday,
  People,
  AttachMoney,
  Inventory,
  ArrowBack,
  CheckCircle,
  Lock,
  LockOpen,
  Publish,
  Cancel,
  CheckBox,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'Normal',
    description: '',
    venue: '',
    eventStartDate: null,
    eventEndDate: null,
    registrationDeadline: null,
    maxParticipants: '',
    price: '',
    availableStock: '',
    sizes: [],
    colors: [],
    purchaseLimitPerParticipant: '',
    eligibility: 'Open to All',
    tags: [],
    customRegistrationForm: [],
    status: 'Draft',
  });

  // Available options
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple'];
  const availableTags = ['Workshop', 'Competition', 'Cultural', 'Technical', 'Sports', 'Gaming', 'Music', 'Dance', 'Food', 'Art'];

  const [tagInput, setTagInput] = useState('');

  // Fetch event data and permissions
  useEffect(() => {
    fetchEventAndPermissions();
  }, [id]);

  const fetchEventAndPermissions = async () => {
    try {
      setFetchingEvent(true);

      // Fetch event details
      const eventResponse = await api.get(`/events/${id}`);
      const event = eventResponse.data.data;

      // Fetch permissions
      const permissionsResponse = await api.get(`/events/${id}/permissions`);
      setPermissions(permissionsResponse.data.data.permissions);

      // Populate form
      setFormData({
        eventName: event.eventName || '',
        eventType: event.eventType || 'Normal',
        description: event.description || '',
        venue: event.venue || '',
        eventStartDate: event.eventStartDate ? new Date(event.eventStartDate) : null,
        eventEndDate: event.eventEndDate ? new Date(event.eventEndDate) : null,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : null,
        maxParticipants: event.maxParticipants || '',
        price: event.price || '',
        availableStock: event.availableStock || '',
        sizes: event.sizes || [],
        colors: event.colors || [],
        purchaseLimitPerParticipant: event.purchaseLimitPerParticipant || '',
        eligibility: event.eligibility || 'Open to All',
        tags: event.tags || [],
        customRegistrationForm: event.customRegistrationForm || [],
        status: event.status || 'Draft',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
    } finally {
      setFetchingEvent(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
    setError('');
  };

  const handleSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleAddCustomTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.eventName || !formData.description || !formData.venue) {
        throw new Error('Please fill all required fields');
      }

      if (!formData.eventStartDate || !formData.eventEndDate || !formData.registrationDeadline) {
        throw new Error('Please select all dates');
      }

      // Date validation
      const startDate = new Date(formData.eventStartDate);
      const endDate = new Date(formData.eventEndDate);
      const deadline = new Date(formData.registrationDeadline);

      if (endDate < startDate) {
        throw new Error('Event end date must be after start date');
      }

      if (deadline >= startDate) {
        throw new Error('Registration deadline must be before event start date');
      }

      // Prepare update data based on permissions
      let updateData = {};

      if (permissions.editableFields === 'all') {
        // Draft - can update everything
        updateData = {
          eventName: formData.eventName,
          eventType: formData.eventType,
          description: formData.description,
          venue: formData.venue,
          eventStartDate: formData.eventStartDate.toISOString(),
          eventEndDate: formData.eventEndDate.toISOString(),
          registrationDeadline: formData.registrationDeadline.toISOString(),
          eligibility: formData.eligibility,
          tags: formData.tags,
        };

        if (formData.eventType === 'Normal') {
          if (formData.maxParticipants) {
            updateData.maxParticipants = parseInt(formData.maxParticipants);
          }
          updateData.price = 0;
          updateData.customRegistrationForm = formData.customRegistrationForm;
        } else {
          updateData.price = parseFloat(formData.price);
          updateData.availableStock = parseInt(formData.availableStock);
          updateData.sizes = formData.sizes;
          updateData.colors = formData.colors;
          if (formData.purchaseLimitPerParticipant) {
            updateData.purchaseLimitPerParticipant = parseInt(formData.purchaseLimitPerParticipant);
          }
        }
      } else {
        // Published - only update allowed fields
        if (permissions.editableFields.includes('description')) {
          updateData.description = formData.description;
        }
        if (permissions.editableFields.includes('registrationDeadline')) {
          updateData.registrationDeadline = formData.registrationDeadline.toISOString();
        }
        if (permissions.editableFields.includes('maxParticipants') && formData.maxParticipants) {
          updateData.maxParticipants = parseInt(formData.maxParticipants);
        }
        if (permissions.editableFields.includes('availableStock') && formData.availableStock) {
          updateData.availableStock = parseInt(formData.availableStock);
        }
        if (permissions.editableFields.includes('tags')) {
          updateData.tags = formData.tags;
        }
      }

      // Make API call
      const response = await api.put(`/events/${id}`, updateData);

      if (response.data.success) {
        setSuccess('Event updated successfully!');
        setTimeout(() => {
          navigate('/organizer/my-events');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/events/${id}/publish`);
      if (response.data.success) {
        setSuccess('Event published successfully!');
        setShowPublishDialog(false);
        setTimeout(() => {
          navigate('/organizer/my-events');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/events/${id}/complete`);
      if (response.data.success) {
        setSuccess('Event marked as completed!');
        setShowCompleteDialog(false);
        setTimeout(() => {
          navigate('/organizer/my-events');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/events/${id}/close`);
      if (response.data.success) {
        setSuccess('Event closed successfully!');
        setShowCloseDialog(false);
        setTimeout(() => {
          navigate('/organizer/my-events');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close event');
    } finally {
      setLoading(false);
    }
  };

  const isFieldEditable = (fieldName) => {
    if (!permissions) return false;
    if (permissions.editableFields === 'all') return true;
    return permissions.editableFields.includes(fieldName);
  };

  if (fetchingEvent) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading event details...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/organizer/my-events')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Edit Event
            </Typography>
            <Chip
              label={formData.status}
              size="small"
              color={
                formData.status === 'Draft' ? 'default' :
                  formData.status === 'Published' ? 'primary' :
                    formData.status === 'Ongoing' ? 'warning' :
                      formData.status === 'Completed' ? 'success' : 'error'
              }
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        {/* Status Action Buttons */}
        <Box display="flex" gap={1}>
          {permissions?.canPublish && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Publish />}
              onClick={() => setShowPublishDialog(true)}
              size="small"
            >
              Publish
            </Button>
          )}
          {permissions?.canMarkComplete && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckBox />}
              onClick={() => setShowCompleteDialog(true)}
              size="small"
            >
              Complete
            </Button>
          )}
          {permissions?.canClose && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setShowCloseDialog(true)}
              size="small"
            >
              Close
            </Button>
          )}
        </Box>
      </Box>

      {/* Permissions Info */}
      {permissions && (
        <Alert
          severity={permissions.canEdit ? "info" : "warning"}
          sx={{ mb: 3 }}
          icon={permissions.canEdit ? <LockOpen /> : <Lock />}
        >
          <strong>Edit Permissions:</strong> {permissions.restrictions || 'All fields can be edited'}
        </Alert>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          icon={<CheckCircle />}
        >
          {success}
        </Alert>
      )}

      {/* Form */}
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Event Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name *"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  disabled={!isFieldEditable('eventName')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Event Type */}
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isFieldEditable('eventType')}>
                  <FormLabel sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                    Event Type *
                  </FormLabel>
                  <RadioGroup
                    row
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="Normal"
                      control={<Radio />}
                      label="Normal Event"
                    />
                    <FormControlLabel
                      value="Merchandise"
                      control={<Radio />}
                      label="Merchandise"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!isFieldEditable('description')}
                  multiline
                  rows={4}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Venue */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Venue *"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  disabled={!isFieldEditable('venue')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} sm={4}>
                <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Event Start Date *
                </FormLabel>
                <DatePicker
                  selected={formData.eventStartDate}
                  onChange={(date) => handleDateChange('eventStartDate', date)}
                  showTimeSelect
                  dateFormat="Pp"
                  disabled={!isFieldEditable('eventStartDate')}
                  customInput={
                    <TextField
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      }}
                    />
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Event End Date *
                </FormLabel>
                <DatePicker
                  selected={formData.eventEndDate}
                  onChange={(date) => handleDateChange('eventEndDate', date)}
                  showTimeSelect
                  dateFormat="Pp"
                  disabled={!isFieldEditable('eventEndDate')}
                  customInput={
                    <TextField
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      }}
                    />
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Registration Deadline *
                </FormLabel>
                <DatePicker
                  selected={formData.registrationDeadline}
                  onChange={(date) => handleDateChange('registrationDeadline', date)}
                  showTimeSelect
                  dateFormat="Pp"
                  disabled={!isFieldEditable('registrationDeadline')}
                  customInput={
                    <TextField
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      }}
                    />
                  }
                />
              </Grid>

              {/* Type-specific fields */}
              {formData.eventType === 'Normal' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Participants (leave empty for unlimited)"
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    disabled={!isFieldEditable('maxParticipants')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <People />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}

              {formData.eventType === 'Merchandise' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price *"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      disabled={!isFieldEditable('price')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Available Stock *"
                      name="availableStock"
                      type="number"
                      value={formData.availableStock}
                      onChange={handleChange}
                      disabled={!isFieldEditable('availableStock')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormLabel sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                      Sizes *
                    </FormLabel>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {availableSizes.map((size) => (
                        <Chip
                          key={size}
                          label={size}
                          onClick={() => isFieldEditable('sizes') && handleSizeToggle(size)}
                          color={formData.sizes.includes(size) ? 'primary' : 'default'}
                          disabled={!isFieldEditable('sizes')}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <FormLabel sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                      Colors *
                    </FormLabel>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {availableColors.map((color) => (
                        <Chip
                          key={color}
                          label={color}
                          onClick={() => isFieldEditable('colors') && handleColorToggle(color)}
                          color={formData.colors.includes(color) ? 'primary' : 'default'}
                          disabled={!isFieldEditable('colors')}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Purchase Limit Per Participant (optional)"
                      name="purchaseLimitPerParticipant"
                      type="number"
                      value={formData.purchaseLimitPerParticipant}
                      onChange={handleChange}
                      disabled={!isFieldEditable('purchaseLimitPerParticipant')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <People />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Eligibility */}
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isFieldEditable('eligibility')}>
                  <FormLabel sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                    Eligibility *
                  </FormLabel>
                  <RadioGroup
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="Open to All" control={<Radio />} label="Open to All" />
                    <FormControlLabel value="IIIT Students Only" control={<Radio />} label="IIIT Students Only" />
                    <FormControlLabel value="Team Event" control={<Radio />} label="Team Event" />
                    <FormControlLabel value="First Year Only" control={<Radio />} label="First Year Only" />
                    <FormControlLabel value="Final Year Only" control={<Radio />} label="Final Year Only" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <FormLabel sx={{ mb: 1, fontWeight: 'bold', display: 'block' }}>
                  Tags (Select or add custom)
                </FormLabel>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => isFieldEditable('tags') && handleTagToggle(tag)}
                      color={formData.tags.includes(tag) ? 'primary' : 'default'}
                      disabled={!isFieldEditable('tags')}
                    />
                  ))}
                </Box>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Add custom tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    disabled={!isFieldEditable('tags')}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddCustomTag}
                    disabled={!isFieldEditable('tags')}
                  >
                    Add
                  </Button>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => isFieldEditable('tags') && handleRemoveTag(tag)}
                      color="primary"
                      disabled={!isFieldEditable('tags')}
                    />
                  ))}
                </Box>
              </Grid>

              <Divider sx={{ my: 3, width: '100%' }} />

              {/* Custom Registration Form Builder - Only for Normal Events */}
              {formData.eventType === 'Normal' && (
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ bgcolor: 'grey.50' }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" fontWeight={600}>
                          Custom Registration Form
                        </Typography>
                        {formData.formLocked && (
                          <Chip
                            icon={<Lock />}
                            label="Locked"
                            color="error"
                            size="small"
                          />
                        )}
                        {!formData.formLocked && (
                          <Chip
                            icon={<LockOpen />}
                            label="Editable"
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormBuilder
                        eventId={id}
                        onSave={fetchEventAndPermissions}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}

              <Divider sx={{ my: 3, width: '100%' }} />

              {/* Submit Buttons */}
              {permissions?.canEdit && (
                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      fullWidth
                      sx={{ py: 1.5, fontWeight: 600 }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={() => navigate('/organizer/my-events')}
                      disabled={loading}
                      sx={{ py: 1.5, fontWeight: 600, minWidth: 120 }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)}>
        <DialogTitle>Publish Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to publish this event? Once published, you'll have limited editing options.
            The event will be visible to all participants.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPublishDialog(false)}>Cancel</Button>
          <Button onClick={handlePublish} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>Mark as Completed</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this event as completed? This will close registrations
            and the event will be marked as finished.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
          <Button onClick={handleComplete} variant="contained" color="success" disabled={loading}>
            {loading ? 'Processing...' : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onClose={() => setShowCloseDialog(false)}>
        <DialogTitle>Close/Cancel Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to close this event? This will cancel the event, close registrations,
            and hide it from public view. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCloseDialog(false)}>Cancel</Button>
          <Button onClick={handleClose} variant="contained" color="error" disabled={loading}>
            {loading ? 'Closing...' : 'Close Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditEvent;
