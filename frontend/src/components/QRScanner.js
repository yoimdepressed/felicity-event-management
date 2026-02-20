import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    Alert,
    CircularProgress,
    InputAdornment,
    Tabs,
    Tab,
} from '@mui/material';
import {
    CameraAlt,
    Upload,
    QrCode2,
    Edit,
} from '@mui/icons-material';

const QRScanner = ({ onScan, onError }) => {
    const [tabValue, setTabValue] = useState(0);
    const [manualInput, setManualInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        setCameraError('');
        setScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                scanFrame();
            }
        } catch (err) {
            setCameraError('Camera access denied. Please allow camera permissions or use manual entry.');
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setScanning(false);
    };

    const scanFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !scanning) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try to use jsQR if available
            try {
                // Dynamic import - jsQR must be installed
                import('jsqr').then(({ default: jsQR }) => {
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        stopCamera();
                        handleQRData(code.data);
                        return;
                    }
                    if (scanning) {
                        requestAnimationFrame(scanFrame);
                    }
                }).catch(() => {
                    setCameraError('QR scanning library not available. Please use manual entry or file upload.');
                    stopCamera();
                });
            } catch {
                requestAnimationFrame(scanFrame);
            }
        } else {
            requestAnimationFrame(scanFrame);
        }
    }, [scanning]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                try {
                    import('jsqr').then(({ default: jsQR }) => {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            handleQRData(code.data);
                        } else {
                            onError?.('No QR code found in image');
                        }
                    }).catch(() => {
                        onError?.('QR scanning library not available');
                    });
                } catch {
                    onError?.('Failed to process image');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleQRData = (data) => {
        try {
            const parsed = JSON.parse(data);
            onScan?.(parsed);
        } catch {
            // If not JSON, treat as ticket ID
            onScan?.({ ticketId: data });
        }
    };

    const handleManualSubmit = () => {
        if (!manualInput.trim()) return;
        onScan?.({ ticketId: manualInput.trim() });
        setManualInput('');
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    <QrCode2 sx={{ mr: 1, verticalAlign: 'middle' }} />
                    QR Scanner
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); stopCamera(); }}>
                        <Tab label="Camera" icon={<CameraAlt />} iconPosition="start" />
                        <Tab label="Upload Image" icon={<Upload />} iconPosition="start" />
                        <Tab label="Manual Entry" icon={<Edit />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Camera Tab */}
                {tabValue === 0 && (
                    <Box textAlign="center">
                        {cameraError && (
                            <Alert severity="warning" sx={{ mb: 2 }}>{cameraError}</Alert>
                        )}
                        {scanning ? (
                            <>
                                <video
                                    ref={videoRef}
                                    style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                <Box mt={2}>
                                    <Button variant="outlined" color="error" onClick={stopCamera}>
                                        Stop Camera
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Button variant="contained" startIcon={<CameraAlt />} onClick={startCamera}>
                                Start Camera Scan
                            </Button>
                        )}
                    </Box>
                )}

                {/* Upload Tab */}
                {tabValue === 1 && (
                    <Box textAlign="center">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<Upload />}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload QR Code Image
                        </Button>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Upload a photo or screenshot of the QR code
                        </Typography>
                    </Box>
                )}

                {/* Manual Entry Tab */}
                {tabValue === 2 && (
                    <Box>
                        <TextField
                            fullWidth
                            label="Ticket ID"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
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
                            onClick={handleManualSubmit}
                            disabled={!manualInput.trim()}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Submit
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default QRScanner;
