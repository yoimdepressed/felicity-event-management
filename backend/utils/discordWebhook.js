import axios from 'axios';

/**
 * Send event notification to Discord via webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {object} event - Event object
 * @param {string} action - Action type: 'created', 'updated', 'published', 'completed', 'closed'
 * @returns {Promise<boolean>} - Success status
 */
export const sendDiscordNotification = async (webhookUrl, event, action = 'created') => {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.log('[Discord] Invalid or missing webhook URL');
    return false;
  }

  try {
    // Determine color based on action
    const colorMap = {
      created: 0x00ff00,    // Green
      published: 0x0099ff,  // Blue
      updated: 0xffaa00,    // Orange
      completed: 0x9900ff,  // Purple
      closed: 0xff0000,     // Red
    };

    // Determine emoji based on action
    const emojiMap = {
      created: '🎉',
      published: '📢',
      updated: '✏️',
      completed: '✅',
      closed: '🚫',
    };

    // Format dates
    const startDate = new Date(event.eventStartDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const deadline = new Date(event.registrationDeadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build embed fields
    const fields = [
      {
        name: '📅 Event Date',
        value: startDate,
        inline: true,
      },
      {
        name: '⏰ Registration Deadline',
        value: deadline,
        inline: true,
      },
      {
        name: '📍 Venue',
        value: event.venue || 'TBA',
        inline: true,
      },
      {
        name: '🎫 Event Type',
        value: event.eventType,
        inline: true,
      },
    ];

    // Add type-specific fields
    if (event.eventType === 'Normal') {
      if (event.maxParticipants) {
        fields.push({
          name: '👥 Max Participants',
          value: `${event.currentRegistrations || 0}/${event.maxParticipants}`,
          inline: true,
        });
      }
      if (event.price === 0) {
        fields.push({
          name: '💰 Price',
          value: 'FREE',
          inline: true,
        });
      }
    } else if (event.eventType === 'Merchandise') {
      fields.push({
        name: '💰 Price',
        value: `₹${event.price}`,
        inline: true,
      });
      fields.push({
        name: '📦 Available Stock',
        value: `${event.availableStock}`,
        inline: true,
      });
    }

    // Add eligibility
    fields.push({
      name: '🎯 Eligibility',
      value: event.eligibility,
      inline: true,
    });

    // Add tags if present
    if (event.tags && event.tags.length > 0) {
      fields.push({
        name: '🏷️ Tags',
        value: event.tags.join(', '),
        inline: false,
      });
    }

    // Build Discord embed
    const embed = {
      title: `${emojiMap[action]} ${action.toUpperCase()}: ${event.eventName}`,
      description: event.description || 'No description provided',
      color: colorMap[action] || 0x808080,
      fields: fields,
      footer: {
        text: `Organizer: ${event.organizer?.organizerName || 'Unknown'}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Add thumbnail if event has image (future enhancement)
    // if (event.imageUrl) {
    //   embed.thumbnail = { url: event.imageUrl };
    // }

    // Send to Discord
    const response = await axios.post(
      webhookUrl,
      {
        username: 'Felicity Event Manager',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        embeds: [embed],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.status === 204) {
      console.log(`[Discord] Successfully sent ${action} notification for event: ${event.eventName}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Discord] Failed to send notification:', error.message);
    // Don't throw error - webhook failure shouldn't break event creation
    return false;
  }
};

/**
 * Helper function to post event to Discord (wrapper for backward compatibility)
 */
export const postEventToDiscord = async (webhookUrl, event) => {
  return sendDiscordNotification(webhookUrl, event, 'published');
};

export default {
  sendDiscordNotification,
  postEventToDiscord,
};
