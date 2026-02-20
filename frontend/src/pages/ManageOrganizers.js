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
  Tooltip,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  LockReset,
  Add,
  Search,
  Business,
  Email,
  Category,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Block,
  CheckCircle,
  DeleteForever,
} from '@mui/icons-material';

const ManageOrganizers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOrganizers();
  }, [user, navigate]);

  useEffect(() => {
    // Filter organizers based on search term
    if (searchTerm.trim() === '') {
      setFilteredOrganizers(organizers);
    } else {
      const filtered = organizers.filter(
        (org) =>
          org.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrganizers(filtered);
    }
  }, [searchTerm, organizers]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data.organizers || []);
      setFilteredOrganizers(response.data.organizers || []);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
      setError('Failed to load organizers');
    } finally {
      setLoading(false);
    }
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
    setError('');
    setCredentials(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
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
      // Don't close dialog so admin can see and copy credentials
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
    if (window.confirm('Are you sure you want to DISABLE this organizer? They will not be able to log in.')) {
      try {
        await adminAPI.deleteOrganizer(id);
        setSuccess('Organizer disabled successfully');
        fetchOrganizers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to disable organizer');
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable';
    if (window.confirm(`Are you sure you want to ${action} this organizer?`)) {
      try {
        await adminAPI.toggleOrganizerActive(id);
        setSuccess(`Organizer ${action}d successfully`);
        fetchOrganizers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || `Failed to ${action} organizer`);
      }
    }
  };

  const handlePermanentDelete = async (id, organizerName) => {
    const confirmMessage = `⚠️ PERMANENT DELETE\n\nThis will PERMANENTLY delete "${organizerName}" and ALL their data:\n• All events created\n• All registrations\n• All data (cannot be recovered)\n\nType "DELETE" to confirm:`;
    const userInput = window.prompt(confirmMessage);
    
    if (userInput === 'DELETE') {
      try {
        await adminAPI.permanentlyDeleteOrganizer(id);
        setSuccess('Organizer permanently deleted');
        fetchOrganizers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to permanently delete organizer');
      }
    } else if (userInput !== null) {
      setError('Deletion cancelled - incorrect confirmation text');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleOpenResetDialog = (organizer) => {
    setResetDialog({ open: true, organizer });
    setNewPassword('');
    setError('');
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
      setSuccess('Password reset successfully!');
      handleCloseResetDialog();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

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
              Manage Clubs & Organizers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create, manage, and monitor all event organizers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            size="large"
          >
            Create Organizer
          </Button>
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

        {/* Search Bar */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, or category..."
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
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {organizers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Organizers
                    </Typography>
                  </Box>
                  <Business sx={{ fontSize: 48, color: 'primary.main' }} />
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
                      {organizers.filter((o) => o.isActive).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Organizers
                    </Typography>
                  </Box>
                  <Business sx={{ fontSize: 48, color: 'success.main' }} />
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
                      {filteredOrganizers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search Results
                    </Typography>
                  </Box>
                  <Search sx={{ fontSize: 48, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Organizers Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Organizers List
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredOrganizers.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'No organizers found matching your search' : 'No organizers created yet'}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Organizer Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Contact Email</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrganizers.map((organizer) => (
                      <TableRow key={organizer._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {organizer.organizerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {organizer.firstName} {organizer.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>{organizer.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={organizer.category}
                            size="small"
                            color={
                              organizer.category === 'Technical'
                                ? 'primary'
                                : organizer.category === 'Cultural'
                                ? 'secondary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{organizer.contactEmail || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={organizer.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={organizer.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleOpenResetDialog(organizer)}
                            >
                              <LockReset />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={organizer.isActive ? "Disable Account" : "Enable Account"}>
                            <IconButton
                              size="small"
                              color={organizer.isActive ? "error" : "success"}
                              onClick={() => handleToggleActive(organizer._id, organizer.isActive)}
                            >
                              {organizer.isActive ? <Block /> : <CheckCircle />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Permanently Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handlePermanentDelete(organizer._id, organizer.organizerName)}
                            >
                              <DeleteForever />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Create Organizer Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Club/Organizer</DialogTitle>
          <DialogContent>
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
                    They can log in right away using these credentials.
                  </Typography>
                </Alert>
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="caption">
                    📧 <strong>Login email and password will be auto-generated</strong> by the system 
                    based on the organizer name. You'll receive the credentials after creation.
                  </Typography>
                </Alert>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Club/Organizer Name"
                        name="organizerName"
                        value={formData.organizerName}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Sports Committee, Cultural Club"
                        helperText="This will be used to generate the login email"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        SelectProps={{ native: true }}
                      >
                        <option value="">Select Category</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Technical">Technical</option>
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Other">Other</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        required
                        placeholder="Brief description of the club/organizer"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Contact Email"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                        placeholder="Public contact email for participants"
                        helperText="This email will be shown to participants (different from login email)"
                      />
                    </Grid>
                  </Grid>
                </form>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {credentials ? 'Close' : 'Cancel'}
            </Button>
            {!credentials && (
              <Button onClick={handleSubmit} variant="contained">
                Create Organizer
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetDialog.open} onClose={handleCloseResetDialog}>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              Reset password for: <strong>{resetDialog.organizer?.organizerName}</strong>
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mt: 2 }}
              helperText="Minimum 6 characters"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResetDialog}>Cancel</Button>
            <Button onClick={handleResetPassword} variant="contained" color="warning">
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ManageOrganizers;
