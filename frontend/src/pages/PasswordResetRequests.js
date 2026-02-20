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
    Alert,
    Chip,
    Tabs,
    Tab,
    CircularProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PasswordResetRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Approve dialog
    const [approveDialog, setApproveDialog] = useState({ open: false, request: null });
    const [newPassword, setNewPassword] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    // Reject dialog
    const [rejectDialog, setRejectDialog] = useState({ open: false, request: null });
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [tabValue]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const statusMap = ['pending', 'approved', 'rejected'];
            const response = await api.get('/admin/password-resets', { params: { status: statusMap[tabValue] } });
            setRequests(response.data.data || []);
        } catch (err) {
            // If endpoint doesn't exist yet, show empty state
            console.error('Error fetching requests:', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        try {
            await api.put(`/admin/password-resets/${approveDialog.request._id}/approve`, {
                newPassword,
                adminNotes,
            });
            setSuccess('Password reset approved and applied!');
            setApproveDialog({ open: false, request: null });
            setNewPassword('');
            setAdminNotes('');
            fetchRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve request');
        }
    };

    const handleReject = async () => {
        try {
            await api.put(`/admin/password-resets/${rejectDialog.request._id}/reject`, {
                adminNotes: rejectNotes,
            });
            setSuccess('Request rejected');
            setRejectDialog({ open: false, request: null });
            setRejectNotes('');
            fetchRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject request');
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin')} sx={{ mb: 1 }}>
                    Back to Dashboard
                </Button>
                <Typography variant="h4" gutterBottom>Password Reset Requests</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Review and manage password reset requests from organizers
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                    <Tab label="Pending" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                </Tabs>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Organizer</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Reason</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    {tabValue === 0 && <TableCell align="center"><strong>Actions</strong></TableCell>}
                                    {tabValue !== 0 && <TableCell><strong>Admin Notes</strong></TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No requests found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req._id} hover>
                                            <TableCell>
                                                {req.user?.organizerName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`}
                                            </TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>{req.reason}</TableCell>
                                            <TableCell>{new Date(req.createdAt).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={req.status}
                                                    size="small"
                                                    color={
                                                        req.status === 'approved' ? 'success' :
                                                            req.status === 'rejected' ? 'error' : 'warning'
                                                    }
                                                />
                                            </TableCell>
                                            {tabValue === 0 && (
                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        color="success"
                                                        startIcon={<CheckCircle />}
                                                        onClick={() => { setApproveDialog({ open: true, request: req }); setNewPassword(''); setAdminNotes(''); setError(''); }}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<Cancel />}
                                                        onClick={() => { setRejectDialog({ open: true, request: req }); setRejectNotes(''); }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </TableCell>
                                            )}
                                            {tabValue !== 0 && (
                                                <TableCell>{req.adminNotes || '-'}</TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Approve Dialog */}
                <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, request: null })} maxWidth="sm" fullWidth>
                    <DialogTitle>Approve Password Reset</DialogTitle>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Typography variant="body2" mb={2}>
                            Approving request for: <strong>{approveDialog.request?.user?.organizerName || approveDialog.request?.email}</strong>
                        </Typography>
                        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" required helperText="Min 6 characters" />
                        <TextField fullWidth label="Admin Notes (Optional)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} margin="normal" multiline rows={2} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setApproveDialog({ open: false, request: null })}>Cancel</Button>
                        <Button onClick={handleApprove} variant="contained" color="success">Approve & Reset Password</Button>
                    </DialogActions>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, request: null })} maxWidth="sm" fullWidth>
                    <DialogTitle>Reject Password Reset</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" mb={2}>
                            Rejecting request from: <strong>{rejectDialog.request?.user?.organizerName || rejectDialog.request?.email}</strong>
                        </Typography>
                        <TextField fullWidth label="Reason for Rejection" value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} margin="normal" multiline rows={2} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRejectDialog({ open: false, request: null })}>Cancel</Button>
                        <Button onClick={handleReject} variant="contained" color="error">Reject</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default PasswordResetRequests;
