import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { discussionAPI } from '../services/api';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Divider,
    Collapse,
    Avatar,
    Stack,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Send,
    Reply,
    Delete,
    PushPin,
    Campaign,
    ThumbUp,
    Favorite,
    EmojiEmotions,
    ExpandMore,
    ExpandLess,
    Refresh,
    Forum,
} from '@mui/icons-material';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👏'];

const DiscussionForum = ({ eventId, isOrganizer = false }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedThreads, setExpandedThreads] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [announcementDialog, setAnnouncementDialog] = useState(false);
    const [announcementContent, setAnnouncementContent] = useState('');
    const [posting, setPosting] = useState(false);

    const fetchMessages = useCallback(async () => {
        try {
            setError('');
            const response = await discussionAPI.getMessages(eventId);
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (err) {
            if (err.response?.status === 403) {
                setError('You must be registered for this event to access the discussion forum.');
            } else {
                setError('Failed to load discussion messages');
            }
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handlePostMessage = async () => {
        if (!newMessage.trim()) return;
        setPosting(true);
        try {
            await discussionAPI.postMessage(eventId, newMessage.trim());
            setNewMessage('');
            await fetchMessages();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post message');
        } finally {
            setPosting(false);
        }
    };

    const handlePostReply = async (parentId) => {
        if (!replyContent.trim()) return;
        setPosting(true);
        try {
            await discussionAPI.postMessage(eventId, replyContent.trim(), parentId);
            setReplyContent('');
            setReplyTo(null);
            setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
            await fetchMessages();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post reply');
        } finally {
            setPosting(false);
        }
    };

    const handlePostAnnouncement = async () => {
        if (!announcementContent.trim()) return;
        try {
            await discussionAPI.postAnnouncement(eventId, announcementContent.trim());
            setAnnouncementContent('');
            setAnnouncementDialog(false);
            setSuccess('Announcement posted!');
            setTimeout(() => setSuccess(''), 3000);
            await fetchMessages();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post announcement');
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await discussionAPI.deleteMessage(messageId);
            await fetchMessages();
        } catch (err) {
            setError('Failed to delete message');
        }
    };

    const handleTogglePin = async (messageId) => {
        try {
            await discussionAPI.togglePin(messageId);
            await fetchMessages();
        } catch (err) {
            setError('Failed to toggle pin');
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            await discussionAPI.toggleReaction(messageId, emoji);
            await fetchMessages();
        } catch (err) {
            setError('Failed to add reaction');
        }
    };

    const toggleThread = (messageId) => {
        setExpandedThreads(prev => ({
            ...prev,
            [messageId]: !prev[messageId],
        }));
    };

    const getInitials = (msg) => {
        const fn = msg.user?.firstName || '';
        const ln = msg.user?.lastName || '';
        return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase();
    };

    const getDisplayName = (msg) => {
        if (msg.user?.role === 'organizer' && msg.user?.organizerName) {
            return msg.user.organizerName;
        }
        return `${msg.user?.firstName || ''} ${msg.user?.lastName || ''}`.trim();
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderReactions = (msg) => {
        const reactions = msg.reactions || {};
        const entries = Object.entries(reactions);
        if (entries.length === 0) return null;

        return (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                {entries.map(([emoji, users]) => (
                    <Chip
                        key={emoji}
                        label={`${emoji} ${users.length}`}
                        size="small"
                        variant={users.some(u => u === user?._id || u === user?.id) ? 'filled' : 'outlined'}
                        onClick={() => handleReaction(msg._id, emoji)}
                        sx={{ cursor: 'pointer', fontSize: '0.75rem', height: 24 }}
                    />
                ))}
            </Stack>
        );
    };

    const renderMessage = (msg, isReply = false) => {
        const isAuthor = msg.user?._id === user?.id || msg.user?._id === user?._id;
        const isOrganizerUser = msg.user?.role === 'organizer';

        return (
            <Box
                key={msg._id}
                sx={{
                    ml: isReply ? 4 : 0,
                    mb: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: msg.isAnnouncement
                        ? 'rgba(255, 152, 0, 0.08)'
                        : msg.isPinned
                            ? 'rgba(33, 150, 243, 0.06)'
                            : isReply
                                ? 'rgba(0,0,0,0.02)'
                                : 'transparent',
                    borderLeft: msg.isAnnouncement
                        ? '3px solid #ff9800'
                        : msg.isPinned
                            ? '3px solid #2196f3'
                            : isReply
                                ? '2px solid #e0e0e0'
                                : 'none',
                }}
            >
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                    <Avatar
                        sx={{
                            width: isReply ? 28 : 34,
                            height: isReply ? 28 : 34,
                            fontSize: isReply ? '0.7rem' : '0.8rem',
                            bgcolor: isOrganizerUser ? 'primary.main' : 'grey.400',
                        }}
                    >
                        {getInitials(msg)}
                    </Avatar>

                    <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle2" fontWeight={600} fontSize={isReply ? '0.8rem' : '0.85rem'}>
                                {getDisplayName(msg)}
                            </Typography>
                            {isOrganizerUser && (
                                <Chip label="Organizer" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                            {msg.isAnnouncement && (
                                <Chip label="📢 Announcement" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                            {msg.isPinned && !msg.isAnnouncement && (
                                <Chip label="📌 Pinned" size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {formatTime(msg.createdAt)}
                            </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.content}
                        </Typography>

                        {renderReactions(msg)}

                        {/* Action buttons */}
                        <Stack direction="row" spacing={0} sx={{ mt: 0.5 }}>
                            {!isReply && (
                                <Tooltip title="Reply">
                                    <IconButton size="small" onClick={() => { setReplyTo(msg._id); setReplyContent(''); }}>
                                        <Reply sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {EMOJI_OPTIONS.slice(0, 3).map(emoji => (
                                <Tooltip key={emoji} title={`React ${emoji}`}>
                                    <IconButton size="small" onClick={() => handleReaction(msg._id, emoji)} sx={{ fontSize: 14, p: 0.5 }}>
                                        {emoji}
                                    </IconButton>
                                </Tooltip>
                            ))}
                            {isOrganizer && (
                                <>
                                    <Tooltip title={msg.isPinned ? 'Unpin' : 'Pin'}>
                                        <IconButton size="small" onClick={() => handleTogglePin(msg._id)} color={msg.isPinned ? 'primary' : 'default'}>
                                            <PushPin sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleDelete(msg._id)} color="error">
                                            <Delete sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                            {isAuthor && !isOrganizer && (
                                <Tooltip title="Delete">
                                    <IconButton size="small" onClick={() => handleDelete(msg._id)} color="error">
                                        <Delete sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                </Box>

                {/* Reply input */}
                {replyTo === msg._id && (
                    <Box display="flex" gap={1} mt={1} ml={5}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handlePostReply(msg._id)}
                            multiline
                            maxRows={3}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handlePostReply(msg._id)}
                            disabled={!replyContent.trim() || posting}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            <Send sx={{ fontSize: 18 }} />
                        </Button>
                        <Button size="small" onClick={() => setReplyTo(null)}>Cancel</Button>
                    </Box>
                )}
            </Box>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && messages.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Forum color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Discussion Forum
                        </Typography>
                        <Chip label={messages.length} size="small" color="default" />
                    </Box>
                    <Box>
                        {isOrganizer && (
                            <Button
                                startIcon={<Campaign />}
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => setAnnouncementDialog(true)}
                                sx={{ mr: 1 }}
                            >
                                Announce
                            </Button>
                        )}
                        <IconButton size="small" onClick={fetchMessages}>
                            <Refresh />
                        </IconButton>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                {/* New message input */}
                <Box display="flex" gap={1} mb={2}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Write a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostMessage();
                            }
                        }}
                        multiline
                        maxRows={4}
                    />
                    <Button
                        variant="contained"
                        onClick={handlePostMessage}
                        disabled={!newMessage.trim() || posting}
                        sx={{ minWidth: 'auto', px: 2 }}
                    >
                        <Send />
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Messages list */}
                {messages.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            No messages yet. Start the conversation!
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                        {messages.map(msg => (
                            <Box key={msg._id}>
                                {renderMessage(msg)}

                                {/* Thread replies */}
                                {msg.replies && msg.replies.length > 0 && (
                                    <>
                                        <Button
                                            size="small"
                                            onClick={() => toggleThread(msg._id)}
                                            startIcon={expandedThreads[msg._id] ? <ExpandLess /> : <ExpandMore />}
                                            sx={{ ml: 5, mb: 0.5, textTransform: 'none', color: 'text.secondary' }}
                                        >
                                            {expandedThreads[msg._id] ? 'Hide' : 'Show'} {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                                        </Button>
                                        <Collapse in={expandedThreads[msg._id]}>
                                            {msg.replies.map(reply => renderMessage(reply, true))}
                                        </Collapse>
                                    </>
                                )}

                                <Divider sx={{ my: 1 }} />
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Announcement Dialog */}
                <Dialog open={announcementDialog} onClose={() => setAnnouncementDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Post Announcement</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Announcements are pinned and highlighted for all participants.
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Write your announcement..."
                            value={announcementContent}
                            onChange={(e) => setAnnouncementContent(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAnnouncementDialog(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handlePostAnnouncement}
                            disabled={!announcementContent.trim()}
                            startIcon={<Campaign />}
                        >
                            Post Announcement
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default DiscussionForum;
