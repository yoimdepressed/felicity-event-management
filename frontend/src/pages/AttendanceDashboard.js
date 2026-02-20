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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    LinearProgress,
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
    Stop,
    PhotoCamera,
} from '@mui/icons-material';
import api from '../services/api';
import jsQR from 'jsqr';

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

    // Camera QR scanning state
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Manual override dialog
    const [overrideDialog, setOverrideDialog] = useState({ open: false, reg: null });
    const [overrideReason, setOverrideReason] = useState('');

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
            setScanError(err.response?.data?.message || 'Failed to load attendance data');
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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // ========================
    // CAMERA QR SCANNER
    // ========================
    const startCamera = async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);

            // Start scanning frames for QR codes
            scanIntervalRef.current = setInterval(() => {
                scanVideoFrame();
            }, 500);
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Camera access denied or not available. Use file upload or manual entry instead.');
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const scanVideoFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Try to decode QR using jsQR if available
        if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
                handleQRDetected(code.data);
            }
        }
    };

    const handleQRDetected = async (qrData) => {
        // QR data could be the ticket ID directly or a JSON string
        let ticketId = qrData;
        try {
            const parsed = JSON.parse(qrData);
            ticketId = parsed.ticketId || parsed.ticket || parsed.id || qrData;
        } catch {
            // Not JSON, use as-is (likely the ticket ID directly)
        }

        setScanError('');
        setScanResult(null);
        try {
            const response = await api.post('/attendance/scan', {
                ticketId: ticketId.trim(),
                eventId,
                scanMethod: 'Camera',
            });
            setScanResult(response.data);
            fetchAttendance();
            // Brief pause then continue scanning
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed');
        }
    };

    // ========================
    // FILE UPLOAD QR SCANNER
    // ========================
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanError('');
        setScanResult(null);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (window.jsQR) {
                const code = window.jsQR(imageData.data, imageData.width, imageData.height);
                if (code && code.data) {
                    handleQRFromFile(code.data);
                } else {
                    setScanError('No QR code found in the uploaded image. Try a clearer image.');
                }
            } else {
                setScanError('QR scanning library not loaded. Use manual entry instead.');
            }
        };
        img.onerror = () => setScanError('Failed to load image');
        img.src = URL.createObjectURL(file);
        e.target.value = ''; // Reset input
    };

    const handleQRFromFile = async (qrData) => {
        let ticketId = qrData;
        try {
            const parsed = JSON.parse(qrData);
            ticketId = parsed.ticketId || parsed.ticket || parsed.id || qrData;
        } catch { /* not JSON */ }

        try {
            const response = await api.post('/attendance/scan', {
                ticketId: ticketId.trim(),
                eventId,
                scanMethod: 'FileUpload',
            });
            setScanResult(response.data);
            fetchAttendance();
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed');
        }
    };

    // ========================
    // MANUAL TICKET ENTRY
    // ========================
    const handleManualScan = async () => {
        if (!manualTicketId.trim()) return;
        setScanError('');
        setScanResult(null);
        try {
            const response = await api.post('/attendance/scan', {
                ticketId: manualTicketId.trim(),
                eventId,
                scanMethod: 'Manual',
            });
            setScanResult(response.data);
            setManualTicketId('');
            fetchAttendance();
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed');
        }
    };

    // ========================
    // MANUAL OVERRIDE (with reason)
    // ========================
    const handleManualOverride = async () => {
        if (!overrideDialog.reg) return;
        try {
            await api.post('/attendance/manual', {
                registrationId: overrideDialog.reg._id,
                markAttended: !overrideDialog.reg.attended,
                reason: overrideReason || 'Manual override by organizer',
            });
            setOverrideDialog({ open: false, reg: null });
            setOverrideReason('');
            fetchAttendance();
        } catch (err) {
            console.error('Manual override error:', err);
            setScanError(err.response?.data?.message || 'Override failed');
        }
    };

    // ========================
    // CSV EXPORT
    // ========================
    const handleExportCSV = () => {
        const headers = ['Name', 'Email', 'College', 'Contact', 'Ticket ID', 'Status', 'Attended At', 'Method', 'Override Reason'];
        const rows = registrations.map(r => [
            `"${r.participant?.firstName || ''} ${r.participant?.lastName || ''}"`,
            r.participant?.email || '',
            r.participant?.college || '',
            r.participant?.contactNumber || '',
            r.ticketId || '',
            r.attended ? 'Present' : 'Absent',
            r.attendedAt ? new Date(r.attendedAt).toLocaleString('en-IN') : '',
            r.scanMethod || '',
            r.manualOverride?.reason || '',
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${eventId}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredRegistrations = registrations.filter(r => {
        if (!searchTerm) return true;
        const name = `${r.participant?.firstName || ''} ${r.participant?.lastName || ''}`.toLowerCase();
        const email = (r.participant?.email || '').toLowerCase();
        const ticket = (r.ticketId || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase()) || ticket.includes(searchTerm.toLowerCase());
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
                            <Typography variant="body2" color="text.secondary">Scanned (Present)</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="error.main">{stats.notAttended}</Typography>
                            <Typography variant="body2" color="text.secondary">Not Yet Scanned</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, minWidth: 150 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">{stats.attendanceRate}%</Typography>
                            <LinearProgress variant="determinate" value={stats.attendanceRate} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); if (v === 2) fetchAuditLog(); }}>
                    <Tab label="Scan QR / Mark Attendance" icon={<QrCode2 />} iconPosition="start" />
                    <Tab label="Attendance List" icon={<Search />} iconPosition="start" />
                    <Tab label="Audit Log" icon={<Edit />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* Global alerts */}
            {scanResult && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScanResult(null)}>
                    {scanResult.message}
                </Alert>
            )}
            {scanError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScanError('')}>
                    {scanError}
                </Alert>
            )}

            {/* Tab 0: QR Scanner & Mark Attendance */}
            {tabValue === 0 && (
                <Box>
                    <Grid container spacing={2}>
                        {/* Camera Scanner */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <CameraAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Camera QR Scanner
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Use your device camera to scan participant QR codes
                                    </Typography>

                                    {cameraError && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>{cameraError}</Alert>
                                    )}

                                    {!cameraActive ? (
                                        <Button
                                            variant="contained"
                                            startIcon={<PhotoCamera />}
                                            onClick={startCamera}
                                            fullWidth
                                            size="large"
                                            color="primary"
                                        >
                                            Start Camera Scanner
                                        </Button>
                                    ) : (
                                        <Box>
                                            <Box sx={{
                                                position: 'relative',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: '3px solid #1976d2',
                                                mb: 2,
                                            }}>
                                                <video
                                                    ref={videoRef}
                                                    style={{ width: '100%', display: 'block' }}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                />
                                                {/* Scanning overlay */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '60%',
                                                    height: '60%',
                                                    border: '2px dashed rgba(25, 118, 210, 0.7)',
                                                    borderRadius: 2,
                                                }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 8,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        bgcolor: 'rgba(0,0,0,0.7)',
                                                        color: 'white',
                                                        px: 2,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    Point camera at QR code...
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<Stop />}
                                                onClick={stopCamera}
                                                fullWidth
                                            >
                                                Stop Camera
                                            </Button>
                                        </Box>
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* File Upload & Manual Entry */}
                        <Grid item xs={12} md={6}>
                            {/* File Upload */}
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <Upload sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Upload QR Image
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Upload a photo of the participant's QR code
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<Upload />}
                                        fullWidth
                                    >
                                        Choose Image File
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Manual Entry */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <QrCode2 sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Manual Ticket ID Entry
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Type the ticket ID from the participant's ticket
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        <TextField
                                            fullWidth
                                            label="Ticket ID"
                                            value={manualTicketId}
                                            onChange={(e) => setManualTicketId(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                                            placeholder="e.g., TKT-XXXXX-XXXXX"
                                            size="small"
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
                                            sx={{ minWidth: 100 }}
                                        >
                                            Scan
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Tab 1: Attendance List (scanned vs not-yet-scanned) */}
            {tabValue === 1 && (
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <TextField
                            placeholder="Search by name, email, or ticket..."
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
                            sx={{ width: 350 }}
                        />
                        <Box display="flex" gap={1}>
                            <Button size="small" startIcon={<Refresh />} onClick={fetchAttendance}>
                                Refresh
                            </Button>
                            <Button size="small" variant="contained" startIcon={<Download />} onClick={handleExportCSV}>
                                Export CSV
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell><strong>Participant</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>College</strong></TableCell>
                                    <TableCell><strong>Ticket ID</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Scanned At</strong></TableCell>
                                    <TableCell><strong>Method</strong></TableCell>
                                    <TableCell align="center"><strong>Action</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRegistrations.map((reg) => (
                                    <TableRow
                                        key={reg._id}
                                        hover
                                        sx={{ bgcolor: reg.attended ? 'success.50' : 'inherit' }}
                                    >
                                        <TableCell>
                                            <Typography fontWeight={500}>
                                                {reg.participant?.firstName} {reg.participant?.lastName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{reg.participant?.email}</TableCell>
                                        <TableCell>{reg.participant?.college || '-'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                {reg.ticketId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={reg.attended ? 'Scanned ✓' : 'Not Scanned'}
                                                color={reg.attended ? 'success' : 'default'}
                                                size="small"
                                                icon={reg.attended ? <CheckCircle /> : <Cancel />}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {reg.attendedAt ? new Date(reg.attendedAt).toLocaleString('en-IN') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {reg.scanMethod ? (
                                                <Chip label={reg.scanMethod} size="small" variant="outlined" />
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={reg.attended ? 'warning' : 'success'}
                                                onClick={() => {
                                                    setOverrideDialog({ open: true, reg });
                                                    setOverrideReason('');
                                                }}
                                            >
                                                {reg.attended ? 'Override' : 'Manual Mark'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRegistrations.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                        Refresh Audit Log
                    </Button>
                    {auditLog.length > 0 ? (
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Participant</strong></TableCell>
                                        <TableCell><strong>Ticket</strong></TableCell>
                                        <TableCell><strong>Action</strong></TableCell>
                                        <TableCell><strong>Timestamp</strong></TableCell>
                                        <TableCell><strong>Method</strong></TableCell>
                                        <TableCell><strong>Scanned By</strong></TableCell>
                                        <TableCell><strong>Override Reason</strong></TableCell>
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
                                            <TableCell>
                                                <Chip label={entry.scanMethod} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>{entry.scannedBy?.firstName} {entry.scannedBy?.lastName}</TableCell>
                                            <TableCell>{entry.overrideReason || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography color="text.secondary" textAlign="center" py={4}>
                            No audit log entries yet. Mark attendance to see entries here.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Manual Override Dialog */}
            <Dialog
                open={overrideDialog.open}
                onClose={() => setOverrideDialog({ open: false, reg: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Manual Attendance Override
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={2}>
                        {overrideDialog.reg?.attended
                            ? `Unmark attendance for ${overrideDialog.reg?.participant?.firstName} ${overrideDialog.reg?.participant?.lastName}?`
                            : `Manually mark ${overrideDialog.reg?.participant?.firstName} ${overrideDialog.reg?.participant?.lastName} as present?`
                        }
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This action will be logged in the audit trail.
                    </Alert>
                    <TextField
                        fullWidth
                        label="Reason for override *"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g., Lost ticket, verified identity manually..."
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOverrideDialog({ open: false, reg: null })}>Cancel</Button>
                    <Button
                        onClick={handleManualOverride}
                        variant="contained"
                        color={overrideDialog.reg?.attended ? 'warning' : 'success'}
                    >
                        {overrideDialog.reg?.attended ? 'Unmark Attendance' : 'Mark Present'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendanceDashboard;
