// Import Express Router
import express from 'express';

// Import controller functions
import {
  getAllEvents,
  getTrendingEvents,
  getEventById,
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
  toggleRegistration,
  getEventRegistrations,
  getEventPermissions,
  publishEvent,
  completeEvent,
  closeEvent,
  getEventForm,
  canEditEventForm,
  addFormField,
  updateFormField,
  deleteFormField,
  reorderFormFields,
  updateEventForm,
} from '../controllers/eventController.js';

// Import middleware
import { protect, authorize } from '../middleware/auth.js';

// Create router instance
const router = express.Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// @route   GET /api/events
// @desc    Get all active events with optional filters
// @access  Public
// @query   eventType (Normal/Merchandise), eligibility, search (text), startDate, endDate, followedClubs (JSON array)
router.get('/', getAllEvents);

// @route   GET /api/events/trending
// @desc    Get trending events (top 5 from last 24 hours)
// @access  Public
router.get('/trending', getTrendingEvents);

// ============================================
// ORGANIZER ROUTES (Authentication Required)
// ============================================

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Organizer only)
// @body    { eventName, eventType, description, venue, eventDate, registrationDeadline, maxParticipants, price, availableStock, sizes, posterUrl }
router.post('/', protect, authorize('organizer'), createEvent);

// @route   GET /api/events/my-events
// @desc    Get events created by logged-in organizer
// @access  Private (Organizer only)
// NOTE: This route MUST be defined BEFORE /:id to avoid conflicts (specific routes before dynamic routes)
router.get('/my-events', protect, authorize('organizer'), getMyEvents);

// ============================================
// PUBLIC ROUTES (Continued)
// ============================================

// @route   GET /api/events/:id
// @desc    Get single event details
// @access  Public
// NOTE: This dynamic route is placed AFTER /my-events to avoid route conflicts
router.get('/:id', getEventById);

// @route   GET /api/events/:id/registrations
// @desc    Get all registrations for a specific event
// @access  Private (Organizer - own events only)
router.get('/:id/registrations', protect, authorize('organizer'), getEventRegistrations);

// @route   GET /api/events/:id/permissions
// @desc    Get event edit permissions based on status
// @access  Private (Organizer - own events only)
router.get('/:id/permissions', protect, authorize('organizer'), getEventPermissions);

// ============================================
// FORM BUILDER ROUTES
// ============================================

// @route   GET /api/events/:id/form
// @desc    Get custom registration form for an event
// @access  Public (participants need to see the form)
router.get('/:id/form', getEventForm);

// @route   GET /api/events/:id/form/can-edit
// @desc    Check if form can be edited
// @access  Private (Organizer - own events only)
router.get('/:id/form/can-edit', protect, authorize('organizer'), canEditEventForm);

// @route   POST /api/events/:id/form/field
// @desc    Add a field to the custom form
// @access  Private (Organizer - own events only)
router.post('/:id/form/field', protect, authorize('organizer'), addFormField);

// @route   PUT /api/events/:id/form/field/:fieldIndex
// @desc    Update a specific form field
// @access  Private (Organizer - own events only)
router.put('/:id/form/field/:fieldIndex', protect, authorize('organizer'), updateFormField);

// @route   DELETE /api/events/:id/form/field/:fieldIndex
// @desc    Delete a specific form field
// @access  Private (Organizer - own events only)
router.delete('/:id/form/field/:fieldIndex', protect, authorize('organizer'), deleteFormField);

// @route   PUT /api/events/:id/form/reorder
// @desc    Reorder form fields
// @access  Private (Organizer - own events only)
router.put('/:id/form/reorder', protect, authorize('organizer'), reorderFormFields);

// @route   PUT /api/events/:id/form
// @desc    Bulk update entire form
// @access  Private (Organizer - own events only)
router.put('/:id/form', protect, authorize('organizer'), updateEventForm);

// ============================================
// STATUS MANAGEMENT ROUTES
// ============================================

// @route   PUT /api/events/:id/publish
// @desc    Publish a draft event
// @access  Private (Organizer - own events only)
router.put('/:id/publish', protect, authorize('organizer'), publishEvent);

// @route   PUT /api/events/:id/complete
// @desc    Mark event as completed
// @access  Private (Organizer - own events only)
router.put('/:id/complete', protect, authorize('organizer'), completeEvent);

// @route   PUT /api/events/:id/close
// @desc    Close/cancel event
// @access  Private (Organizer - own events only)
router.put('/:id/close', protect, authorize('organizer'), closeEvent);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Organizer - own events only)
// @body    Any event fields to update
router.put('/:id', protect, authorize('organizer'), updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event (soft delete - sets isActive to false)
// @access  Private (Organizer - own events only)
router.delete('/:id', protect, authorize('organizer'), deleteEvent);

// @route   PATCH /api/events/:id/toggle-registration
// @desc    Toggle event registration (open/close)
// @access  Private (Organizer - own events only)
router.patch('/:id/toggle-registration', protect, authorize('organizer'), toggleRegistration);

// ============================================
// EXPORT ROUTER
// ============================================

export default router;

// ============================================
// ROUTE FLOW EXPLANATION
// ============================================

/*
HOW EVENT ROUTES WORK:

1. PUBLIC ROUTES (browse events, view details):
   --------------------------------------------
   Request → Route → Controller → Response
   
   Example: GET /api/events
   User browses events → getAllEvents function runs → 
   Returns list of active events with filters


2. ORGANIZER ROUTES (create, update, delete events):
   --------------------------------------------------
   Request → Route → protect middleware → authorize middleware → Controller → Response
   
   Example: POST /api/events
   Organizer sends event data with JWT token → protect verifies token →
   authorize checks if user is organizer → createEvent function runs → 
   Creates event in database → Returns event data


MIDDLEWARE FLOW:
----------------
router.post('/', protect, authorize('organizer'), createEvent);
             ↑       ↑           ↑                    ↑
             Step 1  Step 2      Step 3               Step 4

1. protect: Verifies JWT token, sets req.user
2. authorize('organizer'): Checks if req.user.role === 'organizer'
3. createEvent: Runs if both middlewares pass
4. Response: Sends back result


ROUTE ORDER MATTERS:
-------------------
✅ Correct Order:
router.get('/my-events', protect, authorize('organizer'), getMyEvents);
router.get('/:id', getEventById);

❌ Wrong Order:
router.get('/:id', getEventById);
router.get('/my-events', protect, authorize('organizer'), getMyEvents);

In wrong order, 'my-events' would be treated as an ID parameter!


HOW TO USE THESE ROUTES IN FRONTEND:
------------------------------------

1. Browse Events (Public):
   axios.get('http://localhost:5000/api/events', {
     params: {
       eventType: 'Normal',      // Filter by type
       organizer: '507f1f77...',  // Filter by organizer
       search: 'workshop',        // Search text
       upcoming: true             // Only upcoming events
     }
   })

2. Get Event Details (Public):
   axios.get(`http://localhost:5000/api/events/${eventId}`)

3. Create Event (Organizer):
   axios.post('http://localhost:5000/api/events', {
     eventName: 'Web Development Workshop',
     eventType: 'Normal',
     description: 'Learn React and Node.js',
     venue: 'Auditorium',
     eventDate: '2026-03-15',
     registrationDeadline: '2026-03-10',
     maxParticipants: 100,
     price: 0
   }, {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })

4. Get My Events (Organizer):
   axios.get('http://localhost:5000/api/events/my-events', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })

5. Update Event (Organizer):
   axios.put(`http://localhost:5000/api/events/${eventId}`, {
     description: 'Updated description',
     maxParticipants: 150
   }, {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })

6. Delete Event (Organizer):
   axios.delete(`http://localhost:5000/api/events/${eventId}`, {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })

7. Toggle Registration (Organizer):
   axios.patch(`http://localhost:5000/api/events/${eventId}/toggle-registration`, {}, {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN'
     }
   })


EVENT TYPES:
-----------

1. Normal Event:
   {
     eventName: 'Web Development Workshop',
     eventType: 'Normal',
     description: 'Learn full-stack development',
     venue: 'Auditorium',
     eventDate: '2026-03-15',
     registrationDeadline: '2026-03-10',
     maxParticipants: 100,
     price: 0
   }

2. Merchandise Event:
   {
     eventName: 'Felicity T-Shirt',
     eventType: 'Merchandise',
     description: 'Official Felicity 2026 T-Shirt',
     venue: 'Online Store',
     eventDate: '2026-03-20',
     registrationDeadline: '2026-03-18',
     price: 299,
     availableStock: 500,
     sizes: ['S', 'M', 'L', 'XL']
   }
*/
