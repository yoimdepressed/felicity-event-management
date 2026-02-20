// Import required packages
import jwt from 'jsonwebtoken';       // To verify JWT tokens
import User from '../models/User.js'; // To fetch user data

// ============================================
// MIDDLEWARE 1: PROTECT (Authentication)
// ============================================
// Purpose: Verify user is logged in (has valid JWT token)
// Used on: All protected routes that require authentication
// How it works: Checks for token → Verifies token → Attaches user to request

export const protect = async (req, res, next) => {
  try {
    let token;

    // Step 1: Check if token exists in request header
    // Frontend will send token in Authorization header like: "Bearer xyz123abc456..."
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from "Bearer TOKEN" format
      // Split by space and take second part: ["Bearer", "xyz123abc456..."]
      token = req.headers.authorization.split(' ')[1];
    }

    // Step 2: If no token found, deny access
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    // Step 3: Verify token
    try {
      // jwt.verify checks if:
      // 1. Token is valid (not tampered with)
      // 2. Token is not expired
      // 3. Token was signed with our JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded contains: { id: "user123", role: "participant", iat: ..., exp: ... }
      // iat = issued at (timestamp when token was created)
      // exp = expiration time

      // Step 4: Fetch user from database using ID from token
      const user = await User.findById(decoded.id);

      // Step 5: Check if user still exists (maybe account was deleted)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists. Please login again.',
        });
      }

      // Step 6: Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administrator.',
        });
      }

      // Step 7: Attach user to request object
      // Now any route using this middleware can access req.user
      req.user = {
        id: user._id,
        _id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      // Step 8: Move to next middleware or route handler
      next();

    } catch (error) {
      // Token verification failed (invalid or expired)
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please login again.',
        });
      }

      // Other errors
      throw error;
    }

  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// ============================================
// MIDDLEWARE 2: AUTHORIZE (Authorization)
// ============================================
// Purpose: Check if user has required role(s) for this action
// Used on: Role-specific routes (admin-only, organizer-only, etc.)
// How it works: Checks req.user.role against allowed roles

// This is a higher-order function (function that returns a function)
// We use it like: authorize('admin') or authorize('admin', 'organizer')
export const authorize = (...roles) => {
  // ...roles uses "rest operator" to collect all arguments into an array
  // authorize('admin', 'organizer') → roles = ['admin', 'organizer']

  return (req, res, next) => {
    // Step 1: Check if user object exists (protect middleware should set this)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please login.',
      });
    }

    // Step 2: Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires ${roles.join(' or ')} role. Your role: ${req.user.role}`,
      });
    }

    // Step 3: User has correct role, allow access
    next();
  };
};

// ============================================
// MIDDLEWARE 3: OPTIONAL AUTH (Optional Authentication)
// ============================================
// Purpose: Try to authenticate user, but don't block if not authenticated
// Used on: Public routes that show different content for logged-in users
// Example: Browse events page (public, but shows "followed clubs" filter if logged in)

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Step 1: Check if token exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Step 2: If no token, just continue (don't block the request)
    if (!token) {
      req.user = null; // Set user to null
      return next();
    }

    // Step 3: If token exists, try to verify it
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && user.isActive) {
        // Attach user if found and active
        req.user = {
          id: user._id,
          _id: user._id,
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      // If token verification fails, just set user to null (don't block request)
      req.user = null;
    }

    // Continue to route handler
    next();

  } catch (error) {
    console.error('Optional Auth Error:', error);
    req.user = null;
    next(); // Don't block the request even if error occurs
  }
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*
Example 1: Protected route (must be logged in)
-----------------------------------------------
import { protect } from '../middleware/auth.js';

router.get('/profile', protect, getProfile);
// User must be logged in to access /profile


Example 2: Role-specific route (must be admin)
-----------------------------------------------
import { protect, authorize } from '../middleware/auth.js';

router.post('/admin/create-organizer', protect, authorize('admin'), createOrganizer);
// User must be logged in AND must be admin


Example 3: Multiple allowed roles
----------------------------------
router.put('/event/:id', protect, authorize('organizer', 'admin'), updateEvent);
// User must be organizer OR admin


Example 4: Optional authentication
-----------------------------------
import { optionalAuth } from '../middleware/auth.js';

router.get('/events', optionalAuth, getEvents);
// Anyone can access, but if logged in, req.user will be available


Example 5: Combining multiple middleware
-----------------------------------------
router.post(
  '/event/register',
  protect,                        // Must be logged in
  authorize('participant'),       // Must be participant
  validateEventRegistration,      // Custom validation middleware
  registerForEvent               // Final route handler
);
*/
