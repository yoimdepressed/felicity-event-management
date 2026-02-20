// Import User Model
import User from '../models/User.js';

// ============================================
// FUNCTION 1: CREATE ORGANIZER
// ============================================
// Purpose: Admin creates a new organizer account
// Route: POST /api/admin/organizers
// Access: Private (Admin only)

export const createOrganizer = async (req, res) => {
  try {
    // Step 1: Extract organizer data from request body
    const {
      firstName,
      lastName,
      email,
      password,
      organizerName,
      category,
      description,
      contactEmail,
      discordWebhook,
    } = req.body;

    // Step 2: Basic validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password',
      });
    }

    // Step 3: Prepare organizer data
    const organizerData = {
      firstName,
      lastName,
      email,
      password,
      role: 'organizer',  // Force role to be organizer
      organizerName,
      category,
      description,
      contactEmail: contactEmail || email,  // Use login email if contactEmail not provided
      discordWebhook,
      isActive: true,
      isApproved: true,
    };

    // Step 4: Validate organizer-specific fields using User Model method
    const validationErrors = User.validateOrganizer(organizerData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Step 5: Check if organizer with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email.',
      });
    }

    // Step 6: Create organizer in database
    // Password will be automatically hashed by User model pre-save middleware
    const organizer = await User.create(organizerData);

    // Step 7: Generate JWT token for the organizer
    const token = organizer.generateToken();

    // Step 8: Send success response
    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully',
      token,
      organizer: organizer.getPublicProfile(),
      credentials: {
        email: organizer.email,
        temporaryPassword: password,  // Send password to admin so they can share with organizer
        message: 'Share these credentials with the organizer'
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
