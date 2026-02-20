// Import User Model
import User from '../models/User.js';

// REGISTER PARTICIPANT

export const registerParticipant = async (req, res) => {
  try {
    // Step 1: Extract data from request body
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,    // "IIIT" or "Non-IIIT"
      college,
      contactNumber,
      interests,          // Optional: array of interests
      followedClubs,      // Optional: array of club IDs
    } = req.body;

    // Step 2: Basic validation - check if required fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password',
      });
    }

    // Step 3: Prepare user data with role set to 'participant'
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: 'participant',      // Force role to be participant
      participantType,
      college,
      contactNumber,
      interests: interests || [],
      followedClubs: followedClubs || [],
    };

    // Step 4: Validate participant-specific fields using our User Model method
    const validationErrors = User.validateParticipant(userData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Step 5: Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.',
      });
    }

    // Step 6: Create new user in database
    const user = await User.create(userData);

    // Step 7: Generate JWT token for the new user
    const token = user.generateToken();

    // Step 8: Send success response with token and user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.getPublicProfile(),  // Returns user without password
    });

  } catch (error) {
    // Handle any errors (database errors, validation errors, etc.)
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
};

// LOGIN

export const login = async (req, res) => {
  try {    
    // Step 1: Extract email and password from request body
    const { email, password } = req.body;

    // Step 2: Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Step 3: Find user by email
    // We use .select('+password') because password has select: false in model
    const user = await User.findOne({ email }).select('+password');

    // Step 4: Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Step 5: Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.',
      });
    }

    // Step 6: Compare entered password with stored hashed password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Step 7: Generate JWT token
    const token = user.generateToken();

    // Step 8: Send success response with token and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
      role: user.role,  // Send role for frontend to redirect to correct dashboard
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message,
    });
  }
};

// LOGOUT

export const logout = async (req, res) => {
  try {
    // Since JWT is stateless, we don't actually delete anything on backend
    // The frontend will delete the token from localStorage/cookies
    // We just send a confirmation response

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

// GET CURRENT USER


export const getMe = async (req, res) => {
  try {
    // Step 1: Get user ID from request
    // Note: req.user will be set by the 'protect' middleware (we'll create this next)
    const userId = req.user.id;

    // Step 2: Fetch user from database
    // Populate followedClubs to get organizer details
    const user = await User.findById(userId).populate('followedClubs', 'organizerName category');

    // Step 3: Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Step 4: Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Step 5: Send user data
    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
    });

  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};

// UPDATE PROFILE

export const updateProfile = async (req, res) => {
  try {
    // Step 1: Get user ID from request
    const userId = req.user.id;

    // Step 2: Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Step 3: Extract updatable fields from request body
    const {
      firstName,
      lastName,
      contactNumber,
      college,
      interests,
      followedClubs,
      organizerName,
      category,
      description,
      contactEmail,
      discordWebhook,
    } = req.body;

    // Step 4: Update fields based on user role
    if (user.role === 'participant') {
      // Participants can update these fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (contactNumber) user.contactNumber = contactNumber;
      if (college) user.college = college;
      if (interests) user.interests = interests;
      if (followedClubs) user.followedClubs = followedClubs;
    } else if (user.role === 'organizer') {
      // Organizers can update these fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (organizerName) user.organizerName = organizerName;
      if (category) user.category = category;
      if (description) user.description = description;
      if (contactEmail) user.contactEmail = contactEmail;
      if (discordWebhook) user.discordWebhook = discordWebhook;
    }

    // Step 5: Save updated user
    await user.save();

    // Step 6: Send success response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// CHANGE PASSWORD

export const changePassword = async (req, res) => {
  try {
    // Step 1: Get user ID and passwords from request
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Step 2: Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Step 3: Find user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Step 4: Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Step 5: Update password
    user.password = newPassword;
    await user.save();  // Pre-save middleware will hash the new password

    // Step 6: Send success response
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};
