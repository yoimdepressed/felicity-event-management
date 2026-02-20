import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware - CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  // Add more origins as needed
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Felicity Event Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      events: '/api/events',
      public: '/api/public'
    }
  });
});

// ============================================
// API ROUTES
// ============================================

// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Event routes
app.use('/api/events', eventRoutes);

// Registration routes
app.use('/api/registrations', registrationRoutes);

// Other routes (to be added)
// app.use('/api/participants', participantRoutes);
// app.use('/api/organizers', organizerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
