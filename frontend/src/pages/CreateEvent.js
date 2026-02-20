import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CreateEvent.css';
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
  Paper,
  Divider,
  Checkbox,
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
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdEventId, setCreatedEventId] = useState(null);

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
    status: 'Draft', // Can be 'Draft' or 'Published'
  });

  // Available sizes for merchandise
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple'];
  const availableTags = ['Workshop', 'Competition', 'Cultural', 'Technical', 'Sports', 'Gaming', 'Music', 'Dance', 'Food', 'Art'];

  const [tagInput, setTagInput] = useState('');
  const [customFormFields, setCustomFormFields] = useState([]);

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

  const handleEventTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      ...formData,
      eventType: newType,
      // Reset type-specific fields
      maxParticipants: '',
      price: newType === 'Merchandise' ? '' : '0',
      availableStock: '',
      sizes: [],
    });
  };

  const handleSizeToggle = (size) => {
    if (formData.sizes.includes(size)) {
      setFormData({
        ...formData,
        sizes: formData.sizes.filter((s) => s !== size),
      });
    } else {
      setFormData({
        ...formData,
        sizes: [...formData.sizes, size],
      });
    }
  };

  const handleColorToggle = (color) => {
    if (formData.colors.includes(color)) {
      setFormData({
        ...formData,
        colors: formData.colors.filter((c) => c !== color),
      });
    } else {
      setFormData({
        ...formData,
        colors: [...formData.colors, color],
      });
    }
  };

  const handleTagAdd = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      });
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSubmit = async (e, actionType = 'Draft') => {
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
      const now = new Date();

      if (endDate < startDate) {
        throw new Error('Event end date must be after start date');
      }

      if (deadline >= startDate) {
        throw new Error('Registration deadline must be before event start date');
      }

      // Type-specific validation (stricter for Published events)
      if (formData.eventType === 'Merchandise') {
        if (!formData.price || formData.price <= 0) {
          throw new Error('Merchandise events must have a valid price');
        }
        if (!formData.availableStock || formData.availableStock <= 0) {
          throw new Error('Merchandise events must have available stock');
        }
        if (formData.sizes.length === 0) {
          throw new Error('Please select at least one size for merchandise');
        }
        if (formData.colors.length === 0) {
          throw new Error('Please select at least one color for merchandise');
        }
      }

      // For publishing, require tags
      if (actionType === 'Published' && formData.tags.length === 0) {
        throw new Error('Please add at least one tag before publishing');
      }

      // Prepare data for API
      const eventData = {
        eventName: formData.eventName,
        eventType: formData.eventType,
        description: formData.description,
        venue: formData.venue,
        eventStartDate: formData.eventStartDate.toISOString(),
        eventEndDate: formData.eventEndDate.toISOString(),
        registrationDeadline: formData.registrationDeadline.toISOString(),
        eligibility: formData.eligibility,
        tags: formData.tags,
        status: actionType, // 'Draft' or 'Published'
      };

      // Add type-specific fields
      if (formData.eventType === 'Normal') {
        if (formData.maxParticipants) {
          eventData.maxParticipants = parseInt(formData.maxParticipants);
        }
        eventData.price = 0;
        eventData.customRegistrationForm = formData.customRegistrationForm;
      } else {
        eventData.price = parseFloat(formData.price);
        eventData.availableStock = parseInt(formData.availableStock);
        eventData.sizes = formData.sizes;
        eventData.colors = formData.colors;
        if (formData.purchaseLimitPerParticipant) {
          eventData.purchaseLimitPerParticipant = parseInt(formData.purchaseLimitPerParticipant);
        }
      }

      // Get token
      const token = localStorage.getItem('token');

      // Make API call
      const response = await axios.post(
        'http://localhost:5000/api/events',
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const message = actionType === 'Published' 
          ? 'Event created and published successfully!' 
          : 'Event saved as draft successfully!';
        setSuccess(message);
        setCreatedEventId(response.data.data._id); // Store event ID for FormBuilder
        
        // Only navigate away if publishing or Merchandise
        if (actionType === 'Published' || formData.eventType === 'Merchandise') {
          setTimeout(() => {
            navigate('/organizer/my-events');
          }, 2000);
        } else {
          // For Draft Normal events, show FormBuilder
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/organizer')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Create New Event
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" mb={3}>
        Fill in the details below to create a new event for your organization
      </Typography>

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
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Main Form */}
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Event Type Selection */}
            <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: 3, mb: 4, borderRadius: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                  Event Type *
                </FormLabel>
                <RadioGroup
                  row
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleEventTypeChange}
                >
                  <FormControlLabel
                    value="Normal"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          Normal Event
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Workshops, Talks, Competitions
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: '2px solid',
                      borderColor:
                        formData.eventType === 'Normal' ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 2,
                      mr: 2,
                      bgcolor: formData.eventType === 'Normal' ? 'primary.50' : 'white',
                    }}
                  />
                  <FormControlLabel
                    value="Merchandise"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          Merchandise
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          T-shirts, Hoodies, Kits
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: '2px solid',
                      borderColor:
                        formData.eventType === 'Merchandise' ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 2,
                      bgcolor: formData.eventType === 'Merchandise' ? 'primary.50' : 'white',
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* Basic Information */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              Basic Information
            </Typography>

            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., React Workshop, Felicity T-Shirt"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  multiline
                  rows={4}
                  placeholder="Provide a detailed description of the event..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Venue / Location"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Vindhya C11, Online, KRB Auditorium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Eligibility */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Eligibility"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="Open to All">Open to All</option>
                  <option value="IIIT Students Only">IIIT Students Only</option>
                  <option value="Team Event">Team Event</option>
                  <option value="First Year Only">First Year Only</option>
                  <option value="Final Year Only">Final Year Only</option>
                </TextField>
              </Grid>

              {/* Tags */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1 }}>Event Tags</FormLabel>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleTagRemove(tag)}
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag (e.g., Workshop, Gaming)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                    />
                    <Button variant="outlined" size="small" onClick={handleTagAdd}>
                      Add
                    </Button>
                  </Box>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Date & Time */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              Schedule
            </Typography>

            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                    Event Start Date & Time *
                  </FormLabel>
                  <DatePicker
                    selected={formData.eventStartDate}
                    onChange={(date) => handleDateChange('eventStartDate', date)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    minDate={new Date()}
                    placeholderText="Select start date & time"
                    className="custom-datepicker"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                    Event End Date & Time *
                  </FormLabel>
                  <DatePicker
                    selected={formData.eventEndDate}
                    onChange={(date) => handleDateChange('eventEndDate', date)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    minDate={formData.eventStartDate || new Date()}
                    placeholderText="Select end date & time"
                    className="custom-datepicker"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                    Registration Deadline *
                  </FormLabel>
                  <DatePicker
                    selected={formData.registrationDeadline}
                    onChange={(date) => handleDateChange('registrationDeadline', date)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    maxDate={formData.eventStartDate || new Date()}
                    placeholderText="Select registration deadline"
                    className="custom-datepicker"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Type-Specific Fields */}
            {formData.eventType === 'Normal' ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Registration Settings
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Maximum Participants"
                      name="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      placeholder="Leave empty for unlimited"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <People />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Optional: Set a limit on registrations"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Registration Fee"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Leave 0 for free events, or enter fee in INR"
                    />
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Merchandise Details
                </Typography>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      placeholder="0"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Price in INR"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Available Stock"
                      name="availableStock"
                      type="number"
                      value={formData.availableStock}
                      onChange={handleChange}
                      required
                      placeholder="0"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Total quantity available"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                      Available Sizes *
                    </FormLabel>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {availableSizes.map((size) => (
                        <Chip
                          key={size}
                          label={size}
                          onClick={() => handleSizeToggle(size)}
                          color={formData.sizes.includes(size) ? 'primary' : 'default'}
                          variant={formData.sizes.includes(size) ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: formData.sizes.includes(size)
                                ? 'primary.dark'
                                : 'grey.100',
                            },
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Click to select/deselect sizes
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                      Available Colors *
                    </FormLabel>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {availableColors.map((color) => (
                        <Chip
                          key={color}
                          label={color}
                          onClick={() => handleColorToggle(color)}
                          color={formData.colors.includes(color) ? 'primary' : 'default'}
                          variant={formData.colors.includes(color) ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: formData.colors.includes(color)
                                ? 'primary.dark'
                                : 'grey.100',
                            },
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Click to select/deselect colors
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                      Tags *
                    </FormLabel>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleTagRemove(tag)}
                          color="primary"
                          variant="filled"
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'default',
                          }}
                        />
                      ))}
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTagAdd()}
                        sx={{
                          flex: '0 0 auto',
                          minWidth: 120,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Press Enter to add a tag, click on a tag to remove it
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Purchase Limit Per Participant"
                      name="purchaseLimitPerParticipant"
                      type="number"
                      value={formData.purchaseLimitPerParticipant}
                      onChange={handleChange}
                      placeholder="Leave empty for unlimited"
                      helperText="Max quantity one person can buy"
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Custom Registration Form - Only for Normal Events */}
            {formData.eventType === 'Normal' && createdEventId && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Custom Registration Form (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Add custom fields to collect additional information from participants.
                  The form will be locked after the first registration.
                </Typography>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <FormBuilder 
                    eventId={createdEventId} 
                    onSave={() => console.log('Form saved successfully')}
                  />
                </Paper>
              </>
            )}

            {/* Helper message for draft events */}
            {formData.eventType === 'Normal' && !createdEventId && (
              <>
                <Divider sx={{ my: 3 }} />
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    💡 <strong>Tip:</strong> Save as Draft first to access the Custom Registration Form Builder
                  </Typography>
                </Paper>
              </>
            )}

            {/* Submit Buttons */}
            <Box display="flex" gap={2} mt={4}>
              {!createdEventId ? (
                <>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={loading}
                    fullWidth
                    onClick={(e) => handleSubmit(e, 'Draft')}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={loading}
                    fullWidth
                    onClick={(e) => handleSubmit(e, 'Published')}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    {loading ? 'Publishing...' : 'Create & Publish'}
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
                </>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/organizer/my-events')}
                  sx={{ py: 1.5, fontWeight: 600 }}
                  startIcon={<CheckCircle />}
                >
                  Done - Go to My Events
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Helper Info */}
      <Paper elevation={0} sx={{ mt: 3, p: 3, bgcolor: 'info.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>💡 Event Creation Flow:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
          <li><strong>Save as Draft:</strong> Save your event and edit it later before publishing</li>
          <li><strong>Create & Publish:</strong> Immediately publish your event to make it visible to participants</li>
          <li>Draft events can be fully edited, published events have limited edits (description, deadline, limits)</li>
          <li>Event date must be after registration deadline</li>
          <li>For Normal events, leave max participants empty for unlimited registrations</li>
          <li>For Merchandise, price, stock, sizes, and colors are required</li>
        </Typography>
      </Paper>
    </Container>
  );
};

export default CreateEvent;
