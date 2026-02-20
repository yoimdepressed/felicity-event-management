// Import User Model
import User from '../models/User.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';

// ============================================
// FUNCTION 1: CREATE ORGANIZER
// ============================================
// Purpose: Admin creates a new organizer account with auto-generated credentials
// Route: POST /api/admin/organizers
// Access: Private (Admin only)

export const createOrganizer = async (req, res) => {
  try {
    // Step 1: Extract organizer data from request body
    const {
      organizerName,
      category,
      description,
      contactEmail,
      discordWebhook,
    } = req.body;

    // Step 2: Basic validation - only organizerName required
    if (!organizerName || !category || !description || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: organizerName, category, description, contactEmail',
      });
    }

    // Step 3: Auto-generate login email from organizer name
    // Convert "Sports Committee" -> "sports.committee@felicity.iiit.ac.in"
    const emailPrefix = organizerName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '.'); // Replace spaces with dots
    
    let generatedEmail = `${emailPrefix}@felicity.iiit.ac.in`;
    
    // Step 4: Check if email already exists, add number if needed
    let counter = 1;
    let emailExists = await User.findOne({ email: generatedEmail });
    while (emailExists) {
      generatedEmail = `${emailPrefix}${counter}@felicity.iiit.ac.in`;
      emailExists = await User.findOne({ email: generatedEmail });
      counter++;
    }

    // Step 5: Auto-generate secure random password (12 characters)
    const generatePassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*';
      const allChars = uppercase + lowercase + numbers + symbols;
      
      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill rest randomly
      for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };
    
    const generatedPassword = generatePassword();

    // Step 6: Extract firstName and lastName from organizerName
    const nameParts = organizerName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Club';
    const lastName = nameParts.slice(1).join(' ') || 'Admin';

    // Step 7: Prepare organizer data
    const organizerData = {
      firstName,
      lastName,
      email: generatedEmail,
      password: generatedPassword,
      role: 'organizer',
      organizerName,
      category,
      description,
      contactEmail,
      discordWebhook,
      isActive: true,
      isApproved: true,
    };

    // Step 8: Validate organizer-specific fields using User Model method
    const validationErrors = User.validateOrganizer(organizerData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Step 9: Create organizer in database
    // Password will be automatically hashed by User model pre-save middleware
    const organizer = await User.create(organizerData);

    // Step 10: Generate JWT token for the organizer
    const token = organizer.generateToken();

    // Step 11: Send success response with generated credentials
    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully with auto-generated credentials',
      token,
      organizer: organizer.getPublicProfile(),
      credentials: {
        email: generatedEmail,
        password: generatedPassword,  // Plain text password (before hashing) to share with organizer
        message: 'IMPORTANT: Share these credentials with the organizer. They can log in immediately.'
      }
    });

  } catch (error) {
    console.error('Create Organizer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organizer account',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 2: GET ALL ORGANIZERS
// ============================================
// Purpose: Admin gets list of all organizers
// Route: GET /api/admin/organizers
// Access: Private (Admin only)

export const getAllOrganizers = async (req, res) => {
  try {
    // Step 1: Get query parameters for filtering/pagination
    const { page = 1, limit = 10, category, isActive, search } = req.query;

    // Step 2: Build query
    const query = { role: 'organizer' };

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name or email if provided
    if (search) {
      query.$or = [
        { organizerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Step 3: Execute query with pagination
    const skip = (page - 1) * limit;
    
    const organizers = await User.find(query)
      .select('-password')  // Exclude password
      .sort({ createdAt: -1 })  // Newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Step 4: Get total count for pagination
    const total = await User.countDocuments(query);

    // Step 5: Send response
    res.status(200).json({
      success: true,
      count: organizers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      organizers,
    });

  } catch (error) {
    console.error('Get Organizers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizers',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 3: GET SINGLE ORGANIZER
// ============================================
// Purpose: Admin gets details of a specific organizer
// Route: GET /api/admin/organizers/:id
// Access: Private (Admin only)

export const getOrganizerById = async (req, res) => {
  try {
    // Step 1: Get organizer ID from URL parameter
    const { id } = req.params;

    // Step 2: Find organizer by ID
    const organizer = await User.findById(id).select('-password');

    // Step 3: Check if organizer exists and is actually an organizer
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Step 4: Send organizer data
    res.status(200).json({
      success: true,
      organizer,
    });

  } catch (error) {
    console.error('Get Organizer By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 4: UPDATE ORGANIZER
// ============================================
// Purpose: Admin updates organizer details
// Route: PUT /api/admin/organizers/:id
// Access: Private (Admin only)

export const updateOrganizer = async (req, res) => {
  try {
    // Step 1: Get organizer ID from URL parameter
    const { id } = req.params;

    // Step 2: Find organizer
    const organizer = await User.findById(id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Step 3: Extract updatable fields from request body
    const {
      firstName,
      lastName,
      organizerName,
      category,
      description,
      contactEmail,
      discordWebhook,
      isActive,
      isApproved,
    } = req.body;

    // Step 4: Update fields
    if (firstName) organizer.firstName = firstName;
    if (lastName) organizer.lastName = lastName;
    if (organizerName) organizer.organizerName = organizerName;
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;
    if (isActive !== undefined) organizer.isActive = isActive;
    if (isApproved !== undefined) organizer.isApproved = isApproved;

    // Step 5: Save updated organizer
    await organizer.save();

    // Step 6: Send success response
    res.status(200).json({
      success: true,
      message: 'Organizer updated successfully',
      organizer: organizer.getPublicProfile(),
    });

  } catch (error) {
    console.error('Update Organizer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organizer',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 5: DELETE ORGANIZER (SOFT DELETE)
// ============================================
// Purpose: Admin deactivates organizer account
// Route: DELETE /api/admin/organizers/:id
// Access: Private (Admin only)

export const deleteOrganizer = async (req, res) => {
  try {
    // Step 1: Get organizer ID from URL parameter
    const { id } = req.params;

    // Step 2: Find organizer
    const organizer = await User.findById(id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Step 3: Soft delete - just deactivate the account
    organizer.isActive = false;
    await organizer.save();

    // Step 4: Send success response
    res.status(200).json({
      success: true,
      message: 'Organizer account deactivated successfully',
    });

  } catch (error) {
    console.error('Delete Organizer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organizer',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 5A: TOGGLE ORGANIZER ACTIVE STATUS
// ============================================
// Purpose: Admin can enable/disable organizer accounts
// Route: PUT /api/admin/organizers/:id/toggle-active
// Access: Private (Admin only)

export const toggleOrganizerActive = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Toggle the active status
    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: `Organizer account ${organizer.isActive ? 'enabled' : 'disabled'} successfully`,
      organizer: organizer.getPublicProfile(),
    });

  } catch (error) {
    console.error('Toggle Organizer Active Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle organizer status',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 6: PERMANENTLY DELETE ORGANIZER
// ============================================
// Purpose: Admin permanently removes organizer from database
// Route: DELETE /api/admin/organizers/:id/permanent
// Access: Private (Admin only)

export const permanentlyDeleteOrganizer = async (req, res) => {
  try {
    // Step 1: Get organizer ID from URL parameter
    const { id } = req.params;

    // Step 2: Find and delete organizer
    const organizer = await User.findById(id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Step 3: Permanently delete from database
    await User.findByIdAndDelete(id);

    // Step 4: Send success response
    res.status(200).json({
      success: true,
      message: 'Organizer permanently deleted from system',
    });

  } catch (error) {
    console.error('Permanent Delete Organizer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete organizer',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 7: RESET ORGANIZER PASSWORD
// ============================================
// Purpose: Admin resets organizer password
// Route: POST /api/admin/organizers/:id/reset-password
// Access: Private (Admin only)

export const resetOrganizerPassword = async (req, res) => {
  try {
    // Step 1: Get organizer ID and new password
    const { id } = req.params;
    const { newPassword } = req.body;

    // Step 2: Validate new password
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Step 3: Find organizer
    const organizer = await User.findById(id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Step 4: Update password
    organizer.password = newPassword;
    await organizer.save();  // Password will be automatically hashed

    // Step 5: Send success response
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      credentials: {
        email: organizer.email,
        newPassword: newPassword,  // Send to admin so they can share with organizer
        message: 'Share these credentials with the organizer'
      }
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 8: GET DASHBOARD STATISTICS
// ============================================
// Purpose: Admin gets system-wide statistics
// Route: GET /api/admin/stats
// Access: Private (Admin only)

export const getDashboardStats = async (req, res) => {
  try {
    // Step 1: Count users by role
    const totalParticipants = await User.countDocuments({ role: 'participant' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Step 2: Count active vs inactive organizers
    const activeOrganizers = await User.countDocuments({ role: 'organizer', isActive: true });
    const inactiveOrganizers = await User.countDocuments({ role: 'organizer', isActive: false });

    // Step 3: Count IIIT vs Non-IIIT participants
    const iiitParticipants = await User.countDocuments({ role: 'participant', participantType: 'IIIT' });
    const nonIiitParticipants = await User.countDocuments({ role: 'participant', participantType: 'Non-IIIT' });

    // Step 4: Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Step 5: Send statistics
    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalParticipants + totalOrganizers + totalAdmins,
          participants: totalParticipants,
          organizers: totalOrganizers,
          admins: totalAdmins,
        },
        organizers: {
          total: totalOrganizers,
          active: activeOrganizers,
          inactive: inactiveOrganizers,
        },
        participants: {
          total: totalParticipants,
          iiit: iiitParticipants,
          nonIiit: nonIiitParticipants,
        },
        recentActivity: {
          registrationsLast7Days: recentRegistrations,
        },
      },
    });

  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 9: REQUEST PASSWORD RESET
// ============================================
// Purpose: Admin requests a password reset for an organizer
// Route: POST /api/admin/organizers/:id/request-password-reset
// Access: Private (Admin only)

export const requestPasswordReset = async (req, res) => {
  try {
    // Step 1: Get organizer ID from URL parameter
    const { id } = req.params;

    // Step 2: Find organizer by ID
    const organizer = await User.findById(id);

    // Step 3: Check if organizer exists
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    // Step 4: Generate password reset token (JWT)
    const resetToken = organizer.generateResetToken();

    // Step 5: Create or update password reset request in database
    await PasswordResetRequest.findOneAndUpdate(
      { userId: organizer._id },
      { token: resetToken, createdAt: Date.now() },
      { upsert: true }
    );

    // Step 6: TODO: Send email to organizer with password reset link (containing the token)

    // Step 7: Send success response
    res.status(200).json({
      success: true,
      message: 'Password reset requested successfully. Please check your email for the reset link.',
    });

  } catch (error) {
    console.error('Request Password Reset Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request password reset',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 10: RESET PASSWORD USING TOKEN
// ============================================
// Purpose: Organizer resets password using the token from the password reset email
// Route: POST /api/admin/organizers/reset-password
// Access: Public

export const resetPasswordUsingToken = async (req, res) => {
  try {
    // Step 1: Get token and new password from request body
    const { token, newPassword } = req.body;

    // Step 2: Validate token and find associated organizer
    const passwordResetRequest = await PasswordResetRequest.findOne({ token }).populate('userId');

    if (!passwordResetRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    const organizer = passwordResetRequest.userId;

    // Step 3: Update organizer password
    organizer.password = newPassword;
    await organizer.save();  // Password will be automatically hashed

    // Step 4: Remove password reset request from database
    await PasswordResetRequest.findByIdAndDelete(passwordResetRequest._id);

    // Step 5: Send success response
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Reset Password Using Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 11: GET ALL PASSWORD RESET REQUESTS
// ============================================
// Purpose: Admin gets all password reset requests
// Route: GET /api/admin/password-resets
// Access: Private (Admin only)

export const getPasswordResetRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const query = status !== 'all' ? { status } : {};

    const requests = await PasswordResetRequest.find(query)
      .populate('user', 'firstName lastName email role organizerName')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Get Password Reset Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password reset requests',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 12: APPROVE PASSWORD RESET REQUEST
// ============================================
// Purpose: Admin approves a password reset request
// Route: PUT /api/admin/password-resets/:id/approve
// Access: Private (Admin only)

export const approvePasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, adminNotes } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Find the request
    const request = await PasswordResetRequest.findById(id).populate('user');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed',
      });
    }

    // Update user password
    const user = await User.findById(request.user._id).select('+password');
    user.password = newPassword;
    await user.save();

    // Update request
    request.status = 'approved';
    request.newPassword = newPassword; // Store for admin records
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Password reset request approved and password updated',
      request,
    });
  } catch (error) {
    console.error('Approve Password Reset Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve password reset request',
      error: error.message,
    });
  }
};

// ============================================
// FUNCTION 13: REJECT PASSWORD RESET REQUEST
// ============================================
// Purpose: Admin rejects a password reset request
// Route: PUT /api/admin/password-resets/:id/reject
// Access: Private (Admin only)

export const rejectPasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await PasswordResetRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed',
      });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Password reset request rejected',
      request,
    });
  } catch (error) {
    console.error('Reject Password Reset Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject password reset request',
      error: error.message,
    });
  }
};
