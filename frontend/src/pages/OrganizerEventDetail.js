import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Event as EventIcon,
  CalendarToday,
  LocationOn,
  People,
  AttachMoney,
  TrendingUp,
  Assessment,
  Search,
  FilterList,
  GetApp,
  CheckCircle,
  Cancel,
  Person,
  Email,
  Payment,
  Group,
  Schedule,
  LocalOffer,
  Inventory,
} from '@mui/icons-material';
import api from '../services/api';

const OrganizerEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('All');

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [registrations, searchTerm, statusFilter, paymentFilter, attendanceFilter]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      if (response.data.success) {
        setEvent(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(`/events/${id}/registrations`);
      if (response.data.success) {
        setRegistrations(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Search filter (name or email)
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.participant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(reg => reg.registrationStatus === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'All') {
      filtered = filtered.filter(reg => reg.paymentMethod === paymentFilter);
    }

    // Attendance filter
    if (attendanceFilter !== 'All') {
      if (attendanceFilter === 'Present') {
        filtered = filtered.filter(reg => reg.attendanceMarked === true);
      } else if (attendanceFilter === 'Absent') {
        filtered = filtered.filter(reg => reg.attendanceMarked === false);
      }
    }

    setFilteredRegistrations(filtered);
  };

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV Headers
    const headers = [
      'Name',
      'Email',
      'Registration Date',
      'Status',
      'Payment Method',
      'Team Name',
      'Attendance',
      'Ticket ID',
    ];

    // CSV Rows
    const rows = filteredRegistrations.map(reg => [
      `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}`,
      reg.participant?.email || '',
      new Date(reg.createdAt).toLocaleDateString('en-IN'),
      reg.registrationStatus,
      reg.paymentMethod || 'N/A',
      reg.teamName || 'Individual',
      reg.attendanceMarked ? 'Present' : 'Absent',
      reg.ticketId || '',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.eventName}_registrations.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getEventStatus = () => {
    if (!event) return { label: 'Unknown', color: 'default' };
    const now = new Date();
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);

    if (!event.isApproved) return { label: 'Draft', color: 'default' };
    if (endDate < now) return { label: 'Closed', color: 'error' };
    if (startDate <= now && endDate >= now) return { label: 'Ongoing', color: 'success' };
    return { label: 'Published', color: 'primary' };
  };

  // Calculate Analytics
  const calculateAnalytics = () => {
    if (!registrations.length) {
      return {
        totalRegistrations: 0,
        confirmedRegistrations: 0,
        pendingRegistrations: 0,
        cancelledRegistrations: 0,
        totalRevenue: 0,
        attendanceRate: 0,
        teamCompletion: 0,
        averageTeamSize: 0,
      };
    }

    const confirmed = registrations.filter(r => r.registrationStatus === 'Confirmed');
    const pending = registrations.filter(r => r.registrationStatus === 'Pending');
    const cancelled = registrations.filter(r => r.registrationStatus === 'Cancelled' || r.registrationStatus === 'Rejected');
    const attended = registrations.filter(r => r.attendanceMarked === true);
    const teamsWithMembers = registrations.filter(r => r.teamName && r.teamMembers && r.teamMembers.length > 0);
    
    const totalRevenue = confirmed.reduce((sum, reg) => {
      return sum + (event?.price || 0) * (reg.quantity || 1);
    }, 0);

    const attendanceRate = confirmed.length > 0 
      ? Math.round((attended.length / confirmed.length) * 100) 
      : 0;

    const teamCompletion = registrations.length > 0
      ? Math.round((teamsWithMembers.length / registrations.length) * 100)
      : 0;

    const totalTeamMembers = teamsWithMembers.reduce((sum, reg) => sum + (reg.teamMembers?.length || 0), 0);
    const averageTeamSize = teamsWithMembers.length > 0 
      ? Math.round(totalTeamMembers / teamsWithMembers.length) 
      : 0;

    return {
      totalRegistrations: registrations.length,
      confirmedRegistrations: confirmed.length,
      pendingRegistrations: pending.length,
      cancelledRegistrations: cancelled.length,
      totalRevenue,
      attendanceRate,
      teamCompletion,
      averageTeamSize,
    };
  };

  const analytics = calculateAnalytics();
  const status = getEventStatus();

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <Container>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error || 'Event not found'}
          </Alert>
          <Button onClick={() => navigate('/organizer/my-events')} sx={{ mt: 2 }}>
            Back to My Events
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/organizer/my-events')}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" gutterBottom>
                {event.eventName}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Chip label={status.label} color={status.color} size="small" />
                <Chip label={event.eventType} color={event.eventType === 'Normal' ? 'primary' : 'secondary'} size="small" />
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/organizer/edit-event/${event._id}`)}
            >
              Edit
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" icon={<EventIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<Assessment />} iconPosition="start" />
            <Tab label="Participants" icon={<People />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 0: Overview */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Event Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {event.description}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Start Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(event.eventStartDate)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        End Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(event.eventEndDate)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Registration Deadline
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(event.registrationDeadline)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {event.venue}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <People sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Eligibility
                      </Typography>
                      <Typography variant="body1">
                        {event.eligibility}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <AttachMoney sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {event.eventType === 'Merchandise' ? 'Price' : 'Registration Fee'}
                      </Typography>
                      <Typography variant="body1">
                        {event.price > 0 ? `₹${event.price}` : 'Free'}
                      </Typography>
                    </Grid>

                    {event.maxParticipants && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <People sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Registration Limit
                        </Typography>
                        <Typography variant="body1">
                          {event.currentRegistrations || 0} / {event.maxParticipants}
                        </Typography>
                      </Grid>
                    )}

                    {event.eventType === 'Merchandise' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            <Inventory sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Stock Available
                          </Typography>
                          <Typography variant="body1">
                            {event.availableStock || 0} units
                          </Typography>
                        </Grid>

                        {event.sizes && event.sizes.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Available Sizes
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                              {event.sizes.map((size, idx) => (
                                <Chip key={idx} label={size} size="small" />
                              ))}
                            </Box>
                          </Grid>
                        )}

                        {event.colors && event.colors.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Available Colors
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                              {event.colors.map((color, idx) => (
                                <Chip key={idx} label={color} size="small" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}

                    {event.tags && event.tags.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tags
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                          {event.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Stats
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Total Registrations
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {analytics.totalRegistrations}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Confirmed
                    </Typography>
                    <Typography variant="body1" color="success.main">
                      {analytics.confirmedRegistrations}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography variant="body1" color="warning.main">
                      {analytics.pendingRegistrations}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Cancelled/Rejected
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      {analytics.cancelledRegistrations}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="h4" color="success.main" gutterBottom>
                    ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From {analytics.confirmedRegistrations} confirmed registrations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Analytics */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {/* Analytics Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
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

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
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

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {analytics.attendanceRate}%
                      </Typography>
                      <Typography variant="body2">
                        Attendance Rate
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {analytics.teamCompletion}%
                      </Typography>
                      <Typography variant="body2">
                        Team Completion
                      </Typography>
                    </Box>
                    <Group sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Analytics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Registration Breakdown
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Confirmed</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {analytics.confirmedRegistrations}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 8, borderRadius: 1 }}>
                      <Box
                        sx={{
                          width: `${analytics.totalRegistrations > 0 ? (analytics.confirmedRegistrations / analytics.totalRegistrations) * 100 : 0}%`,
                          bgcolor: 'success.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Pending</Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {analytics.pendingRegistrations}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 8, borderRadius: 1 }}>
                      <Box
                        sx={{
                          width: `${analytics.totalRegistrations > 0 ? (analytics.pendingRegistrations / analytics.totalRegistrations) * 100 : 0}%`,
                          bgcolor: 'warning.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Cancelled/Rejected</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {analytics.cancelledRegistrations}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 8, borderRadius: 1 }}>
                      <Box
                        sx={{
                          width: `${analytics.totalRegistrations > 0 ? (analytics.cancelledRegistrations / analytics.totalRegistrations) * 100 : 0}%`,
                          bgcolor: 'error.main',
                          height: 8,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box display="flex" justifyContent="space-between" mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2">Attendance Rate</Typography>
                    <Typography variant="h6" color="primary">
                      {analytics.attendanceRate}%
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2">Team Completion</Typography>
                    <Typography variant="h6" color="primary">
                      {analytics.teamCompletion}%
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2">Average Team Size</Typography>
                    <Typography variant="h6" color="primary">
                      {analytics.averageTeamSize}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {event.eventType === 'Merchandise' && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sales Statistics
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h4" color="primary" gutterBottom>
                            {analytics.confirmedRegistrations}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Sales
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h4" color="success.main" gutterBottom>
                            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Revenue Generated
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="h4" color="warning.main" gutterBottom>
                            {event.availableStock || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Remaining Stock
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Tab 2: Participants */}
        {tabValue === 2 && (
          <Box>
            {/* Search and Filter Bar */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="All">All Status</MenuItem>
                        <MenuItem value="Confirmed">Confirmed</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="All">All Payment</MenuItem>
                        <MenuItem value="Free">Free</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Card">Card</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={attendanceFilter}
                        onChange={(e) => setAttendanceFilter(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="All">All Attendance</MenuItem>
                        <MenuItem value="Present">Present</MenuItem>
                        <MenuItem value="Absent">Absent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<GetApp />}
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </Button>
                  </Grid>
                </Grid>

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredRegistrations.length} of {registrations.length} registrations
                  </Typography>
                  {(searchTerm || statusFilter !== 'All' || paymentFilter !== 'All' || attendanceFilter !== 'All') && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        setPaymentFilter('All');
                        setAttendanceFilter('All');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Participants Table */}
            {filteredRegistrations.length === 0 ? (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={8}>
                    <People sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Participants Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {registrations.length === 0 
                        ? 'No one has registered for this event yet.' 
                        : 'Try adjusting your search or filters.'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Reg. Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Payment</strong></TableCell>
                      <TableCell><strong>Team</strong></TableCell>
                      <TableCell><strong>Attendance</strong></TableCell>
                      <TableCell><strong>Ticket ID</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRegistrations.map((reg) => (
                      <TableRow key={reg._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">
                              {reg.participant?.firstName} {reg.participant?.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2">
                              {reg.participant?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reg.registrationStatus}
                            size="small"
                            color={
                              reg.registrationStatus === 'Confirmed' ? 'success' :
                              reg.registrationStatus === 'Pending' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reg.paymentMethod || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {reg.teamName || 'Individual'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {reg.attendanceMarked ? (
                            <Chip
                              icon={<CheckCircle />}
                              label="Present"
                              size="small"
                              color="success"
                            />
                          ) : (
                            <Chip
                              icon={<Cancel />}
                              label="Absent"
                              size="small"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {reg.ticketId}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Container>
    </>
  );
};

export default OrganizerEventDetail;
