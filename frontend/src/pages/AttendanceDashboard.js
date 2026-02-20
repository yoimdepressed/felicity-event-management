import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Download,
  Refresh,
  Edit,
  CheckCircle,
  Cancel,
  Search,
  History
} from '@mui/icons-material';
import api from '../services/api';
import QRScanner from '../components/QRScanner';

const AttendanceDashboard = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideAction, setOverrideAction] = useState('mark');
  const [auditLogDialog, setAuditLogDialog] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setError(null);
      const response = await api.get(`/attendance/event/${eventId}/dashboard`);
      setDashboardData(response.data.data);
      setFilteredData(response.data.data.registrations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh dashboard
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Filter and search registrations
  useEffect(() => {
    if (!dashboardData) return;

    let filtered = dashboardData.registrations;

    // Apply status filter
    if (statusFilter === 'attended') {
      filtered = filtered.filter(r => r.attended);
    } else if (statusFilter === 'not-attended') {
      filtered = filtered.filter(r => !r.attended);
    } else if (statusFilter === 'manual-override') {
      filtered = filtered.filter(r => r.manualOverride);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.participant.name.toLowerCase().includes(query) ||
        r.participant.email.toLowerCase().includes(query) ||
        r.ticketId.toLowerCase().includes(query)
      );
    }

    setFilteredData(filtered);
  }, [searchQuery, statusFilter, dashboardData]);

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/attendance/event/${eventId}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${eventId}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  // Open manual override dialog
  const openOverrideDialog = (registration) => {
    setSelectedRegistration(registration);
    setOverrideAction(registration.attended ? 'unmark' : 'mark');
    setOverrideReason('');
    setOverrideDialog(true);
  };

  // Submit manual override
  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for manual override');
      return;
    }

    try {
      await api.post('/attendance/manual-override', {
        registrationId: selectedRegistration._id,
        markAttended: overrideAction === 'mark',
        reason: overrideReason
      });

      setOverrideDialog(false);
      setOverrideReason('');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to override attendance');
    }
  };

  // Fetch audit log
  const fetchAuditLog = async () => {
    try {
      const response = await api.get(`/attendance/event/${eventId}/audit-log`);
      setAuditLog(response.data.data.auditLog);
      setAuditLogDialog(true);
    } catch (err) {
      setError('Failed to load audit log');
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [eventId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* QR Scanner Section */}
      <Box mb={3}>
        <QRScanner eventId={eventId} onScanSuccess={handleRefresh} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{dashboardData.statistics.totalRegistrations}</Typography>
              <Typography variant="body2">Total Registrations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{dashboardData.statistics.totalAttended}</Typography>
              <Typography variant="body2">Attended</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{dashboardData.statistics.totalNotAttended}</Typography>
              <Typography variant="body2">Not Attended</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h4">{dashboardData.statistics.attendancePercentage}%</Typography>
              <Typography variant="body2">Attendance Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            placeholder="Search by name, email, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="attended">Attended</MenuItem>
              <MenuItem value="not-attended">Not Attended</MenuItem>
              <MenuItem value="manual-override">Manual Override</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<History />}
            onClick={fetchAuditLog}
            variant="outlined"
          >
            Audit Log
          </Button>
          <Button
            startIcon={<Download />}
            onClick={handleExportCSV}
            variant="contained"
            color="primary"
          >
            Export CSV
          </Button>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh />
          </IconButton>
        </Stack>
      </Box>

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Participant</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attended At</TableCell>
              <TableCell>Scan Method</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No registrations found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((registration) => (
                <TableRow key={registration._id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {registration.ticketId}
                    </Typography>
                  </TableCell>
                  <TableCell>{registration.participant.name}</TableCell>
                  <TableCell>{registration.participant.email}</TableCell>
                  <TableCell>{registration.participant.contactNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={registration.attended ? <CheckCircle /> : <Cancel />}
                      label={registration.attended ? 'Attended' : 'Not Attended'}
                      color={registration.attended ? 'success' : 'default'}
                      size="small"
                    />
                    {registration.manualOverride && (
                      <Tooltip title={`Manually overridden: ${registration.overrideReason}`}>
                        <Chip
                          label="Override"
                          color="warning"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {registration.attendedAt
                      ? new Date(registration.attendedAt).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{registration.scanMethod || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Manual Override">
                      <IconButton
                        size="small"
                        onClick={() => openOverrideDialog(registration)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manual Override Dialog */}
      <Dialog open={overrideDialog} onClose={() => setOverrideDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Attendance Override</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Participant:</strong> {selectedRegistration.participant.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Status:</strong>{' '}
                <Chip
                  label={selectedRegistration.attended ? 'Attended' : 'Not Attended'}
                  color={selectedRegistration.attended ? 'success' : 'default'}
                  size="small"
                />
              </Typography>

              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={overrideAction}
                  label="Action"
                  onChange={(e) => setOverrideAction(e.target.value)}
                >
                  <MenuItem value="mark">Mark as Attended</MenuItem>
                  <MenuItem value="unmark">Unmark Attendance</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Reason for Override"
                multiline
                rows={4}
                fullWidth
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why you're manually overriding the attendance..."
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialog(false)}>Cancel</Button>
          <Button onClick={handleManualOverride} variant="contained" color="primary">
            Submit Override
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditLogDialog} onClose={() => setAuditLogDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Attendance Audit Log</DialogTitle>
        <DialogContent>
          {auditLog.length === 0 ? (
            <Typography color="text.secondary">No manual overrides found</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ticket ID</TableCell>
                    <TableCell>Participant</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>By</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{log.ticketId}</TableCell>
                      <TableCell>{log.participant}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.reason}</TableCell>
                      <TableCell>
                        {log.overriddenBy.name}
                        <Chip label={log.overriddenBy.role} size="small" sx={{ ml: 1 }} />
                      </TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditLogDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceDashboard;
