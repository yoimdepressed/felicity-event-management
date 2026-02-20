// Import required packages
import dotenv from 'dotenv';              // To read environment variables
import mongoose from 'mongoose';          // To connect to MongoDB
import User from '../models/User.js';     // User model

// Load environment variables
dotenv.config();

// ============================================
// SEED ADMIN FUNCTION
// ============================================
// Purpose: Create the first admin user in the system
// This should be run ONCE to set up the admin account

const seedAdmin = async () => {
  try {
    console.log('[SEED] Starting Admin Seed Process...\n');

    // Step 1: Connect to MongoDB
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] MongoDB Connected!\n');

    // Step 2: Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';

    // Step 3: Check if admin already exists
    console.log('[SEED] Checking if admin already exists...');
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('[WARN] Admin user already exists with email:', adminEmail);
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('Role:', existingAdmin.role);
      console.log('\n[SUCCESS] Admin seed process completed (no changes made)');
      process.exit(0);
    }

    // Step 4: Create admin user
    console.log('[SEED] Creating admin user...');
    
    const adminData = {
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      password: adminPassword,    // Will be hashed automatically by User model
      role: 'admin',
      isActive: true,
      isApproved: true,
    };

    const admin = await User.create(adminData);

    // Step 5: Display success message
    console.log('\n[SUCCESS] Admin User Created Successfully!');
    console.log('===============================================');
    console.log('Email:', admin.email);
    console.log('Name:', admin.firstName, admin.lastName);
    console.log('Role:', admin.role);
    console.log('ID:', admin._id);
    console.log('Created:', admin.createdAt);
    console.log('===============================================');
    console.log('\n[IMPORTANT] Keep these credentials safe!');
    console.log('   Use this email and password to login as admin');
    console.log('\n[SUCCESS] Admin seed process completed successfully!');

    // Step 6: Exit process
    process.exit(0);

  } catch (error) {
    console.error('\n[ERROR] Error seeding admin:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// ============================================
// RUN SEED FUNCTION
// ============================================

seedAdmin();

// ============================================
// HOW TO USE THIS SCRIPT
// ============================================

/*
STEP-BY-STEP USAGE:

1. Make sure MongoDB is configured in .env:
   ----------------------------------------
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity
   ADMIN_EMAIL=admin@felicity.com
   ADMIN_PASSWORD=Admin@123456
   ADMIN_FIRST_NAME=System
   ADMIN_LAST_NAME=Administrator


2. Run this script from terminal:
   -------------------------------
   node utils/seedAdmin.js
   
   OR using npm script:
   npm run seed


3. Expected Output:
   ----------------
   🌱 Starting Admin Seed Process...
   📡 Connecting to MongoDB...
   ✅ MongoDB Connected!
   🔍 Checking if admin already exists...
   👤 Creating admin user...
   🎉 Admin User Created Successfully!
   ═══════════════════════════════════════════
   📧 Email: admin@felicity.com
   👤 Name: System Administrator
   🎭 Role: admin
   🆔 ID: 65f1234567890abcdef12345
   📅 Created: 2026-02-17T10:30:45.123Z
   ═══════════════════════════════════════════
   🔐 IMPORTANT: Keep these credentials safe!
   ✅ Admin seed process completed successfully!


4. If admin already exists:
   -------------------------
   ⚠️  Admin user already exists with email: admin@felicity.com
   ✅ Admin seed process completed (no changes made)


5. After seeding:
   --------------
   - You can now login as admin using the email and password
   - Admin can create organizer accounts
   - Don't run this script again (it will say admin already exists)


TROUBLESHOOTING:
----------------

Error: "MONGODB_URI is not defined"
→ Solution: Add MONGODB_URI in .env file

Error: "MongoServerError: E11000 duplicate key error"
→ Solution: Admin already exists, don't need to seed again

Error: "ValidationError: User validation failed"
→ Solution: Check if all required fields are provided in adminData


SECURITY NOTES:
---------------
1. Change ADMIN_PASSWORD in .env to a strong password
2. Never commit .env file to git
3. Keep admin credentials secure
4. After deployment, change admin password immediately
*/
