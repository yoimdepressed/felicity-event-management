import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    QrCode2,
    CameraAlt,
    Upload,
    Edit,
    CheckCircle,
    Cancel,
    Search,
    Download,
    Refresh,
} from '@mui/icons-material';
import api from '../services/api';

const AttendanceDashboard = ({ eventId }) => {
    const [tabValue, setTabValue] = useState(0);
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState('');
    const [manualTicketId, setManualTicketId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [auditLog, setAuditLog] = useState([]);

    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/event/${eventId}`);
            if (response.data.success) {
                setRegistrations(response.data.data.registrations);
                setStats(response.data.data.stats);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const fetchAuditLog = useCallback(async () => {
        try {
            const response = await api.get(`/attendance/event/${eventId}/audit`);
            if (response.data.success) {
                setAuditLog(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching audit log:', err);
        }
    }, [eventId]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleManualScan = async () => {
        if (!manualTicketId.trim()) return;
        setScanError('');
        setScanResult(null);
        try {
            const response = await api.post('/attendance/scan', {
                ticketId: manualTicketId.trim(),
                eventId,
            });
            setScanResult(response.data);
            setManualTicketId('');
            fetchAttendance();
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed');
        }
    };

    const handleManualOverride = async (registrationId, markAttended) => {
        try {
            await api.post('/attendance/manual', {
                registrationId,
                markAttended,
                reason: 'Manual override by organizer',
            });
            fetchAttendance();
        } catch (err) {
            console.error('Manual override error:', err);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Name', 'Email', 'Ticket ID', 'Status', 'Attended At', 'Method'];
        const rows = registrations.map(r => [
            `${r.participant?.firstName || ''} ${r.participant?.lastName || ''}`,
            r.participant?.email || '',
            r.ticketId || '',
            r.attended ? 'Present' : 'Absent',
            r.attendedAt ? new Date(r.attendedAt).toLocaleString('en-IN') : '',
            r.scanMethod || '',
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredRegistrations = registrations.filter(r => {
        if (!searchTerm) return true;
        const name = `${r.participant?.firstName || ''} ${r.participant?.lastName || ''}`.toLowerCase();
        const email = (r.participant?.email || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Stats Cards */}
            {stats && (
                <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="primary">{stats.total}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Registered</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="success.main">{stats.attended}</Typography>
                            <Typography variant="body2" color="text.secondary">Present</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="error.main">{stats.notAttended}</Typography>
                            <Typography variant="body2" color="text.secondary">Absent</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">{stats.attendanceRate}%</Typography>
                            <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Mark Attendance" icon={<QrCode2 />} iconPosition="start" />
                    <Tab label="Attendance List" icon={<Search />} iconPosition="start" />
                    <Tab label="Audit Log" icon={<Edit />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* Tab 0: Mark Attendance */}
            {tabValue === 0 && (
                <Box>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <QrCode2 sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Enter Ticket ID
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Enter the ticket ID from the participant's QR code or ticket
                            </Typography>

                            {scanResult && (
                                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScanResult(null)}>
                                    {scanResult.message} — {scanResult.data?.participant?.firstName} {scanResult.data?.participant?.lastName}
                                </Alert>
                            )}
                            {scanError && (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScanError('')}>
                                    {scanError}
                                </Alert>
                            )}

                            <Box display="flex" gap={2}>
                                <TextField
                                    fullWidth
                                    label="Ticket ID"
                                    value={manualTicketId}
                                    onChange={(e) => setManualTicketId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                                    placeholder="e.g., FLTCTY-ABC123"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <QrCode2 />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleManualScan}
                                    disabled={!manualTicketId.trim()}
                                    sx={{ minWidth: 120 }}
                                >
                                    Mark Present
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Tab 1: Attendance List */}
            {tabValue === 1 && (
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <TextField
                            placeholder="Search by name or email..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 300 }}
                        />
                        <Box display="flex" gap={1}>
                            <Button size="small" startIcon={<Refresh />} onClick={fetchAttendance}>
                                Refresh
                            </Button>
                            <Button size="small" startIcon={<Download />} onClick={handleExportCSV}>
                                Export CSV
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Ticket ID</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Time</strong></TableCell>
                                    <TableCell align="center"><strong>Action</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRegistrations.map((reg) => (
                                    <TableRow key={reg._id} hover>
                                        <TableCell>{reg.participant?.firstName} {reg.participant?.lastName}</TableCell>
                                        <TableCell>{reg.participant?.email}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                {reg.ticketId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={reg.attended ? 'Present' : 'Absent'}
                                                color={reg.attended ? 'success' : 'default'}
                                                size="small"
                                                icon={reg.attended ? <CheckCircle /> : <Cancel />}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {reg.attendedAt ? new Date(reg.attendedAt).toLocaleTimeString('en-IN') : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={reg.attended ? 'error' : 'success'}
                                                onClick={() => handleManualOverride(reg._id, !reg.attended)}
                                            >
                                                {reg.attended ? 'Unmark' : 'Mark Present'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRegistrations.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No registrations found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Tab 2: Audit Log */}
            {tabValue === 2 && (
                <Box>
                    <Button size="small" startIcon={<Refresh />} onClick={fetchAuditLog} sx={{ mb: 2 }}>
                        Load Audit Log
                    </Button>
                    {auditLog.length > 0 ? (
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Participant</strong></TableCell>
                                        <TableCell><strong>Ticket</strong></TableCell>
                                        <TableCell><strong>Action</strong></TableCell>
                                        <TableCell><strong>Time</strong></TableCell>
                                        <TableCell><strong>Method</strong></TableCell>
                                        <TableCell><strong>By</strong></TableCell>
                                        <TableCell><strong>Reason</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditLog.map((entry, i) => (
                                        <TableRow key={i} hover>
                                            <TableCell>{entry.participant?.firstName} {entry.participant?.lastName}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{entry.ticketId}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={entry.attended ? 'Marked Present' : 'Unmarked'}
                                                    color={entry.attended ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{entry.attendedAt ? new Date(entry.attendedAt).toLocaleString('en-IN') : '-'}</TableCell>
                                            <TableCell>{entry.scanMethod}</TableCell>
                                            <TableCell>{entry.scannedBy?.firstName} {entry.scannedBy?.lastName}</TableCell>
                                            <TableCell>{entry.overrideReason || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                            Click "Load Audit Log" to view attendance history
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AttendanceDashboard;
