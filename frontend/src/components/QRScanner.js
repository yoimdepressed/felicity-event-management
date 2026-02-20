import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  CheckCircle,
  Error as ErrorIcon,
  Warning
} from '@mui/icons-material';
import jsQR from 'jsqr';
import api from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const QRScanner = ({ eventId, onScanSuccess }) => {
  const [tabValue, setTabValue] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualTicketId, setManualTicketId] = useState('');
  const [processing, setProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Start camera scanning
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setScanning(true);
        
        // Start scanning loop
        scanIntervalRef.current = setInterval(scanFrame, 500);
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
    }
  };

  // Stop camera scanning
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  // Scan QR code from video frame
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRDetected(code.data, 'Camera');
      }
    }
  };

  // Handle QR code detection
  const handleQRDetected = async (qrData, scanMethod) => {
    stopCamera();
    setProcessing(true);
    setError(null);

    try {
      // Extract ticket ID from QR data
      let ticketId = qrData;
      
      // If QR data is JSON, extract ticketId
      try {
        const parsed = JSON.parse(qrData);
        ticketId = parsed.ticketId || qrData;
      } catch {
        // QR data is plain text ticket ID
      }

      // Call scan API
      const response = await api.post('/attendance/scan', {
        ticketId,
        scanMethod
      });

      setScanResult({
        type: 'success',
        message: response.data.message,
        data: response.data.data
      });

      if (onScanSuccess) {
        onScanSuccess(response.data.data);
      }

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setManualTicketId('');
      }, 3000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to scan QR code';
      setScanResult({
        type: 'error',
        message: errorMessage,
        data: err.response?.data?.data
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            handleQRDetected(code.data, 'FileUpload');
          } else {
            setError('No QR code found in the image. Please try another image.');
            setProcessing(false);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      setProcessing(false);
    }
  };

  // Handle manual ticket ID entry
  const handleManualScan = async () => {
    if (!manualTicketId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }
    await handleQRDetected(manualTicketId.trim(), 'Manual');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          QR Code Scanner
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Camera Scan" icon={<CameraAlt />} iconPosition="start" />
          <Tab label="Upload QR Image" icon={<Upload />} iconPosition="start" />
          <Tab label="Manual Entry" icon={<Typography variant="caption">#</Typography>} iconPosition="start" />
        </Tabs>

        {/* Camera Scan Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={2}>
            {!cameraActive ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<CameraAlt />}
                onClick={startCamera}
                disabled={processing}
                fullWidth
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={stopCamera}
                disabled={processing}
                fullWidth
              >
                Stop Camera
              </Button>
            )}

            {cameraActive && (
              <Paper sx={{ position: 'relative', bgcolor: 'black' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '400px' }}
                />
                {scanning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      p: 2,
                      borderRadius: 1
                    }}
                  >
                    <Typography>Scanning...</Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Stack>
        </TabPanel>

        {/* File Upload Tab */}
        <TabPanel value={tabValue} index={1}>
          <Button
            variant="contained"
            component="label"
            startIcon={<Upload />}
            disabled={processing}
            fullWidth
          >
            Upload QR Code Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </TabPanel>

        {/* Manual Entry Tab */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={2}>
            <TextField
              label="Ticket ID"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Enter ticket ID manually"
              fullWidth
              disabled={processing}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualScan();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleManualScan}
              disabled={processing || !manualTicketId.trim()}
              fullWidth
            >
              Verify Ticket
            </Button>
          </Stack>
        </TabPanel>

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Processing indicator */}
        {processing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Scan result */}
        {scanResult && (
          <Alert
            severity={scanResult.type}
            icon={scanResult.type === 'success' ? <CheckCircle /> : scanResult.type === 'error' ? <ErrorIcon /> : <Warning />}
            sx={{ mt: 2 }}
            onClose={() => setScanResult(null)}
          >
            <Typography variant="subtitle2">{scanResult.message}</Typography>
            {scanResult.data && (
              <Box sx={{ mt: 1 }}>
                {scanResult.type === 'success' && (
                  <>
                    <Typography variant="body2">
                      <strong>Participant:</strong> {scanResult.data.participant.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {scanResult.data.participant.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Ticket ID:</strong> {scanResult.data.ticketId}
                    </Typography>
                  </>
                )}
                {scanResult.type === 'error' && scanResult.data && (
                  <>
                    <Typography variant="body2">
                      <strong>Participant:</strong> {scanResult.data.participant}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Previously scanned at:</strong> {new Date(scanResult.data.attendedAt).toLocaleString()}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;
