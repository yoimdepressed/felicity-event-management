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
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import { Delete, Logout, LockReset } from '@mui/icons-material';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [resetDialog, setResetDialog] = useState({ open: false, organizer: null });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStats();
    fetchOrganizers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data.organizers);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setSuccess('');
    setCredentials(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      organizerName: '',
      category: '',
      description: '',
      contactEmail: '',
    });
    setCredentials(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateOrganizer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.createOrganizer(formData);
      setSuccess('Organizer created successfully with auto-generated credentials!');
      setCredentials({
        email: response.data.credentials.email,
        password: response.data.credentials.password,
      });
      fetchOrganizers();
      fetchStats();
      // Don't close dialog - show credentials
      setFormData({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organizer');
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organizer?')) {
      return;
    }

    try {
      await adminAPI.deleteOrganizer(id);
      setSuccess('Organizer deleted successfully');
      fetchOrganizers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete organizer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleOpenResetDialog = (organizer) => {
    setResetDialog({ open: true, organizer });
    setNewPassword('');
    setError('');
    setSuccess('');
  };

  const handleCloseResetDialog = () => {
    setResetDialog({ open: false, organizer: null });
    setNewPassword('');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await adminAPI.resetPassword(resetDialog.organizer._id, newPassword);
      setSuccess(`Password reset successfully! New password: ${newPassword}`);
      handleCloseResetDialog();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4">Admin Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage organizers and system settings
          </Typography>
        </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {stats.users.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Participants
                </Typography>
                <Typography variant="h4">
                  {stats.users.participants}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Organizers
                </Typography>
                <Typography variant="h4">
                  {stats.users.organizers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Organizers
                </Typography>
                <Typography variant="h4">
                  {stats.organizers.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Organizer Management</Typography>
          <Button
            variant="contained"
            onClick={handleOpenDialog}
          >
            + Create New Organizer
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No organizers found
                  </TableCell>
                </TableRow>
              ) : (
                organizers.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>{org.organizerName || `${org.firstName} ${org.lastName}`}</TableCell>
                    <TableCell>{org.email}</TableCell>
                    <TableCell>{org.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={org.isActive ? 'Active' : 'Inactive'}
                        color={org.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenResetDialog(org)}
                        title="Reset Password"
                      >
                        <LockReset />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteOrganizer(org._id)}
                        title="Delete"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Club/Organizer</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {credentials ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                ✅ Organizer Created Successfully!
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                <strong>Auto-Generated Login Credentials:</strong>
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  <strong>Email:</strong> {credentials.email}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  <strong>Password:</strong> {credentials.password}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>IMPORTANT:</strong> Copy and share these credentials with the organizer immediately.
                </Typography>
              </Alert>
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                <Typography variant="caption">
                  📧 <strong>Login email and password will be auto-generated</strong> by the system based on the organizer name.
                </Typography>
              </Alert>
              <Box component="form" onSubmit={handleCreateOrganizer} autoComplete="off">
                <TextField
                  fullWidth
                  label="Club/Organizer Name"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  required
                  margin="normal"
                  placeholder="e.g., Sports Committee, Cultural Club"
                  helperText="This will be used to generate the login email"
                />
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option value="">Select Category</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Technical">Technical</option>
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Brief description of the club/organizer"
                />
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  margin="normal"
                  placeholder="Public contact email for participants"
                  helperText="This email will be shown to participants (different from login email)"
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {credentials ? 'Close' : 'Cancel'}
          </Button>
          {!credentials && (
            <Button onClick={handleCreateOrganizer} variant="contained">
              Create Organizer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={resetDialog.open} onClose={handleCloseResetDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Resetting password for: <strong>{resetDialog.organizer?.organizerName}</strong>
          </Typography>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            autoComplete="new-password"
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default AdminDashboard;
