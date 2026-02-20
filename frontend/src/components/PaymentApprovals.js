import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Alert,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton,
} from '@mui/material';
import {
    CheckCircle, Cancel, Image, Refresh, Visibility,
} from '@mui/icons-material';
import { paymentAPI } from '../services/api';

const PaymentApprovals = ({ eventId }) => {
    const [tabValue, setTabValue] = useState(0);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionDialog, setActionDialog] = useState({ open: false, reg: null, action: '' });
    const [adminNotes, setAdminNotes] = useState('');
    const [viewProof, setViewProof] = useState(null);

    const statusMap = ['Pending', 'Approved', 'Rejected'];
    const currentStatus = statusMap[tabValue] || 'all';

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await paymentAPI.getPendingPayments(eventId, currentStatus);
            if (response.data.success) {
                setRegistrations(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch payment records');
        } finally {
            setLoading(false);
        }
    }, [eventId, currentStatus]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleApprove = async () => {
        if (!actionDialog.reg) return;
        try {
            await paymentAPI.approvePayment(actionDialog.reg._id, adminNotes);
            setSuccess('Payment approved! QR code generated and confirmation email sent.');
            setActionDialog({ open: false, reg: null, action: '' });
            setAdminNotes('');
            fetchPayments();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve payment');
        }
    };

    const handleReject = async () => {
        if (!actionDialog.reg) return;
        try {
            await paymentAPI.rejectPayment(actionDialog.reg._id, adminNotes);
            setSuccess('Payment rejected.');
            setActionDialog({ open: false, reg: null, action: '' });
            setAdminNotes('');
            fetchPayments();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject payment');
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Payment Approvals</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Filter Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Pending" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                </Tabs>
            </Box>

            <Button size="small" startIcon={<Refresh />} onClick={fetchPayments} sx={{ mb: 2 }}>
                Refresh
            </Button>

            {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : registrations.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    No {currentStatus.toLowerCase()} payment records found.
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Participant</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Item Details</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Payment Proof</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                {tabValue === 0 && <TableCell align="center"><strong>Actions</strong></TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {registrations.map((reg) => (
                                <TableRow key={reg._id} hover>
                                    <TableCell>
                                        {reg.participant?.firstName} {reg.participant?.lastName}
                                    </TableCell>
                                    <TableCell>{reg.participant?.email}</TableCell>
                                    <TableCell>
                                        {reg.merchandiseDetails && (
                                            <Box>
                                                {reg.merchandiseDetails.size && (
                                                    <Chip label={`Size: ${reg.merchandiseDetails.size}`} size="small" sx={{ mr: 0.5 }} />
                                                )}
                                                {reg.merchandiseDetails.color && (
                                                    <Chip label={`Color: ${reg.merchandiseDetails.color}`} size="small" sx={{ mr: 0.5 }} />
                                                )}
                                                <Chip label={`Qty: ${reg.merchandiseDetails.quantity || 1}`} size="small" />
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>₹{reg.amountPaid || 0}</TableCell>
                                    <TableCell>
                                        {reg.paymentProofUrl ? (
                                            <Button
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={() => setViewProof(`http://localhost:5000${reg.paymentProofUrl}`)}
                                            >
                                                View
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">Not uploaded</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reg.paymentApproval?.status || reg.registrationStatus}
                                            color={
                                                reg.paymentApproval?.status === 'Approved' ? 'success' :
                                                    reg.paymentApproval?.status === 'Rejected' ? 'error' : 'warning'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                                    </TableCell>
                                    {tabValue === 0 && (
                                        <TableCell align="center">
                                            <Box display="flex" gap={0.5} justifyContent="center">
                                                <Button
                                                    size="small" variant="contained" color="success"
                                                    startIcon={<CheckCircle />}
                                                    onClick={() => {
                                                        setActionDialog({ open: true, reg, action: 'approve' });
                                                        setAdminNotes('');
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="small" variant="outlined" color="error"
                                                    startIcon={<Cancel />}
                                                    onClick={() => {
                                                        setActionDialog({ open: true, reg, action: 'reject' });
                                                        setAdminNotes('');
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Approval/Rejection Dialog */}
            <Dialog
                open={actionDialog.open}
                onClose={() => setActionDialog({ open: false, reg: null, action: '' })}
                maxWidth="sm" fullWidth
            >
                <DialogTitle>
                    {actionDialog.action === 'approve' ? '✅ Approve Payment' : '❌ Reject Payment'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={2}>
                        {actionDialog.action === 'approve'
                            ? 'Approving will generate a QR ticket and send a confirmation email.'
                            : 'Rejecting will mark the order as failed. No QR or ticket will be generated.'}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                        <strong>Participant:</strong> {actionDialog.reg?.participant?.firstName} {actionDialog.reg?.participant?.lastName}
                    </Typography>
                    <Typography variant="body2" mb={2}>
                        <strong>Amount:</strong> ₹{actionDialog.reg?.amountPaid || 0}
                    </Typography>
                    <TextField
                        fullWidth
                        label="Admin Notes (optional)"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        multiline rows={2}
                        placeholder="Add any notes about this decision..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({ open: false, reg: null, action: '' })}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={actionDialog.action === 'approve' ? 'success' : 'error'}
                        onClick={actionDialog.action === 'approve' ? handleApprove : handleReject}
                    >
                        {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Proof Viewer */}
            <Dialog open={!!viewProof} onClose={() => setViewProof(null)} maxWidth="md">
                <DialogTitle>Payment Proof</DialogTitle>
                <DialogContent>
                    {viewProof && (
                        <Box component="img" src={viewProof} alt="Payment Proof" sx={{ width: '100%', maxHeight: 500, objectFit: 'contain' }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewProof(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentApprovals;
