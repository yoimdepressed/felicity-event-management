import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  QrCode as QrCodeIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ParticipantMyEvents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // 0: Upcoming, 1: History
  const [historyTab, setHistoryTab] = useState(0); // 0: All, 1: Normal, 2: Merchandise, 3: Cancelled
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialog, setcancelDialog] = useState({ open: false, registration: null });
  const [cancelReason, setCancelReason] = useState('');
  const [qrDialog, setQrDialog] = useState({ open: false, registration: null });

  useEffect(() => {
    fetchRegistrations();
  }, [activeTab, historyTab]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');

      // Determine which tab to fetch
      let tab = 'all';
      let eventType = null;

      if (activeTab === 0) {
        tab = 'upcoming';
      } else {
        // History tab
        if (historyTab === 0) tab = 'all';
        else if (historyTab === 1) {
          tab = 'all';
          eventType = 'Normal';
        } else if (historyTab === 2) {
          tab = 'all';
          eventType = 'Merchandise';
        } else if (historyTab === 3) tab = 'cancelled';
      }

      const params = new URLSearchParams();
      if (tab !== 'all') params.append('tab', tab);
      if (eventType) params.append('eventType', eventType);

      const response = await api.get(`/registrations/my?${params.toString()}`);

      if (response.data.success) {
        let fetchedRegistrations = response.data.data;
        
        // For Upcoming Events tab: Show only latest active registration per event
        // This handles re-registrations - only shows the current active one
        if (activeTab === 0) {
          const eventMap = new Map();
          fetchedRegistrations.forEach(reg => {
            const eventId = reg.event?._id;
            if (eventId) {
              // Only keep if no existing registration OR this one is newer
              if (!eventMap.has(eventId) || 
                  new Date(reg.createdAt) > new Date(eventMap.get(eventId).createdAt)) {
                // Only include active registrations (Confirmed/Pending)
                if (reg.registrationStatus === 'Confirmed' || reg.registrationStatus === 'Pending') {
                  eventMap.set(eventId, reg);
                }
              }
            }
          });
          fetchedRegistrations = Array.from(eventMap.values());
        }
        
        setRegistrations(fetchedRegistrations);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err.response?.data?.message || 'Failed to fetch your registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (registration) => {
    setcancelDialog({ open: true, registration });
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    try {
      const response = await api.delete(`/registrations/${cancelDialog.registration._id}`, {
        data: { reason: cancelReason },
      });

      if (response.data.success) {
        setcancelDialog({ open: false, registration: null });
        setCancelReason('');
        fetchRegistrations(); // Refresh list
      }
    } catch (err) {
      console.error('Error cancelling registration:', err);
      setError(err.response?.data?.message || 'Failed to cancel registration');
      setcancelDialog({ open: false, registration: null });
    }
  };

  const handleViewQR = (registration) => {
    setQrDialog({ open: true, registration });
  };

  const handleDownloadQR = (registration) => {
    if (registration.qrCode) {
      const link = document.createElement('a');
      link.href = registration.qrCode;
      link.download = `ticket-${registration.ticketId}.png`;
      link.click();
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const isPastEvent = (eventEndDate) => {
    return new Date(eventEndDate) < new Date();
  };

  // Helper to check if this is a re-registration (same event has multiple registrations)
  const isReregistration = (registration) => {
    if (activeTab === 0) return false; // Don't show in Upcoming tab
    
    const eventId = registration.event?._id;
    const registrationsForEvent = registrations.filter(r => r.event?._id === eventId);
    
    if (registrationsForEvent.length > 1) {
      // Sort by creation date
      const sorted = registrationsForEvent.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      // Return true if this is NOT the most recent one
      return sorted[0]._id !== registration._id;
    }
    return false;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your events...
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            My Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your registrations and event history
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Main Tabs: Upcoming vs History */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Upcoming Events" />
            <Tab label="Participation History" />
          </Tabs>
        </Paper>

        {/* History Sub-tabs */}
        {activeTab === 1 && (
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={historyTab}
              onChange={(e, newValue) => setHistoryTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="All" />
              <Tab label="Normal Events" />
              <Tab label="Merchandise" />
              <Tab label="Cancelled/Rejected" />
            </Tabs>
          </Paper>
        )}

        {/* Events List */}
        {registrations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 0
                ? "You haven't registered for any upcoming events yet."
                : 'Your participation history will appear here.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/participant/browse-events')}
            >
              Browse Events
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {registrations.map((registration) => (
              <Grid item xs={12} md={6} key={registration._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: isPastEvent(registration.event?.eventEndDate) ? 0.8 : 1,
                  }}
                >
                  {/* Event Type Badge */}
                  <Chip
                    label={registration.event?.eventType || 'Event'}
                    color={registration.event?.eventType === 'Normal' ? 'primary' : 'secondary'}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1,
                    }}
                  />
                  
                  {/* Superseded Badge for old registrations when user re-registered */}
                  {isReregistration(registration) && (
                    <Chip
                      label="Superseded"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 50,
                        right: 16,
                        zIndex: 1,
                        bgcolor: 'warning.light',
                        color: 'warning.dark',
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1, pt: 6 }}>
                    {/* Event Name */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {registration.event?.eventName || 'Event Name'}
                    </Typography>

                    {/* Organizer */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        by {registration.event?.organizer?.organizerName || 'Organizer'}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Event Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Date */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {registration.event?.eventStartDate
                            ? formatDate(registration.event.eventStartDate)
                            : 'Date TBA'}
                        </Typography>
                      </Box>

                      {/* Venue */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {registration.event?.venue || 'Venue TBA'}
                        </Typography>
                      </Box>

                      {/* Status */}
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={registration.registrationStatus}
                          color={getStatusColor(registration.registrationStatus)}
                          size="small"
                        />
                      </Box>

                      {/* Ticket ID */}
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Ticket ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {registration.ticketId}
                        </Typography>
                      </Box>

                      {/* Team Name */}
                      {registration.teamName && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Team: {registration.teamName}
                          </Typography>
                        </Box>
                      )}

                      {/* Merchandise Details */}
                      {registration.merchandiseDetails && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {registration.merchandiseDetails.size && (
                            <Chip label={`Size: ${registration.merchandiseDetails.size}`} size="small" />
                          )}
                          {registration.merchandiseDetails.color && (
                            <Chip label={`Color: ${registration.merchandiseDetails.color}`} size="small" />
                          )}
                          {registration.merchandiseDetails.quantity && (
                            <Chip label={`Qty: ${registration.merchandiseDetails.quantity}`} size="small" />
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<QrCodeIcon />}
                      onClick={() => handleViewQR(registration)}
                      disabled={registration.registrationStatus !== 'Confirmed'}
                    >
                      View Ticket
                    </Button>
                    {registration.registrationStatus === 'Confirmed' &&
                      !isPastEvent(registration.event?.eventStartDate) && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelClick(registration)}
                        >
                          Cancel
                        </Button>
                      )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Cancel Registration Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={() => setcancelDialog({ open: false, registration: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Registration</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Are you sure you want to cancel your registration for{' '}
              <strong>{cancelDialog.registration?.event?.eventName}</strong>?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Schedule conflict, Change of plans"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setcancelDialog({ open: false, registration: null })}>
              Keep Registration
            </Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Cancel Registration
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog
          open={qrDialog.open}
          onClose={() => setQrDialog({ open: false, registration: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Your Ticket</Typography>
              <IconButton onClick={() => setQrDialog({ open: false, registration: null })}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {qrDialog.registration && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {qrDialog.registration.event?.eventName}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {qrDialog.registration.event?.venue} •{' '}
                  {qrDialog.registration.event?.eventStartDate
                    ? formatDate(qrDialog.registration.event.eventStartDate)
                    : 'Date TBA'}
                </Typography>

                <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', my: 3 }}>
                  {qrDialog.registration.qrCode ? (
                    <img
                      src={qrDialog.registration.qrCode}
                      alt="QR Code"
                      style={{ width: '100%', maxWidth: 300 }}
                    />
                  ) : (
                    <Box sx={{ py: 4 }}>
                      <QrCodeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        QR Code not available
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ticket ID
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 3 }}>
                  {qrDialog.registration.ticketId}
                </Typography>

                <Typography variant="caption" color="text.secondary" paragraph>
                  Present this QR code at the event venue for entry
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadQR(qrDialog.registration)}
                  disabled={!qrDialog.registration.qrCode}
                  fullWidth
                >
                  Download Ticket
                </Button>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
};

export default ParticipantMyEvents;
