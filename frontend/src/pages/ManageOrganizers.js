import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import {
    Container,
    Box,
    Typography,
    Button,
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
    FormControlLabel,
    Radio,
    RadioGroup,
} from '@mui/material';
import {
    Delete,
    LockReset,
    Add,
    Search,
    ArrowBack,
    Archive,
    Restore,
    DeleteForever,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ManageOrganizers = () => {
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Create organizer dialog
    const [openCreate, setOpenCreate] = useState(false);
    const [formData, setFormData] = useState({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: '',
    });
    const [credentials, setCredentials] = useState(null);

    // Reset password dialog
    const [resetDialog, setResetDialog] = useState({ open: false, organizer: null });
    const [newPassword, setNewPassword] = useState('');

    // Delete/Archive dialog
    const [deleteDialog, setDeleteDialog] = useState({ open: false, organizer: null });
    const [deleteAction, setDeleteAction] = useState('archive'); // 'archive' or 'permanent'

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllOrganizers();
            setOrganizers(response.data.organizers || []);
        } catch (err) {
            setError('Failed to fetch organizers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrganizer = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await adminAPI.createOrganizer(formData);
            setSuccess('Organizer created successfully!');
            setCredentials({
                email: response.data.credentials.email,
                password: response.data.credentials.password,
            });
            fetchOrganizers();
            setFormData({ organizerName: '', category: '', description: '', contactEmail: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create organizer');
        }
    };

    const handleDeleteOrganizer = async () => {
        try {
            if (deleteAction === 'permanent') {
                await adminAPI.permanentDeleteOrganizer(deleteDialog.organizer._id);
                setSuccess('Organizer permanently deleted');
            } else {
                await adminAPI.archiveOrganizer(deleteDialog.organizer._id);
                setSuccess('Organizer archived (disabled) successfully');
            }
            setDeleteDialog({ open: false, organizer: null });
            setDeleteAction('archive');
            fetchOrganizers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove organizer');
        }
    };

    const handleRestoreOrganizer = async (org) => {
        try {
            await adminAPI.restoreOrganizer(org._id);
            setSuccess(`${org.organizerName || 'Organizer'} restored successfully`);
            fetchOrganizers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to restore organizer');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        try {
            await adminAPI.resetPassword(resetDialog.organizer._id, newPassword);
            setSuccess(`Password reset successfully! New password: ${newPassword}`);
            setResetDialog({ open: false, organizer: null });
            setNewPassword('');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
    };

    const filteredOrganizers = organizers.filter(org => {
        if (!searchTerm) return true;
        const name = (org.organizerName || `${org.firstName} ${org.lastName}`).toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || org.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin')} sx={{ mb: 1 }}>
                            Back to Dashboard
                        </Button>
                        <Typography variant="h4">Manage Clubs/Organizers</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create, manage, archive, and remove organizer accounts
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setOpenCreate(true); setCredentials(null); setError(''); }}>
                        Add New Club/Organizer
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                {/* Search */}
                <TextField
                    placeholder="Search organizers..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    }}
                    sx={{ mb: 2, width: 300 }}
                />

                {/* Organizers Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Club Name</strong></TableCell>
                                <TableCell><strong>Login Email</strong></TableCell>
                                <TableCell><strong>Category</strong></TableCell>
                                <TableCell><strong>Contact</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="center"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredOrganizers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        {loading ? 'Loading...' : 'No organizers found'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrganizers.map((org) => (
                                    <TableRow key={org._id} hover sx={{ opacity: org.isActive ? 1 : 0.6 }}>
                                        <TableCell>
                                            <Typography fontWeight={600}>
                                                {org.organizerName || `${org.firstName} ${org.lastName}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{org.email}</TableCell>
                                        <TableCell>
                                            <Chip label={org.category || 'Unknown'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{org.contactEmail || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={org.isActive ? 'Active' : 'Archived'}
                                                color={org.isActive ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Reset Password">
                                                <IconButton size="small" color="primary" onClick={() => { setResetDialog({ open: true, organizer: org }); setNewPassword(''); setError(''); }}>
                                                    <LockReset />
                                                </IconButton>
                                            </Tooltip>
                                            {org.isActive ? (
                                                <Tooltip title="Archive (Disable)">
                                                    <IconButton size="small" color="warning" onClick={() => { setDeleteDialog({ open: true, organizer: org }); setDeleteAction('archive'); }}>
                                                        <Archive />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Restore (Re-enable)">
                                                    <IconButton size="small" color="success" onClick={() => handleRestoreOrganizer(org)}>
                                                        <Restore />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Permanently Delete">
                                                <IconButton size="small" color="error" onClick={() => { setDeleteDialog({ open: true, organizer: org }); setDeleteAction('permanent'); }}>
                                                    <DeleteForever />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Create Organizer Dialog */}
                <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Club/Organizer</DialogTitle>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {credentials ? (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>✅ Organizer Created!</Typography>
                                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, my: 2 }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                                        <strong>Email:</strong> {credentials.email}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        <strong>Password:</strong> {credentials.password}
                                    </Typography>
                                </Box>
                                <Alert severity="warning">
                                    <strong>IMPORTANT:</strong> Copy and share these credentials with the organizer immediately.
                                </Alert>
                            </Alert>
                        ) : (
                            <>
                                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                                    📧 Login email and password will be auto-generated.
                                </Alert>
                                <TextField fullWidth label="Club/Organizer Name" name="organizerName" value={formData.organizerName} onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })} required margin="normal" />
                                <TextField fullWidth select label="Category" name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required margin="normal" SelectProps={{ native: true }}>
                                    <option value="">Select Category</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Technical">Technical</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Literary">Literary</option>
                                    <option value="Other">Other</option>
                                </TextField>
                                <TextField fullWidth label="Description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required margin="normal" multiline rows={3} />
                                <TextField fullWidth label="Contact Email" name="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} required margin="normal" />
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreate(false)}>{credentials ? 'Close' : 'Cancel'}</Button>
                        {!credentials && <Button onClick={handleCreateOrganizer} variant="contained">Create</Button>}
                    </DialogActions>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, organizer: null })} maxWidth="xs" fullWidth>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Resetting password for: <strong>{resetDialog.organizer?.organizerName}</strong>
                        </Typography>
                        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" helperText="Minimum 6 characters" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResetDialog({ open: false, organizer: null })}>Cancel</Button>
                        <Button onClick={handleResetPassword} variant="contained">Reset Password</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete/Archive Confirmation Dialog */}
                <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, organizer: null })} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {deleteAction === 'permanent' ? '⚠️ Permanently Delete Organizer' : '📦 Archive Organizer'}
                    </DialogTitle>
                    <DialogContent>
                        <Typography gutterBottom>
                            {deleteAction === 'permanent' ? (
                                <>
                                    Are you sure you want to <strong>permanently delete</strong> <strong>{deleteDialog.organizer?.organizerName}</strong>?
                                    This action <strong>cannot be undone</strong>. All data associated with this organizer will be removed.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to <strong>archive (disable)</strong> <strong>{deleteDialog.organizer?.organizerName}</strong>?
                                    They will not be able to log in, but their data will be preserved. You can restore them later.
                                </>
                            )}
                        </Typography>

                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Choose action:</Typography>
                            <RadioGroup value={deleteAction} onChange={(e) => setDeleteAction(e.target.value)}>
                                <FormControlLabel
                                    value="archive"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>Archive (Disable)</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Account is disabled but data is preserved. Can be restored later.
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="permanent"
                                    control={<Radio color="error" />}
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={500} color="error.main">Permanently Delete</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Permanently removes the organizer from the system. Cannot be undone.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog({ open: false, organizer: null })}>Cancel</Button>
                        <Button
                            onClick={handleDeleteOrganizer}
                            variant="contained"
                            color={deleteAction === 'permanent' ? 'error' : 'warning'}
                        >
                            {deleteAction === 'permanent' ? 'Permanently Delete' : 'Archive'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default ManageOrganizers;
