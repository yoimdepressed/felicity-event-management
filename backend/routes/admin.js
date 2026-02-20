// Import Express Router
import express from 'express';

// Import controller functions
import {
  createOrganizer,
  getAllOrganizers,
  getOrganizerById,
  updateOrganizer,
  deleteOrganizer,
  permanentlyDeleteOrganizer,
  toggleOrganizerActive,
  resetOrganizerPassword,
  getDashboardStats,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
} from '../controllers/adminController.js';

import {
  getEventStats,
  getAllEventsAdmin,
  permanentlyDeleteEvent,
} from '../controllers/eventController.js';

// Import middleware
import { protect, authorize } from '../middleware/auth.js';

// Create router instance
const router = express.Router();

// ============================================
// ALL ROUTES REQUIRE ADMIN AUTHENTICATION
// ============================================
// Apply protect and authorize middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// ============================================
// ORGANIZER MANAGEMENT ROUTES
// ============================================

// @route   POST /api/admin/organizers
// @desc    Create new organizer account
// @access  Private (Admin only)
// @body    { firstName, lastName, email, password, organizerName, category, description, contactEmail }
router.post('/organizers', createOrganizer);

// @route   GET /api/admin/organizers
// @desc    Get all organizers (with filtering and pagination)
// @access  Private (Admin only)
// @query   page, limit, category, isActive, search
router.get('/organizers', getAllOrganizers);

// @route   GET /api/admin/organizers/:id
// @desc    Get single organizer by ID
// @access  Private (Admin only)
router.get('/organizers/:id', getOrganizerById);

// @route   PUT /api/admin/organizers/:id
// @desc    Update organizer details
// @access  Private (Admin only)
// @body    { firstName, lastName, organizerName, category, description, contactEmail, isActive, isApproved }
router.put('/organizers/:id', updateOrganizer);

// @route   PUT /api/admin/organizers/:id/toggle-active
// @desc    Enable or disable organizer account
// @access  Private (Admin only)
router.put('/organizers/:id/toggle-active', toggleOrganizerActive);

// @route   DELETE /api/admin/organizers/:id
// @desc    Deactivate organizer account (soft delete)
// @access  Private (Admin only)
router.delete('/organizers/:id', deleteOrganizer);

// @route   DELETE /api/admin/organizers/:id/permanent
// @desc    Permanently delete organizer from database
// @access  Private (Admin only)
router.delete('/organizers/:id/permanent', permanentlyDeleteOrganizer);

// @route   POST /api/admin/organizers/:id/reset-password
// @desc    Reset organizer password
// @access  Private (Admin only)
// @body    { newPassword }
router.post('/organizers/:id/reset-password', resetOrganizerPassword);

// ============================================
// DASHBOARD & STATISTICS ROUTES
// ============================================

// @route   GET /api/admin/stats
// @desc    Get system-wide dashboard statistics
// @access  Private (Admin only)
router.get('/stats', getDashboardStats);

// ============================================
// EVENT MANAGEMENT ROUTES
// ============================================

// @route   GET /api/admin/events/stats
// @desc    Get event statistics
// @access  Private (Admin only)
router.get('/events/stats', getEventStats);

// @route   GET /api/admin/events
// @desc    Get all events (including inactive)
// @access  Private (Admin only)
router.get('/events', getAllEventsAdmin);

// @route   DELETE /api/admin/events/:id/permanent
// @desc    Permanently delete event from database
// @access  Private (Admin only)
router.delete('/events/:id/permanent', permanentlyDeleteEvent);

// ============================================
// PASSWORD RESET REQUEST ROUTES
// ============================================

// @route   GET /api/admin/password-resets
// @desc    Get all password reset requests
// @access  Private (Admin only)
// @query   status (pending|approved|rejected|all)
router.get('/password-resets', getPasswordResetRequests);

// @route   PUT /api/admin/password-resets/:id/approve
// @desc    Approve password reset request
// @access  Private (Admin only)
// @body    { newPassword, adminNotes }
router.put('/password-resets/:id/approve', approvePasswordResetRequest);

// @route   PUT /api/admin/password-resets/:id/reject
// @desc    Reject password reset request
// @access  Private (Admin only)
// @body    { adminNotes }
router.put('/password-resets/:id/reject', rejectPasswordResetRequest);

// ============================================
// EXPORT ROUTER
// ============================================

export default router;

// ============================================
// ROUTE EXPLANATION
// ============================================

/*
HOW THESE ROUTES WORK:

1. MIDDLEWARE APPLIED TO ALL ROUTES:
   ----------------------------------
   router.use(protect);              // Verifies JWT token
   router.use(authorize('admin'));   // Checks if user role is 'admin'
   
   This means EVERY route in this file automatically:
   - Requires authentication (valid JWT token)
   - Requires admin role
   - If either fails, request is rejected before reaching controller


2. ROUTE FLOW EXAMPLE:
   --------------------
   Request: POST /api/admin/organizers
   
   Flow:
   → protect middleware (verifies token)
   → authorize('admin') middleware (checks role)
   → createOrganizer controller (creates organizer)
   → Response sent back


3. USAGE FROM FRONTEND:
   ---------------------
   
   Example: Create Organizer
   
   fetch('http://localhost:5000/api/admin/organizers', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
     },
     body: JSON.stringify({
       firstName: 'Music',
       lastName: 'Club',
       email: 'music@felicity.com',
       password: 'MusicClub@2024',
       organizerName: 'Music Club',
       category: 'Cultural',
       description: 'We organize music events',
       contactEmail: 'contact@musicclub.com'
     })
   })
   
   
   Example: Get All Organizers
   
   fetch('http://localhost:5000/api/admin/organizers?page=1&limit=10', {
     method: 'GET',
     headers: {
       'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
     }
   })
   
   
   Example: Delete Organizer
   
   fetch('http://localhost:5000/api/admin/organizers/ORGANIZER_ID_HERE', {
     method: 'DELETE',
     headers: {
       'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
     }
   })


4. ERROR RESPONSES:
   -----------------
   
   No token / Invalid token:
   { success: false, message: 'Not authorized to access this route' }
   
   Not admin:
   { success: false, message: 'Access denied. This action requires admin role' }
   
   Organizer not found:
   { success: false, message: 'Organizer not found' }
*/
