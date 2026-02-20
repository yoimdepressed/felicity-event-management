// Import Models
import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendDiscordNotification } from '../utils/discordWebhook.js';

// ============================================
// PUBLIC CONTROLLERS (No Authentication)
// ============================================

// @desc    Get all active events with filters
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
  try {
    const { eventType, eligibility, search, startDate, endDate, followedClubs, organizer } = req.query;

    // Build query - only show Published, Ongoing, or Completed events (not Draft or Closed)
    let query = { 
      isActive: true, 
      isApproved: true,
      status: { $in: ['Published', 'Ongoing', 'Completed'] }
    };

    // Filter by organizer (specific club/organizer)
    if (organizer) {
      query.organizer = organizer;
    }

    // Filter by event type
    if (eventType && eventType !== 'All' && ['Normal', 'Merchandise'].includes(eventType)) {
      query.eventType = eventType;
    }

    // Filter by eligibility
    if (eligibility && eligibility !== 'All') {
      query.eligibility = eligibility;
    }

    // Filter by date range (event must start after startDate and end before endDate)
    if (startDate) {
      query.eventStartDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      if (!query.eventStartDate) {
        query.eventStartDate = {};
      }
      query.eventStartDate.$lte = new Date(endDate);
    }

    // Filter by followed clubs (organizer IDs)
    if (followedClubs) {
      try {
        const clubIds = JSON.parse(followedClubs); // Array of organizer IDs
        if (Array.isArray(clubIds) && clubIds.length > 0) {
          query.organizer = { $in: clubIds };
        }
      } catch (e) {
        console.error('[ERROR] Invalid followedClubs format:', e.message);
      }
    }

    // Search by event name or organizer name (fuzzy matching with regex)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive
      
      // Find organizers matching the search term
      const matchingOrganizers = await User.find({
        role: 'organizer',
        organizerName: searchRegex,
      }).select('_id');
      
      const organizerIds = matchingOrganizers.map(org => org._id);
      
      // Search in event name OR organizer IDs
      query.$or = [
        { eventName: searchRegex },
        { organizer: { $in: organizerIds } },
      ];
    }

    // Execute query
    const events = await Event.find(query)
      .populate('organizer', 'organizerName category contactEmail')
      .sort({ eventStartDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[ERROR] Get all events:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events',
    });
  }
};

// @desc    Get trending events (top 5 from last 24 hours)
// @route   GET /api/events/trending
// @access  Public
export const getTrendingEvents = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trendingEvents = await Event.find({
      isActive: true,
      isApproved: true,
      createdAt: { $gte: last24Hours },
    })
      .populate('organizer', 'organizerName category contactEmail')
      .sort({ currentRegistrations: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: trendingEvents.length,
      data: trendingEvents,
    });
  } catch (error) {
    console.error('[ERROR] Get trending events:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending events',
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'organizer',
      'organizerName category description contactEmail'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event is active and approved
    if (!event.isActive || !event.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'This event is not available',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('[ERROR] Get event by ID:', error.message);
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching event',
    });
  }
};

// ============================================
// ORGANIZER CONTROLLERS (Protected)
// ============================================

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer only)
export const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventType,
      description,
      venue,
      eventStartDate,
      eventEndDate,
      registrationDeadline,
      maxParticipants,
      price,
      availableStock,
      sizes,
      colors,
      purchaseLimitPerParticipant,
      eligibility,
      tags,
      customRegistrationForm,
      posterUrl,
      status, // Can be 'Draft' or 'Published'
    } = req.body;

    // Validation
    if (!eventName || !eventType || !description || !venue || !eventStartDate || !eventEndDate || !registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate event type
    if (!['Normal', 'Merchandise'].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Event type must be either Normal or Merchandise',
      });
    }

    // Merchandise events must have stock and price
    if (eventType === 'Merchandise') {
      if (availableStock === undefined || availableStock === null) {
        return res.status(400).json({
          success: false,
          message: 'Merchandise events must have availableStock defined',
        });
      }
      if (price === undefined || price === null) {
        return res.status(400).json({
          success: false,
          message: 'Merchandise events must have a price',
        });
      }
    }

    // Validate dates
    const startDateObj = new Date(eventStartDate);
    const endDateObj = new Date(eventEndDate);
    const deadlineObj = new Date(registrationDeadline);
    
    if (endDateObj < startDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Event end date must be after or equal to start date',
      });
    }
    
    if (deadlineObj >= startDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be before event start date',
      });
    }

    // Create event
    const event = await Event.create({
      eventName,
      eventType,
      description,
      organizer: req.user.id,
      venue,
      eventStartDate: startDateObj,
      eventEndDate: endDateObj,
      registrationDeadline: deadlineObj,
      maxParticipants: maxParticipants || null,
      price: price || 0,
      availableStock: eventType === 'Merchandise' ? availableStock : null,
      sizes: eventType === 'Merchandise' && sizes ? sizes : [],
      colors: eventType === 'Merchandise' && colors ? colors : [],
      purchaseLimitPerParticipant: eventType === 'Merchandise' && purchaseLimitPerParticipant ? purchaseLimitPerParticipant : null,
      eligibility: eligibility || 'Open to All',
      tags: tags || [],
      customRegistrationForm: eventType === 'Normal' && customRegistrationForm ? customRegistrationForm : [],
      posterUrl: posterUrl || null,
      status: status || 'Draft', // Default to Draft if not specified
    });

    // Populate organizer info after creation
    const populatedEvent = await Event.findById(event._id).populate('organizer', 'organizerName category contactEmail discordWebhook');

    // Send Discord notification if webhook is configured and event is published
    if (populatedEvent.status === 'Published' && populatedEvent.organizer.discordWebhook) {
      try {
        await sendDiscordNotification(
          populatedEvent.organizer.discordWebhook,
          populatedEvent,
          'published'
        );
      } catch (webhookError) {
        console.error('[Discord] Webhook notification failed:', webhookError.message);
        // Don't fail the request if webhook fails
      }
    }

    res.status(201).json({
      success: true,
      message: `Event ${status === 'Published' ? 'created and published' : 'saved as draft'} successfully`,
      data: populatedEvent,
    });
  } catch (error) {
    console.error('[ERROR] Create event:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event',
      error: error.message,
    });
  }
};

// @desc    Get events created by logged-in organizer
// @route   GET /api/events/my-events
// @access  Private (Organizer only)
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'organizerName category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[ERROR] Get my events:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your events',
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer - own events only)
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event',
      });
    }

    // Auto-update status based on dates before any other operations
    await event.updateStatusBasedOnDates();

    // Check edit permissions based on current status
    const validation = event.validateUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Validate dates if updating
    if (req.body.eventStartDate && req.body.registrationDeadline) {
      const eventDateObj = new Date(req.body.eventStartDate);
      const deadlineObj = new Date(req.body.registrationDeadline);
      
      if (deadlineObj >= eventDateObj) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline must be before event start date',
        });
      }
    }

    if (req.body.eventStartDate && req.body.eventEndDate) {
      const startDateObj = new Date(req.body.eventStartDate);
      const endDateObj = new Date(req.body.eventEndDate);
      
      if (endDateObj < startDateObj) {
        return res.status(400).json({
          success: false,
          message: 'Event end date must be after or equal to start date',
        });
      }
    }

    // Update event - disable validators to avoid date conflicts when updating single fields
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: false, // Disable validators since we already validated above
    }).populate('organizer', 'organizerName category contactEmail');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('[ERROR] Update event:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating event',
      error: error.message,
    });
  }
};

// @desc    Delete event (soft delete)
// @route   DELETE /api/events/:id
// @access  Private (Organizer - own events only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event',
      });
    }

    // Check permissions - only Draft events can be deleted
    const permissions = event.getEditableFields();
    if (!permissions.canDelete) {
      return res.status(400).json({
        success: false,
        message: 'Only Draft events can be deleted. Use close/cancel option for published events.',
      });
    }

    // Soft delete (set isActive to false) - skip validation since we're deleting
    await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { validateBeforeSave: false, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('[ERROR] Delete event:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting event',
    });
  }
};

// @desc    Toggle event registration (open/close)
// @route   PATCH /api/events/:id/toggle-registration
// @access  Private (Organizer - own events only)
export const toggleRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this event',
      });
    }

    // Toggle registration status
    event.registrationOpen = !event.registrationOpen;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Registration ${event.registrationOpen ? 'opened' : 'closed'} successfully`,
      data: {
        registrationOpen: event.registrationOpen,
      },
    });
  } catch (error) {
    console.error('[ERROR] Toggle registration:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while toggling registration',
    });
  }
};

// @desc    Get all registrations for a specific event (Organizer only)
// @route   GET /api/events/:id/registrations
// @access  Private (Organizer - own events only)
export const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('[DEBUG] Fetching registrations for event:', id);
    console.log('[DEBUG] Requested by user:', req.user.id);

    // Check if event exists and belongs to organizer
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    console.log('[DEBUG] Event organizer:', event.organizer.toString());
    console.log('[DEBUG] User ID:', req.user.id.toString());

    // Verify organizer owns this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event',
      });
    }

    // Import Registration model dynamically to avoid circular dependency
    const Registration = (await import('../models/Registration.js')).default;

    // Fetch all registrations for this event with participant details
    const registrations = await Registration.find({ event: id })
      .populate('participant', 'firstName lastName email college contactNumber')
      .sort({ createdAt: -1 }); // Most recent first

    console.log('[DEBUG] Found registrations:', registrations.length);
    console.log('[DEBUG] Sample registration:', registrations[0]);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error('[ERROR] Get event registrations:', error.message);
    console.error('[ERROR] Stack:', error.stack);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations',
    });
  }
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

// @desc    Get dashboard statistics
// @route   GET /api/admin/events/stats
// @access  Private (Admin only)
export const getEventStats = async (req, res) => {
  try {
    // Total events
    const totalEvents = await Event.countDocuments();

    // Active events
    const activeEvents = await Event.countDocuments({ isActive: true });

    // Events by type
    const normalEvents = await Event.countDocuments({ eventType: 'Normal' });
    const merchandiseEvents = await Event.countDocuments({ eventType: 'Merchandise' });

    // Upcoming events
    const upcomingEvents = await Event.countDocuments({
      isActive: true,
      eventDate: { $gte: new Date() },
    });

    // Total registrations across all events
    const registrationStats = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: '$currentRegistrations' },
        },
      },
    ]);

    // Recent events (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEvents = await Event.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        activeEvents,
        normalEvents,
        merchandiseEvents,
        upcomingEvents,
        totalRegistrations: registrationStats[0]?.totalRegistrations || 0,
        recentEvents,
      },
    });
  } catch (error) {
    console.error('[ERROR] Get event stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
    });
  }
};

// @desc    Get all events (including inactive) - Admin only
// @route   GET /api/admin/events
// @access  Private (Admin only)
export const getAllEventsAdmin = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'organizerName category contactEmail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[ERROR] Get all events (admin):', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events',
    });
  }
};

// @desc    Delete event permanently (hard delete) - Admin only
// @route   DELETE /api/admin/events/:id/permanent
// @access  Private (Admin only)
export const permanentlyDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event permanently deleted',
    });
  } catch (error) {
    console.error('[ERROR] Permanently delete event:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting event',
    });
  }
};

// @desc    Get event edit permissions
// @route   GET /api/events/:id/permissions
// @access  Private (Organizer - own events only)
export const getEventPermissions = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this event',
      });
    }

    // Auto-update status based on dates
    await event.updateStatusBasedOnDates();

    // Get permissions
    const permissions = event.getEditableFields();

    res.status(200).json({
      success: true,
      data: {
        status: event.status,
        permissions,
      },
    });
  } catch (error) {
    console.error('[ERROR] Get event permissions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching permissions',
    });
  }
};

// @desc    Publish a draft event
// @route   PUT /api/events/:id/publish
// @access  Private (Organizer - own events only)
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to publish this event',
      });
    }

    // Publish the event
    await event.publish();

    // Populate and return
    const populatedEvent = await Event.findById(event._id).populate('organizer', 'organizerName category contactEmail discordWebhook');

    // Send Discord notification if webhook is configured
    if (populatedEvent.organizer.discordWebhook) {
      try {
        await sendDiscordNotification(
          populatedEvent.organizer.discordWebhook,
          populatedEvent,
          'published'
        );
      } catch (webhookError) {
        console.error('[Discord] Webhook notification failed:', webhookError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      data: populatedEvent,
    });
  } catch (error) {
    console.error('[ERROR] Publish event:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark event as completed
// @route   PUT /api/events/:id/complete
// @access  Private (Organizer - own events only)
export const completeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this event',
      });
    }

    // Mark as completed
    await event.markAsCompleted();

    // Populate and return
    const populatedEvent = await Event.findById(event._id).populate('organizer', 'organizerName category contactEmail discordWebhook');

    // Send Discord notification if webhook is configured
    if (populatedEvent.organizer.discordWebhook) {
      try {
        await sendDiscordNotification(
          populatedEvent.organizer.discordWebhook,
          populatedEvent,
          'completed'
        );
      } catch (webhookError) {
        console.error('[Discord] Webhook notification failed:', webhookError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event marked as completed',
      data: populatedEvent,
    });
  } catch (error) {
    console.error('[ERROR] Complete event:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Close/cancel event
// @route   PUT /api/events/:id/close
// @access  Private (Organizer - own events only)
export const closeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the organizer of this event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to close this event',
      });
    }

    // Close the event
    await event.closeEvent();

    // Populate and return
    const populatedEvent = await Event.findById(event._id).populate('organizer', 'organizerName category contactEmail discordWebhook');

    // Send Discord notification if webhook is configured
    if (populatedEvent.organizer.discordWebhook) {
      try {
        await sendDiscordNotification(
          populatedEvent.organizer.discordWebhook,
          populatedEvent,
          'closed'
        );
      } catch (webhookError) {
        console.error('[Discord] Webhook notification failed:', webhookError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event closed successfully',
      data: populatedEvent,
    });
  } catch (error) {
    console.error('[ERROR] Close event:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get event stats for a specific organizer
// @route   GET /api/events/stats
// @access  Private (Organizer only)
export const getOrganizerEventStats = async (req, res) => {
  try {
    const { id } = req.user;

    // Total events created by organizer
    const totalEvents = await Event.countDocuments({ organizer: id });

    // Upcoming events
    const upcomingEvents = await Event.countDocuments({
      organizer: id,
      isActive: true,
      eventDate: { $gte: new Date() },
    });

    // Total registrations for the organizer's events
    const registrationStats = await Event.aggregate([
      { $match: { organizer: id } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: '$currentRegistrations' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        totalRegistrations: registrationStats[0]?.totalRegistrations || 0,
      },
    });
  } catch (error) {
    console.error('[ERROR] Get organizer event stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching organizer stats',
    });
  }
};

// ============================================
// FORM BUILDER CONTROLLERS
// ============================================

// @desc    Get custom registration form for an event
// @route   GET /api/events/:id/form
// @access  Public (participants need to see form)
export const getEventForm = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).select('customRegistrationForm formLocked eventType');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Sort fields by order
    const sortedFields = event.getSortedFormFields();

    res.status(200).json({
      success: true,
      data: {
        fields: sortedFields,
        formLocked: event.formLocked,
        eventType: event.eventType,
      },
    });
  } catch (error) {
    console.error('[ERROR] Get event form:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching form',
    });
  }
};

// @desc    Check if form can be edited
// @route   GET /api/events/:id/form/can-edit
// @access  Private (Organizer - own events only)
export const canEditEventForm = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to check this event',
      });
    }

    const canEdit = event.canEditForm();

    res.status(200).json({
      success: true,
      data: {
        canEdit,
        formLocked: event.formLocked,
        eventType: event.eventType,
        status: event.status,
        currentRegistrations: event.currentRegistrations,
        reason: !canEdit ? 'Form is locked or event status does not allow editing' : null,
      },
    });
  } catch (error) {
    console.error('[ERROR] Check form edit permission:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while checking permissions',
    });
  }
};

// @desc    Add form field
// @route   POST /api/events/:id/form/field
// @access  Private (Organizer - own events only)
export const addFormField = async (req, res) => {
  try {
    const { id } = req.params;
    const fieldData = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event',
      });
    }

    // Add field
    await event.addFormField(fieldData);

    res.status(201).json({
      success: true,
      message: 'Form field added successfully',
      data: {
        fields: event.getSortedFormFields(),
        formLocked: event.formLocked,
      },
    });
  } catch (error) {
    console.error('[ERROR] Add form field:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add form field',
    });
  }
};

// @desc    Update form field
// @route   PUT /api/events/:id/form/field/:fieldIndex
// @access  Private (Organizer - own events only)
export const updateFormField = async (req, res) => {
  try {
    const { id, fieldIndex } = req.params;
    const fieldData = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event',
      });
    }

    // Update field
    await event.updateFormField(parseInt(fieldIndex), fieldData);

    res.status(200).json({
      success: true,
      message: 'Form field updated successfully',
      data: {
        fields: event.getSortedFormFields(),
        formLocked: event.formLocked,
      },
    });
  } catch (error) {
    console.error('[ERROR] Update form field:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update form field',
    });
  }
};

// @desc    Delete form field
// @route   DELETE /api/events/:id/form/field/:fieldIndex
// @access  Private (Organizer - own events only)
export const deleteFormField = async (req, res) => {
  try {
    const { id, fieldIndex } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event',
      });
    }

    // Delete field
    await event.removeFormField(parseInt(fieldIndex));

    res.status(200).json({
      success: true,
      message: 'Form field deleted successfully',
      data: {
        fields: event.getSortedFormFields(),
        formLocked: event.formLocked,
      },
    });
  } catch (error) {
    console.error('[ERROR] Delete form field:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete form field',
    });
  }
};

// @desc    Reorder form fields
// @route   PUT /api/events/:id/form/reorder
// @access  Private (Organizer - own events only)
export const reorderFormFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body; // Array of field indices

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event',
      });
    }

    // Reorder fields
    await event.reorderFormFields(newOrder);

    res.status(200).json({
      success: true,
      message: 'Form fields reordered successfully',
      data: {
        fields: event.getSortedFormFields(),
        formLocked: event.formLocked,
      },
    });
  } catch (error) {
    console.error('[ERROR] Reorder form fields:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reorder form fields',
    });
  }
};

// @desc    Bulk update form (replace entire form)
// @route   PUT /api/events/:id/form
// @access  Private (Organizer - own events only)
export const updateEventForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body; // Array of field objects

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event',
      });
    }

    // Check if form can be edited
    if (!event.canEditForm()) {
      return res.status(400).json({
        success: false,
        message: 'Form cannot be edited. It may be locked or event status does not allow editing.',
      });
    }

    // Validate all fields
    for (let i = 0; i < fields.length; i++) {
      const errors = event.validateFormField(fields[i]);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Field ${i + 1} validation failed: ${errors.join(', ')}`,
        });
      }
    }

    // Update form
    event.customRegistrationForm = fields.map((field, index) => ({
      ...field,
      order: field.order !== undefined ? field.order : index,
    }));

    event.markModified('customRegistrationForm');
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: {
        fields: event.getSortedFormFields(),
        formLocked: event.formLocked,
      },
    });
  } catch (error) {
    console.error('[ERROR] Update event form:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update form',
    });
  }
};
