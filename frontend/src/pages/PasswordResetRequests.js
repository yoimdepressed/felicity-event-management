import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Check,
  Close,
  VpnKey,
  Person,
  Email,
  Schedule,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const PasswordResetRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    action: '', // 'approve' or 'reject'
    requestId: null,
  });
  const [formData, setFormData] = useState({
    newPassword: '',
    adminNotes: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchRequests(activeTab);
  }, [user, navigate, activeTab]);

  const fetchRequests = async (status) => {
    try {
      setLoading(true);
      const response = await adminAPI.getPasswordResetRequests(status);
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenActionDialog = (action, request) => {
    setActionDialog({
      open: true,
      action,
      requestId: request._id,
    });
    setSelectedRequest(request);
    setFormData({
      newPassword: '',
      adminNotes: '',
    });
    setError('');
  };

  const handleCloseActionDialog = () => {
    setActionDialog({
      open: false,
      action: '',
      requestId: null,
    });
    setSelectedRequest(null);
    setFormData({
      newPassword: '',
      adminNotes: '',
    });
  };

  const handleApprove = async () => {
    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await adminAPI.approvePasswordResetRequest(
        actionDialog.requestId,
        formData.newPassword,
        formData.adminNotes
      );
      setSuccess('Password reset request approved successfully');
      handleCloseActionDialog();
      fetchRequests(activeTab);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    try {
      await adminAPI.rejectPasswordResetRequest(
        actionDialog.requestId,
        formData.adminNotes
      );
      setSuccess('Password reset request rejected');
      handleCloseActionDialog();
      fetchRequests(activeTab);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Box flexGrow={1}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Password Reset Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and manage password reset requests from users
            </Typography>
          </Box>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {requests.filter((r) => r.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 48, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {requests.filter((r) => r.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                  <Check sx={{ fontSize: 48, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {requests.filter((r) => r.status === 'rejected').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </Box>
                  <Close sx={{ fontSize: 48, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Pending" value="pending" />
            <Tab label="Approved" value="approved" />
            <Tab label="Rejected" value="rejected" />
            <Tab label="All" value="all" />
          </Tabs>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No password reset requests found
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Reason</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Requested</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {request.user?.firstName} {request.user?.lastName}
                              </Typography>
                              {request.user?.organizerName && (
                                <Typography variant="caption" color="text.secondary">
                                  {request.user.organizerName}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Email sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                            {request.email}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={request.reason}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {request.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {request.status === 'pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenActionDialog('approve', request)}
                                >
                                  <Check />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenActionDialog('reject', request)}
                                >
                                  <Close />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {request.status !== 'pending' && (
                            <Typography variant="caption" color="text.secondary">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                              {request.reviewedBy?.firstName} {request.reviewedBy?.lastName}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} Password Reset Request
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>User:</strong> {selectedRequest.user?.firstName}{' '}
                  {selectedRequest.user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Email:</strong> {selectedRequest.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </Typography>
              </Box>
            )}

            {actionDialog.action === 'approve' && (
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                sx={{ mb: 2 }}
                required
                helperText="Minimum 6 characters"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              multiline
              rows={3}
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              placeholder="Add any notes about this decision..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseActionDialog}>Cancel</Button>
            <Button
              onClick={actionDialog.action === 'approve' ? handleApprove : handleReject}
              variant="contained"
              color={actionDialog.action === 'approve' ? 'success' : 'error'}
              startIcon={actionDialog.action === 'approve' ? <Check /> : <Close />}
            >
              {actionDialog.action === 'approve' ? 'Approve & Reset' : 'Reject Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default PasswordResetRequests;
