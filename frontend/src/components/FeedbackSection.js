import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Rating,
    TextField,
    Button,
    Alert,
    Paper,
    LinearProgress,
    Divider,
    Chip,
} from '@mui/material';
import { Star, RateReview } from '@mui/icons-material';
import { feedbackAPI } from '../services/api';

const FeedbackSection = ({ eventId, isOrganizer = false }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [myFeedback, setMyFeedback] = useState(null);
    const [stats, setStats] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [filterRating, setFilterRating] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOrganizer) {
            fetchEventFeedback();
        } else {
            fetchMyFeedback();
        }
    }, [eventId, isOrganizer, filterRating]);

    const fetchMyFeedback = async () => {
        try {
            const response = await feedbackAPI.getMyFeedback(eventId);
            if (response.data.data) {
                setMyFeedback(response.data.data);
                setRating(response.data.data.rating);
                setComment(response.data.data.comment || '');
            }
        } catch (err) {
            // No feedback yet
        }
    };

    const fetchEventFeedback = async () => {
        try {
            const response = await feedbackAPI.getEventFeedback(eventId, filterRating);
            setFeedbacks(response.data.data.feedbacks || []);
            setStats(response.data.data.stats || null);
        } catch (err) {
            console.error('Error fetching feedback:', err);
        }
    };

    const handleSubmit = async () => {
        if (rating < 1) {
            setError('Please select a rating');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await feedbackAPI.submitFeedback(eventId, { rating, comment });
            setSuccess(myFeedback ? 'Feedback updated!' : 'Feedback submitted!');
            setMyFeedback({ rating, comment });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    // Organizer view - aggregated feedback
    if (isOrganizer) {
        return (
            <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <RateReview sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Anonymous Feedback
                </Typography>

                {stats && (
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h3" fontWeight="bold">{stats.averageRating}</Typography>
                            <Box>
                                <Rating value={stats.averageRating} precision={0.1} readOnly />
                                <Typography variant="body2" color="text.secondary">
                                    {stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Rating distribution */}
                        {[5, 4, 3, 2, 1].map((star) => (
                            <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" sx={{ minWidth: 20 }}>{star}</Typography>
                                <Star fontSize="small" sx={{ color: '#faaf00' }} />
                                <LinearProgress
                                    variant="determinate"
                                    value={stats.totalCount > 0 ? (stats.distribution[star] / stats.totalCount) * 100 : 0}
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 20 }}>{stats.distribution[star]}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Filter */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label="All"
                        variant={filterRating === null ? 'filled' : 'outlined'}
                        onClick={() => setFilterRating(null)}
                        color="primary"
                        size="small"
                    />
                    {[5, 4, 3, 2, 1].map(r => (
                        <Chip
                            key={r}
                            label={`${r} ★`}
                            variant={filterRating === r ? 'filled' : 'outlined'}
                            onClick={() => setFilterRating(r)}
                            size="small"
                        />
                    ))}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {feedbacks.length === 0 ? (
                    <Typography color="text.secondary">No feedback yet</Typography>
                ) : (
                    feedbacks.map((fb, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Rating value={fb.rating} readOnly size="small" />
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(fb.createdAt).toLocaleDateString('en-IN')}
                                </Typography>
                            </Box>
                            {fb.comment && <Typography variant="body2">{fb.comment}</Typography>}
                        </Paper>
                    ))
                )}
            </Paper>
        );
    }

    // Participant view - submit feedback
    return (
        <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                <RateReview sx={{ mr: 1, verticalAlign: 'middle' }} />
                {myFeedback ? 'Update Your Feedback' : 'Leave Anonymous Feedback'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
                Your identity will not be shared with the organizer.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ mb: 2 }}>
                <Typography component="legend">Rating *</Typography>
                <Rating
                    value={rating}
                    onChange={(e, newValue) => setRating(newValue)}
                    size="large"
                />
            </Box>

            <TextField
                fullWidth
                label="Comments (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
                placeholder="Share your experience..."
                sx={{ mb: 2 }}
            />

            <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !rating}
                startIcon={<Star />}
            >
                {loading ? 'Submitting...' : myFeedback ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
        </Paper>
    );
};

export default FeedbackSection;
