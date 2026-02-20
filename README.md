# Felicity Event Management System

A comprehensive event management platform built with the MERN stack for managing Felicity fest events, clubs, and participants.

## 📋 Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features Implemented](#features-implemented)
- [User Data Models](#user-data-models)
- [Installation & Setup](#installation--setup)
- [Libraries & Dependencies](#libraries--dependencies)
- [API Endpoints](#api-endpoints)
- [Running the Application](#running-the-application)

---

## 🎯 Overview

The Felicity Event Management System replaces scattered Google Forms, spreadsheets, and WhatsApp groups with a single centralized platform. The system provides:

- **Participants**: Browse events, register with tier selection, track registrations
- **Organizers**: Create and manage events, view participant lists
- **Admins**: Full control over organizer accounts and system oversight

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose 9.2.0

### Frontend
- **Library**: React 18.3.1
- **Routing**: React Router DOM 7.1.3
- **UI Framework**: Material-UI 6.3.0
- **HTTP Client**: Axios 1.7.9

---

## ✨ Features Implemented

### Section 4: Authentication & Security [8 Marks]

#### 4.1 Registration & Login
- **Participant Registration**:
  - IIIT students: Email validation for `@iiit.ac.in`, `@students.iiit.ac.in`, `@research.iiit.ac.in`
  - Non-IIIT: Register with any email and password
  - College field auto-filled for IIIT students
  
- **Organizer Authentication**:
  - No self-registration (admin provisioned only)
  - Login with admin-provided credentials
  - Password reset handled by admin
  
- **Admin Account Provisioning**:
  - First user in system (seed script)
  - No UI registration for admin
  - Full CRUD control over organizers

#### 4.2 Security Requirements
- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: 7-day expiration, stateless tokens
- **Role-Based Access Control**: 
  - Frontend: PrivateRoute component checks user role
  - Backend: `protect` and `authorize` middleware

#### 4.3 Session Management
- Login redirects to role-specific dashboard
- Sessions persist across browser restarts (localStorage)
- Logout clears all authentication tokens

### Section 5: User Onboarding & Preferences [3 Marks]

- **Post-Registration Onboarding**:
  - Select interests from 14 categories (Music, Dance, Sports, Coding, etc.)
  - Follow clubs/organizers for event updates
  - Optional: Can skip and configure later
  
- **Profile Management**:
  - Edit preferences anytime from dashboard
  - Preferences stored in database
  - Will influence event recommendations (upcoming feature)

### Section 6: User Data Models [2 Marks]

Our system uses a unified User model with role-based fields:

#### Participant Fields (7 required + 2 additional):
```javascript
{
  // Required fields
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  participantType: Enum ['IIIT', 'Non-IIIT'],
  college: String,
  contactNumber: String,
  
  // Additional fields for enhanced functionality
  interests: [String],              // Event recommendations
  followedClubs: [ObjectId]         // Personalized updates
}
```

#### Organizer Fields (4 required + 1 additional):
```javascript
{
  // Required fields
  organizerName: String,
  category: String,
  description: String,
  contactEmail: String,
  
  // Additional field
  discordWebhook: String (optional)  // Automated notifications
}
```

#### Common Fields (All Users):
```javascript
{
  role: Enum ['participant', 'organizer', 'admin'],  // RBAC
  isActive: Boolean,          // Soft delete functionality
  isApproved: Boolean,        // Admin approval workflow
  createdAt: Timestamp,       // Analytics
  updatedAt: Timestamp        // Track modifications
}
```

**Justifications**:
- `role`: Enables role-based access control across the system
- `isActive`: Allows soft deletion (deactivate instead of delete)
- `isApproved`: Future approval workflow for organizers
- `interests` & `followedClubs`: Personalization and event recommendations
- `discordWebhook`: Integration for automated event notifications
- Timestamps: System analytics and user activity tracking

---

## 📦 Installation & Setup

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

### 1. Clone Repository
```bash
git clone <repository-url>
cd 2024101006_DASS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# Admin credentials (for seed script)
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123456
```

Seed admin user:
```bash
node utils/seedAdmin.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 📚 Libraries & Dependencies

### Backend Dependencies

#### Core Framework
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **express** | 5.2.1 | Web framework | Industry standard for Node.js APIs. Fast, minimalist, and well-documented with extensive middleware ecosystem. |
| **mongoose** | 9.2.0 | MongoDB ODM | Provides schema validation, middleware hooks (pre-save for password hashing), and clean query interface. Simplifies MongoDB operations. |
| **dotenv** | 17.2.4 | Environment variables | Securely manages sensitive config (DB URLs, JWT secrets) without hardcoding. Essential for deployment. |

#### Security
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **bcryptjs** | 3.0.3 | Password hashing | One-way encryption for passwords using salt rounds. Pure JavaScript (no C++ dependencies), making deployment easier than native bcrypt. |
| **jsonwebtoken** | 9.0.3 | Authentication tokens | Generates stateless JWT tokens for secure, scalable authentication. No server-side session storage needed. |
| **cors** | 2.8.6 | Cross-origin requests | Enables frontend (localhost:3000) to communicate with backend (localhost:5000) during development. |

#### Validation & Utilities
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **express-validator** | 7.3.1 | Input validation | Sanitizes and validates user input on API endpoints. Prevents SQL injection, XSS attacks. |

#### Future Features (Installed, Not Yet Used)
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **nodemailer** | 8.0.1 | Email notifications | Will send registration confirmations, event reminders, password reset emails. |
| **qrcode** | 1.5.4 | QR code generation | Will generate unique QR codes for event check-ins. |
| **uuid** | 13.0.0 | Unique IDs | Generate unique identifiers for tickets, transactions. |
| **json2csv** | 6.0.0 | CSV export | Allows organizers to export participant lists as CSV for offline management. |
| **multer** | 2.0.2 | File uploads | Will handle event poster/banner uploads. |

---

### Frontend Dependencies

#### Core Framework
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **react** | 18.3.1 | UI library | Component-based architecture for building interactive interfaces. Virtual DOM for performance. |
| **react-dom** | 18.3.1 | React renderer | Connects React components to browser DOM. |
| **react-scripts** | 5.0.1 | Build tooling | Abstracts Webpack, Babel configs. Provides hot reload, production builds out-of-the-box. |

#### Routing & State Management
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **react-router-dom** | 7.1.3 | Client-side routing | Enables navigation between pages without full page reloads. Supports protected routes and role-based redirects. |
| **@reduxjs/toolkit** | 2.5.0 | State management | (Installed but using Context API instead) Provides global state management. Context API sufficient for our scale. |
| **react-redux** | 9.2.0 | React-Redux bindings | Connects Redux to React components. |

#### HTTP & API
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **axios** | 1.7.9 | HTTP client | Cleaner API than fetch(), automatic JSON parsing, request/response interceptors for adding JWT tokens globally. |

#### UI Components
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **@mui/material** | 6.3.0 | Component library | Pre-built, accessible, responsive components (buttons, cards, tables, dialogs). Saves development time and ensures consistent design. |
| **@mui/icons-material** | 6.3.0 | Icon library | 2000+ icons for intuitive UI (logout, edit, delete). Better than custom SVGs. |
| **@emotion/react** | 11.14.0 | CSS-in-JS | Required by MUI for styling components with JavaScript. |
| **@emotion/styled** | 11.14.0 | Styled components | MUI dependency for creating styled components. |

#### Forms & Validation
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **react-hook-form** | 7.54.2 | Form state management | Reduces re-renders, built-in validation, minimal boilerplate. Better performance than controlled components for large forms. |
| **yup** | 1.6.1 | Schema validation | Works with react-hook-form to define validation rules declaratively (e.g., "email must be valid", "password min 6 chars"). |

#### User Experience
| Library | Version | Purpose | Justification |
|---------|---------|---------|--------------|
| **react-hot-toast** | 2.4.1 | Notifications | Lightweight toast notifications for success/error messages. Better UX than browser alerts. |

---

## 🌐 API Endpoints

### Public Routes (No Authentication)
```
POST   /api/auth/register       - Register new participant
POST   /api/auth/login          - Login (all user types)
GET    /api/public/organizers   - List active organizers
```

### Protected Routes (Require JWT Token)
```
GET    /api/auth/me             - Get current user profile
POST   /api/auth/logout         - Logout user
PUT    /api/auth/profile        - Update user profile
PUT    /api/auth/change-password - Change password
```

### Admin Routes (Admin Role Required)
```
GET    /api/admin/stats                          - Dashboard statistics
POST   /api/admin/organizers                     - Create organizer
GET    /api/admin/organizers                     - List organizers
GET    /api/admin/organizers/:id                 - Get organizer details
PUT    /api/admin/organizers/:id                 - Update organizer
DELETE /api/admin/organizers/:id                 - Soft delete organizer
DELETE /api/admin/organizers/:id/permanent       - Hard delete organizer
POST   /api/admin/organizers/:id/reset-password  - Reset organizer password
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on `http://localhost:3000`

### Default Credentials

**Admin Login:**
- Email: `admin@felicity.com`
- Password: `Admin@123456`

---

## 📂 Project Structure

```
2024101006_DASS/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic (register, login, profile)
│   │   └── adminController.js   # Admin functions (CRUD organizers)
│   ├── middleware/
│   │   └── auth.js              # JWT verification, role authorization
│   ├── models/
│   │   └── User.js              # Unified user schema (all roles)
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── admin.js             # Admin endpoints
│   │   └── public.js            # Public endpoints
│   ├── utils/
│   │   └── seedAdmin.js         # Admin provisioning script
│   ├── .env                     # Environment variables
│   ├── server.js                # Express app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/          # Reusable UI components (future)
    │   ├── context/
    │   │   └── AuthContext.js   # Global auth state (Context API)
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Onboarding.js
    │   │   ├── ProfileEdit.js
    │   │   ├── AdminDashboard.js
    │   │   ├── ParticipantDashboard.js
    │   │   └── OrganizerDashboard.js
    │   ├── services/
    │   │   └── api.js           # Axios config, API functions
    │   ├── utils/
    │   │   └── PrivateRoute.js  # Protected route wrapper
    │   ├── App.js               # Router configuration
    │   └── index.js             # React entry point
    ├── package.json
    └── README.md

```

---

## 🎯 Development Approach

### Why MERN Stack?
- **Single Language**: JavaScript across frontend and backend reduces context switching
- **JSON Native**: MongoDB stores data in JSON format, React uses JavaScript objects - seamless data flow
- **Community & Resources**: Massive ecosystem, abundant tutorials, quick problem-solving
- **Scalability**: React's component reusability and MongoDB's horizontal scaling support growth

### Design Decisions

**1. Unified User Model**
- All user types (participant, organizer, admin) in one collection
- **Pros**: Simplified authentication, easier to add new roles
- **Cons**: Some fields unused per role (acceptable trade-off)

**2. Context API over Redux**
- Context API sufficient for our auth state needs
- **Pros**: Less boilerplate, built into React
- **Redux Toolkit installed**: Can migrate if state grows complex

**3. Material-UI Components**
- Pre-built accessible components save 40+ hours of custom CSS
- **Responsive out-of-the-box**: Works on mobile, tablet, desktop
- **Consistent Design**: Professional look without dedicated designer

**4. JWT Stateless Auth**
- No server-side session storage needed
- **Scalable**: Works across multiple server instances
- **Mobile-ready**: Same token can be used for mobile app later

---

## 📝 Notes

- **Email Domains**: System accepts `@iiit.ac.in`, `@students.iiit.ac.in`, `@research.iiit.ac.in` for IIIT students
- **Password Requirements**: Minimum 6 characters (expandable to complex rules)
- **Token Expiry**: 7 days (configurable in `.env`)
- **Soft Delete**: Deactivated users remain in database for audit trail

---

## 👨‍💻 Author

**Roll Number**: 2024101006  
**Course**: DASS Assignment  
**Date**: February 2026

---

## 📄 License

This project is part of an academic assignment.
2. **Organizer** (Clubs/Councils/Teams)
3. **Admin** (System administrator)

#### Participant Features (22 marks)
- ✅ Dashboard with upcoming events and participation history
- ✅ Browse events with search, filters, and trending
- ✅ Event registration with custom forms
- ✅ Merchandise purchases with stock management
- ✅ QR-coded tickets via email
- ✅ Profile management with preferences
- ✅ Follow/unfollow clubs

#### Organizer Features (18 marks)
- ✅ Event creation with custom registration forms
- ✅ Event analytics (registrations, revenue, attendance)
- ✅ Participant management with CSV export
- ✅ Dynamic form builder
- ✅ Discord webhook integration
- ✅ Profile management

#### Admin Features (6 marks)
- ✅ Club/Organizer account management
- ✅ Auto-generated credentials
- ✅ Account removal/archival

## 🚀 Advanced Features Implemented (30 Marks)

### Tier A Features Implemented:

#### 1. QR Scanner & Attendance Tracking [8 Marks]
**Selection Rationale:** Addresses a critical pain point in event management—manual attendance tracking is time-consuming and error-prone. QR-based validation provides instant verification, prevents duplicate entries, and generates real-time analytics for organizers to monitor event turnout.

**Technical Approach:** 
- Leverages browser's native MediaDevices API for camera access (no external SDK)
- Integrates with existing `qrcode` library for validation
- Uses `json2csv` for attendance report exports
- Implements optimistic UI updates for instant feedback

**Design Decision:** Chose browser-based scanning over mobile app to maintain web-first architecture, ensuring cross-platform compatibility without additional development overhead.

#### 2. Merchandise Payment Approval Workflow [8 Marks]
**Selection Rationale:** Directly addresses the gap between online merchandise ordering and offline payment verification—a common scenario in college fests. Prevents stock mismanagement and builds user trust through transparent status tracking.

**Technical Approach:**
- Uses `multer` for secure multipart file uploads
- Integrates `cloudinary` for scalable image storage and CDN delivery
- Implements state machine pattern (Pending → Approved/Rejected)
- Conditionally triggers QR generation and email notifications only on approval

**Design Decision:** Opted for admin-approval workflow over automated payment gateway integration to accommodate diverse payment methods (UPI, cash, bank transfer) common in Indian college fests.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (see [Environment Variables](#environment-variables))

4. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm start
```

## 📁 Project Structure

```
2024101006_DASS/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   ├── uploads/         # File uploads (if local)
│   ├── server.js        # Entry point
│   ├── .env             # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── redux/       # Redux store
│   │   ├── utils/       # Helper functions
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── README.md
└── deployment.txt
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎮 Running the Application

### Development Mode

**Backend**:
```bash
cd backend
npm run dev
```

**Frontend**:
```bash
cd frontend
npm start
```

### Production Build

**Backend**:
```bash
npm start
```

**Frontend**:
```bash
npm run build
```

## 🌐 Deployment

### Frontend
- Deployed on: [Vercel/Netlify]
- URL: [To be added in deployment.txt]

### Backend
- Deployed on: [Render/Railway/Heroku]
- URL: [To be added in deployment.txt]

### Database
- MongoDB Atlas (Free Tier)

## 📚 Libraries & Justifications

### Backend Dependencies

| Library | Version | Justification |
|---------|---------|---------------|
| **express** | ^5.2.1 | Robust web framework for building REST APIs with middleware support |
| **mongoose** | ^9.2.0 | Elegant MongoDB object modeling with schema validation and middleware |
| **bcryptjs** | ^3.0.3 | Secure password hashing with salt rounds for authentication |
| **jsonwebtoken** | ^9.0.3 | Stateless JWT authentication for secure API endpoints |
| **cors** | ^2.8.6 | Enable Cross-Origin Resource Sharing for frontend-backend communication |
| **express-validator** | ^7.3.1 | Middleware for validating and sanitizing user inputs |
| **nodemailer** | ^8.0.1 | Send emails for ticket delivery and notifications |
| **qrcode** | ^1.5.4 | Generate QR codes for event tickets |
| **multer** | ^2.0.2 | Handle multipart/form-data for file uploads |
| **uuid** | ^13.0.0 | Generate unique IDs for tickets and team codes |
| **json2csv** | ^6.0.0 | Export participant data to CSV format |
| **validator** | ^13.15.26 | Additional validation functions (email, URLs, etc.) |
| **date-fns** | ^4.1.0 | Modern date utility library for handling event dates |
| **cloudinary** | ^2.9.0 | Cloud storage for uploaded files (payment proofs, etc.) |

### Frontend Dependencies

| Library | Version | Justification |
|---------|---------|---------------|
| **react** | ^18.3.1 | Component-based UI library for building interactive interfaces |
| **react-router-dom** | ^7.1.3 | Client-side routing for SPA navigation |
| **@reduxjs/toolkit** | ^2.5.0 | Simplified Redux for global state management |
| **react-redux** | ^9.2.0 | React bindings for Redux |
| **axios** | ^1.7.9 | Promise-based HTTP client for API requests |
| **@mui/material** | ^6.3.0 | Comprehensive Material Design component library |
| **@emotion/react** | ^11.14.0 | CSS-in-JS library required by MUI |
| **@emotion/styled** | ^11.14.0 | Styled components for MUI |
| **@mui/icons-material** | ^6.3.0 | Material Design icons |
| **react-hook-form** | ^7.54.2 | Performant form handling with minimal re-renders |
| **yup** | ^1.6.1 | Schema validation for forms |
| **react-hot-toast** | ^2.4.1 | Lightweight toast notifications |
| **react-datepicker** | ^7.5.0 | Accessible date picker component |
| **dayjs** | ^1.11.13 | Lightweight date library (alternative to moment.js) |

### DevDependencies

| Library | Version | Justification |
|---------|---------|---------------|
| **nodemon** | ^3.1.11 | Auto-restart server on file changes during development |
| **dotenv** | ^17.2.4 | Load environment variables from .env file |

## 🔑 Default Credentials

### Admin Account
- **Email**: admin@felicity.com
- **Password**: Admin@123456

## 👥 User Roles & Access

### Participant
- Browse and register for events
- View participation history
- Follow clubs
- Manage profile

### Organizer
- Create and manage events
- View analytics
- Manage registrations
- Export data

### Admin
- Manage clubs/organizers
- View system-wide data
- Handle password resets

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Participant registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/:id` - Update event (Organizer)
- `DELETE /api/events/:id` - Delete event (Organizer)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/my` - Get user registrations

### Admin
- `POST /api/admin/organizers` - Create organizer
- `DELETE /api/admin/organizers/:id` - Remove organizer

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🐛 Known Issues

[List any known issues or limitations]

## 🔮 Future Enhancements

- Mobile app version
- Push notifications
- Advanced analytics dashboard
- Multi-language support

## 👨‍💻 Developer

**Roll Number**: 2024101006

## 📄 License

This project is developed as part of the DASS (Design & Analysis of Software Systems) course assignment.

---

**Note**: This project strictly follows academic integrity policies. No AI tools were used in development, and all code is original work.
