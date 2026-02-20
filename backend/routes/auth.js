// Import Express Router
import express from 'express';

// Import controller functions
import {
  registerParticipant,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';

// Import middleware
import { protect, authorize } from '../middleware/auth.js';

// Create router instance
const router = express.Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// @route   POST /api/auth/register
// @desc    Register new participant (IIIT or Non-IIIT)
// @access  Public
// @body    { firstName, lastName, email, password, participantType, college, contactNumber }
router.post('/register', registerParticipant);

// @route   POST /api/auth/login
// @desc    Login user (Participant, Organizer, or Admin)
// @access  Public
// @body    { email, password }
router.post('/login', login);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// @route   POST /api/auth/logout
// @desc    Logout user (clear token on frontend)
// @access  Private (must be logged in)
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's information
// @access  Private (must be logged in)
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private (must be logged in)
// @body    Depends on role:
//          Participant: { firstName, lastName, contactNumber, college, interests, followedClubs }
//          Organizer: { firstName, lastName, organizerName, category, description, contactEmail, discordWebhook }
router.put('/profile', protect, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private (must be logged in)
// @body    { currentPassword, newPassword }
router.put('/change-password', protect, changePassword);

// ============================================
// EXPORT ROUTER
// ============================================

export default router;

// ============================================
// ROUTE FLOW EXPLANATION
// ============================================

/*
HOW ROUTES WORK:

1. PUBLIC ROUTES (register, login):
   --------------------------------
   Request → Route → Controller → Response
   
   Example: POST /api/auth/register
   User sends registration data → registerParticipant function runs → 
   Creates user → Sends back token


2. PROTECTED ROUTES (logout, me, profile, change-password):
   ---------------------------------------------------------
   Request → Route → protect middleware → Controller → Response
   
   Example: GET /api/auth/me
   User sends request with token in header → protect middleware verifies token →
   If valid: getMe function runs → Sends back user data
   If invalid: Returns 401 error


MIDDLEWARE ORDER MATTERS:
-------------------------
router.get('/me', protect, getMe);
                  ↑        ↑
                  First    Second
                  
The protect middleware MUST run before getMe because:
- protect extracts and verifies the token
- protect sets req.user with user information
- getMe uses req.user to fetch data


HOW TO USE THESE ROUTES IN FRONTEND:
------------------------------------

1. Register:
   fetch('http://localhost:5000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       firstName: 'John',
       lastName: 'Doe',
       email: 'john@iiit.ac.in',
       password: 'password123',
       participantType: 'IIIT',
       college: 'IIIT Hyderabad',
       contactNumber: '+91-9876543210'
     })
   })

2. Login:
   fetch('http://localhost:5000/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'john@iiit.ac.in',
       password: 'password123'
     })
   })

3. Get Current User (Protected):
   fetch('http://localhost:5000/api/auth/me', {
     method: 'GET',
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN_HERE'
     }
   })

4. Update Profile (Protected):
   fetch('http://localhost:5000/api/auth/profile', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_TOKEN_HERE'
     },
     body: JSON.stringify({
       firstName: 'Jane',
       interests: ['coding', 'music']
     })
   })
*/
