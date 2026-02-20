import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, TextField, Button, Paper, Avatar, Chip,
    IconButton, Divider, Alert, CircularProgress, Menu, MenuItem,
    Collapse,
} from '@mui/material';
import {
    Send, PushPin, Delete, Reply, EmojiEmotions, Campaign,
    ExpandMore, ExpandLess,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { discussionAPI } from '../services/api';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👎'];

const DiscussionForum = ({ eventId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [emojiAnchor, setEmojiAnchor] = useState({ el: null, msgId: null });
    const [expandedReplies, setExpandedReplies] = useState({});

    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

    const fetchMessages = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await discussionAPI.getMessages(eventId);
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (err) {
            if (!silent) {
                if (err.response?.status === 403) {
                    setError('You must be registered for this event to access the discussion.');
                } else {
                    setError('Failed to load discussion');
                }
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => fetchMessages(true), 15000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const handlePostMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await discussionAPI.postMessage(eventId, { content: newMessage });
            setNewMessage('');
            fetchMessages(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post message');
        }
    };

    const handlePostAnnouncement = async () => {
        if (!announcement.trim()) return;
        try {
            const response = await discussionAPI.postMessage(eventId, { content: announcement });
            if (response.data.data?._id) {
                try { await discussionAPI.pinMessage(response.data.data._id); } catch (e) { /* ignore */ }
            }
            setAnnouncement('');
            fetchMessages(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post announcement');
        }
    };

    const handleReply = async (parentId) => {
        if (!replyContent.trim()) return;
        try {
            await discussionAPI.postMessage(eventId, {
                content: replyContent,
                parentMessage: parentId,
            });
            setReplyTo(null);
            setReplyContent('');
            fetchMessages(true);
        } catch (err) {
            setError('Failed to post reply');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await discussionAPI.deleteMessage(messageId);
            fetchMessages(true);
        } catch (err) {
            setError('Failed to delete message');
        }
    };

    const handlePinMessage = async (messageId) => {
        try {
            await discussionAPI.pinMessage(messageId);
            fetchMessages(true);
        } catch (err) {
            setError('Failed to pin/unpin message');
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            await discussionAPI.reactToMessage(messageId, emoji);
            setEmojiAnchor({ el: null, msgId: null });
            fetchMessages(true);
        } catch (err) {
            console.error('Reaction error:', err);
        }
    };

    const toggleReplies = (msgId) => {
        setExpandedReplies(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    };

    const getDisplayName = (u) => {
        if (!u) return 'Unknown';
        if (u.role === 'organizer') return u.organizerName || `${u.firstName} ${u.lastName}`;
        return `${u.firstName} ${u.lastName}`;
    };

    const getRoleBadge = (role) => {
        if (role === 'organizer') return <Chip label="Organizer" size="small" color="primary" sx={{ ml: 1 }} />;
        if (role === 'admin') return <Chip label="Admin" size="small" color="error" sx={{ ml: 1 }} />;
        return null;
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMins = Math.floor((now - d) / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
    }

    if (error && error.includes('registered')) {
        return <Alert severity="info" sx={{ mt: 2 }}>{error}</Alert>;
    }

    return (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                💬 Discussion Forum
            </Typography>

            {error && !error.includes('registered') && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
            )}

            {/* Organizer: Post Announcement */}
            {isOrganizer && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <Campaign sx={{ mr: 0.5, verticalAlign: 'middle' }} /> Post Announcement
                    </Typography>
                    <Box display="flex" gap={1}>
                        <TextField
                            fullWidth size="small"
                            placeholder="Post an announcement to all participants..."
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostAnnouncement()}
                        />
                        <Button variant="contained" onClick={handlePostAnnouncement} disabled={!announcement.trim()}>
                            <Campaign />
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Post a message */}
            <Box display="flex" gap={1} mb={2}>
                <TextField
                    fullWidth size="small"
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostMessage()}
                    multiline maxRows={3}
                />
                <Button variant="contained" onClick={handlePostMessage} disabled={!newMessage.trim()}>
                    <Send />
                </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Messages List */}
            {messages.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                    No messages yet. Start the conversation!
                </Typography>
            ) : (
                messages.map((msg) => (
                    <Box key={msg._id} sx={{
                        mb: 1.5, p: 1.5, borderRadius: 2,
                        bgcolor: msg.isPinned ? '#fff8e1' : msg.isAnnouncement ? '#e3f2fd' : '#fafafa',
                        border: msg.isPinned ? '1px solid #ffa726' : msg.isAnnouncement ? '1px solid #64b5f6' : '1px solid #eee',
                    }}>
                        {/* Message Header */}
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 28, height: 28, mr: 1, fontSize: 14, bgcolor: msg.user?.role === 'organizer' ? '#1976d2' : '#757575' }}>
                                    {msg.user?.firstName?.[0] || '?'}
                                </Avatar>
                                <Typography variant="subtitle2">{getDisplayName(msg.user)}</Typography>
                                {getRoleBadge(msg.user?.role)}
                                {msg.isPinned && <PushPin sx={{ ml: 1, fontSize: 16, color: '#ffa726' }} />}
                                {msg.isAnnouncement && <Campaign sx={{ ml: 1, fontSize: 16, color: '#1976d2' }} />}
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {formatTime(msg.createdAt)}
                                </Typography>
                            </Box>
                            <Box>
                                <IconButton size="small" onClick={(e) => setEmojiAnchor({ el: e.currentTarget, msgId: msg._id })}>
                                    <EmojiEmotions fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => { setReplyTo(msg._id); setReplyContent(''); }}>
                                    <Reply fontSize="small" />
                                </IconButton>
                                {isOrganizer && (
                                    <IconButton size="small" onClick={() => handlePinMessage(msg._id)}>
                                        <PushPin fontSize="small" color={msg.isPinned ? 'warning' : 'action'} />
                                    </IconButton>
                                )}
                                {(msg.user?._id === user?._id || isOrganizer) && (
                                    <IconButton size="small" color="error" onClick={() => handleDeleteMessage(msg._id)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        {/* Message Content */}
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                        </Typography>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    <Chip
                                        key={emoji}
                                        label={`${emoji} ${Array.isArray(users) ? users.length : 0}`}
                                        size="small" variant="outlined"
                                        onClick={() => handleReaction(msg._id, emoji)}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* Replies */}
                        {msg.replies && msg.replies.length > 0 && (
                            <Box>
                                <Button size="small" onClick={() => toggleReplies(msg._id)} sx={{ mt: 0.5 }}
                                    endIcon={expandedReplies[msg._id] ? <ExpandLess /> : <ExpandMore />}>
                                    {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                                </Button>
                                <Collapse in={expandedReplies[msg._id]}>
                                    <Box sx={{ ml: 3, mt: 1 }}>
                                        {msg.replies.map(reply => (
                                            <Box key={reply._id} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1, borderLeft: '3px solid #ddd' }}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {getDisplayName(reply.user)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTime(reply.createdAt)}
                                                    </Typography>
                                                    {(reply.user?._id === user?._id || isOrganizer) && (
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteMessage(reply._id)}>
                                                            <Delete sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Typography variant="body2">{reply.content}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Collapse>
                            </Box>
                        )}

                        {/* Reply Input */}
                        {replyTo === msg._id && (
                            <Box display="flex" gap={1} mt={1} ml={3}>
                                <TextField
                                    fullWidth size="small"
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(msg._id)}
                                    autoFocus
                                />
                                <Button size="small" onClick={() => handleReply(msg._id)} disabled={!replyContent.trim()}>Reply</Button>
                                <Button size="small" color="inherit" onClick={() => setReplyTo(null)}>Cancel</Button>
                            </Box>
                        )}
                    </Box>
                ))
            )}

            {/* Emoji Picker Menu */}
            <Menu
                anchorEl={emojiAnchor.el}
                open={Boolean(emojiAnchor.el)}
                onClose={() => setEmojiAnchor({ el: null, msgId: null })}
            >
                <Box display="flex" p={1}>
                    {EMOJI_OPTIONS.map(emoji => (
                        <IconButton key={emoji} onClick={() => handleReaction(emojiAnchor.msgId, emoji)}>
                            <Typography fontSize={20}>{emoji}</Typography>
                        </IconButton>
                    ))}
                </Box>
            </Menu>
        </Paper>
    );
};

export default DiscussionForum;
