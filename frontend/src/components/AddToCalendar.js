import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    CalendarMonth,
    Download,
    Google,
    OpenInNew,
} from '@mui/icons-material';
import { calendarAPI } from '../services/api';

const AddToCalendar = ({ eventId, eventName }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDownloadICS = () => {
        // Direct download through a link
        const token = localStorage.getItem('token');
        const url = `http://localhost:5000/api/calendar/event/${eventId}/ics`;

        // Open in new tab with auth (temporary approach)
        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${(eventName || 'event').replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
                link.click();
                URL.revokeObjectURL(link.href);
            })
            .catch(err => setError('Failed to download calendar file'));
        handleClose();
    };

    const handleGoogleCalendar = async () => {
        setLoading(true);
        try {
            const response = await calendarAPI.getCalendarLinks(eventId);
            window.open(response.data.data.googleCalendarUrl, '_blank');
        } catch (err) {
            setError('Failed to generate Google Calendar link');
        } finally {
            setLoading(false);
            handleClose();
        }
    };

    const handleOutlook = async () => {
        setLoading(true);
        try {
            const response = await calendarAPI.getCalendarLinks(eventId);
            window.open(response.data.data.outlookUrl, '_blank');
        } catch (err) {
            setError('Failed to generate Outlook link');
        } finally {
            setLoading(false);
            handleClose();
        }
    };

    return (
        <Box sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}

            <Button
                variant="outlined"
                startIcon={<CalendarMonth />}
                onClick={handleClick}
                disabled={loading}
                size="small"
                sx={{ mr: 1 }}
            >
                Add to Calendar
            </Button>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={handleGoogleCalendar}>
                    <ListItemIcon><Google fontSize="small" /></ListItemIcon>
                    <ListItemText>Google Calendar</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOutlook}>
                    <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
                    <ListItemText>Microsoft Outlook</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDownloadICS}>
                    <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                    <ListItemText>Download .ics File</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default AddToCalendar;
