import axios from 'axios';

/**
 * Send a Discord webhook notification for event updates
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} event - Event object
 * @param {string} action - Action type ('published', 'updated', 'cancelled', 'reminder')
 */
export const sendDiscordNotification = async (webhookUrl, event, action = 'published') => {
    if (!webhookUrl) return;

    const actionMessages = {
        published: '🎉 New Event Published!',
        updated: '📝 Event Updated!',
        cancelled: '❌ Event Cancelled',
        reminder: '⏰ Event Reminder',
    };

    const title = actionMessages[action] || '📢 Event Notification';

    const embed = {
        title: title,
        description: event.eventName,
        color: action === 'cancelled' ? 0xff0000 : 0x00ff00,
        fields: [
            { name: 'Type', value: event.eventType || 'Event', inline: true },
            { name: 'Venue', value: event.venue || 'TBA', inline: true },
            { name: 'Date', value: event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA', inline: true },
        ],
        timestamp: new Date().toISOString(),
    };

    if (event.description) {
        embed.fields.push({ name: 'Description', value: event.description.substring(0, 200) + (event.description.length > 200 ? '...' : '') });
    }

    if (event.price > 0) {
        embed.fields.push({ name: 'Price', value: `₹${event.price}`, inline: true });
    }

    try {
        await axios.post(webhookUrl, {
            embeds: [embed],
        });
    } catch (error) {
        console.error('[Discord] Failed to send webhook:', error.message);
        throw error;
    }
};
