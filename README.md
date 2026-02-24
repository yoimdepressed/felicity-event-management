# Felicity Event Management System

A full-stack event management platform built for the Felicity fest at IIIT Hyderabad. The system replaces scattered Google Forms, spreadsheets, and WhatsApp groups with a single centralized platform that supports three user roles: Participants, Organizers (Clubs/Councils), and Admins.

Built with the MERN stack (MongoDB, Express.js, React, Node.js).

Roll Number: 2024101006

---

## Table of Contents

- [Overview](#overview)
- [Libraries, Frameworks, and Modules Used](#libraries-frameworks-and-modules-used)
- [Advanced Features Implemented](#advanced-features-implemented)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Default Credentials](#default-credentials)

---

## Overview

The platform provides the following core functionality:

- Participants can browse events, register with custom forms, purchase merchandise, receive QR-coded tickets, follow clubs, participate in discussion forums, and leave feedback.
- Organizers can create events with a dynamic form builder, manage registrations, track attendance via QR scanning, view analytics, export data to CSV, and receive Discord webhook notifications.
- Admins have full control over organizer accounts (create, archive, restore, permanently delete), can reset passwords, and have system-wide oversight.

---

## Libraries, Frameworks, and Modules Used

### Backend

| Library | Version | Purpose | Why This Library |
|---|---|---|---|
| express | 5.2.1 | Web framework and REST API routing | Express is the standard Node.js web framework. Version 5 brings native async error handling, which reduces boilerplate try-catch wrappers in route handlers. Its middleware architecture makes it straightforward to plug in authentication, CORS, and validation layers. |
| mongoose | 9.2.0 | MongoDB object data modeling | Mongoose provides schema enforcement on top of MongoDB's flexible documents. This is important because we have strict data shapes (User, Event, Registration, etc.) and need pre-save hooks (for password hashing), virtual fields, and instance methods (like updateStatusBasedOnDates on the Event model). |
| bcryptjs | 3.0.3 | Password hashing | Pure JavaScript implementation of bcrypt with no C++ compilation dependencies, which makes deployment to platforms like Render straightforward. Uses 10 salt rounds for a balance between security and performance. |
| jsonwebtoken | 9.0.3 | Stateless authentication tokens | JWT allows authentication without server-side session storage. The token contains the user ID and role, verified on every protected request. 7-day expiry avoids frequent re-logins while still expiring stale sessions. |
| cors | 2.8.6 | Cross-origin resource sharing | Required because frontend and backend run on different origins. Configured with an explicit allowlist of origins rather than a wildcard for security. |
| dotenv | 17.2.4 | Environment variable loading | Loads sensitive configuration (database URI, JWT secret) from a .env file, keeping secrets out of source code and allowing different values per environment. |
| express-validator | 7.3.1 | Request input validation | Provides middleware-based validation directly in route definitions for email formats, password lengths, and required fields before they reach the controller. |
| nodemailer | 8.0.1 | Email delivery | Sends registration confirmation emails with QR-coded tickets attached. Connects to Gmail SMTP with an app-specific password. Simpler than third-party email APIs for our volume. |
| qrcode | 1.5.4 | QR code image generation | Generates unique QR codes for each registration ticket, encoding the ticket ID that organizers scan for attendance. Outputs data URLs embedded directly in emails. |
| multer | 2.0.2 | Multipart file upload handling | Handles payment proof image uploads for merchandise events. Parses multipart/form-data and saves files to disk. |
| cloudinary | 2.9.0 | Cloud image storage | Available as an alternative to local file storage for payment proof images. Provides CDN delivery and automatic image optimization. |
| uuid | 13.0.0 | Unique identifier generation | Generates unique ticket IDs for registrations and team codes. UUIDs prevent enumeration attacks on ticket endpoints. |
| json2csv | 6.0.0 | CSV export from JSON data | Allows organizers to export participant lists as CSV files for offline management, a common request from fest organizers sharing data with non-technical team members. |
| axios | 1.13.5 | HTTP client for outgoing requests | Used for sending Discord webhook notifications. When an event is published, the backend POSTs an embed message to the configured Discord webhook URL. |
| validator | 13.15.26 | String validation utilities | Provides isEmail, isURL, isAlphanumeric for additional input validation beyond what express-validator covers. |
| date-fns | 4.1.0 | Date manipulation | Used for date arithmetic in controllers (deadlines, date ranges, formatting). Tree-shakeable and modular unlike moment.js. |
| moment | 2.30.1 | Date formatting for calendar exports | Used specifically for generating .ics calendar file timestamps where moment's format strings match the iCal spec directly. |
| nodemon | 3.1.11 (dev) | Auto-restart on file changes | Development-only. Watches for file changes and restarts the server automatically during development. |

### Frontend

| Library | Version | Purpose | Why This Library |
|---|---|---|---|
| react | 19.2.4 | UI component library | Component model is a natural fit for a dashboard-heavy application. Each page is a self-contained component with its own state. React 19 brings performance improvements and better concurrent rendering. |
| react-dom | 19.2.4 | DOM rendering | Standard renderer connecting React's virtual DOM to the browser. |
| react-router-dom | 7.13.0 | Client-side routing | Declarative routing for the SPA. Used for protected routes (PrivateRoute checks user role), nested routes, and URL parameter extraction. |
| react-scripts | 5.0.1 | Build toolchain (Webpack, Babel, ESLint) | Create React App's build toolchain. Abstracts away Webpack and Babel configuration. CI=false in build command treats warnings as non-fatal. |
| @mui/material | 7.3.7 | UI component library | Comprehensive pre-built, accessible components (DataGrid, Dialog, Tabs, Cards, Chips). For a project with many form-heavy pages and data tables, building these from scratch would have taken significantly longer. Theming system provides consistent visual language. |
| @mui/icons-material | 7.3.7 | Icon set | Over 2000 Material Design icons used for navigation, actions (Edit, Delete, Archive, Restore), and status indicators. |
| @emotion/react | 11.14.0 | CSS-in-JS engine | Required dependency for MUI v7. Handles runtime style injection for MUI components. |
| @emotion/styled | 11.14.1 | Styled component API | Required by MUI. Provides styled() API for custom styled components. |
| axios | 1.13.5 | HTTP client | Chosen over native fetch for automatic JSON parsing, request/response interceptors (JWT token attachment on every request, redirect to login on 401), and cleaner error handling. |
| react-datepicker | 9.1.0 | Date and time picker | Used in event creation and editing for selecting dates and times. Supports combined date-time selection, min/max date constraints, and filterDate prop to prevent past date selection. Simpler setup than MUI date pickers. |
| dayjs | 1.11.19 | Date formatting | Lightweight (2KB) date utility for formatting dates in the UI. Chosen over moment.js (70KB+) since we only need basic formatting. |
| jsqr | 1.4.0 | QR code reading from camera | Used in QR Scanner for attendance tracking. Processes video frames from device camera and extracts QR data client-side, avoiding server round-trips for detection. |
| react-beautiful-dnd | 13.1.1 | Drag and drop | Enables drag-and-drop reordering of custom registration form fields in the FormBuilder. While deprecated, it works correctly and has no direct replacement with equivalent simplicity. |
| react-hook-form | 7.71.1 | Form state management | Manages form state with minimal re-renders using uncontrolled components internally. Reduces boilerplate compared to manual useState for every field. |
| yup | 1.7.1 | Schema-based form validation | Integrates with react-hook-form for declarative validation schemas (email patterns, password length, conditional required fields). |
| react-hot-toast | 2.6.0 | Toast notifications | Non-intrusive success/error messages. Better UX than browser alert() for actions like event creation, registration, payment approval. |
| react-google-recaptcha | 3.1.0 | CAPTCHA verification | Available for registration form bot prevention. |
| @reduxjs/toolkit | 2.11.2 | State management | Installed but not actively used. React Context API (AuthContext) handles our authentication state needs without Redux overhead. Available if state complexity grows. |
| react-redux | 9.2.0 | React-Redux bindings | Companion to Redux Toolkit. Same situation -- installed but Context API is sufficient. |
| ajv | 8.17.1 | JSON schema validator | Explicit dependency to resolve a transitive dependency conflict between react-scripts, ajv-keywords, and schema-utils that caused build failures on Vercel. |
| web-vitals | 2.1.4 | Performance metrics | Default CRA inclusion. Reports Core Web Vitals for monitoring frontend performance. |

---

## Advanced Features Implemented

### Tier A Features

#### 1. QR Scanner and Attendance Tracking

Selection rationale: Manual attendance tracking at college fest events is slow and error-prone. Organizers typically use paper sign-in sheets or manually check names against a list, which does not scale when hundreds of participants enter an event. QR-based attendance reduces check-in to a single camera scan.

Implementation approach: The QR Scanner component uses the browser's MediaDevices API to access the device camera and the jsqr library to decode QR data from video frames in real time. When a participant registers, the backend generates a unique ticket ID (UUID) and creates a QR code encoding that ID using the qrcode library. This QR image is sent to the participant via email using nodemailer. At the event, the organizer opens the Attendance Dashboard, which activates the camera scanner. Each scan hits the backend attendance API, which validates the ticket, checks for duplicate scans, and records the attendance with a timestamp.

Design decisions: We chose browser-based camera scanning over a native mobile app to avoid requiring organizers to install anything. The jsqr library processes frames client-side, so there is no server round-trip for QR detection -- only for validation after detection. The attendance controller also supports manual override for cases where a participant's QR code is damaged or their phone is dead. An audit log tracks all scan events (successful, duplicate, manual override) for accountability.

Technical details:
- Frontend: QRScanner.js uses a requestAnimationFrame loop to continuously capture canvas frames and feed them to jsqr
- Backend: attendanceController.js validates ticket IDs against the Registration model, prevents duplicate scans, and maintains an audit trail
- Routes: /api/attendance/scan (POST), /api/attendance/manual (POST), /api/attendance/event/:eventId (GET), /api/attendance/event/:eventId/audit (GET)


#### 2. Merchandise Payment Approval Workflow

Selection rationale: College fest merchandise involves real money, and Indian college fests commonly accept payments through multiple channels (UPI, bank transfer, cash). An automated payment gateway would restrict payment methods and add complexity. A manual approval workflow where participants upload payment proof and organizers verify it matches how these transactions actually happen.

Implementation approach: When a participant registers for a merchandise event, they receive a "pending payment" status. They upload a screenshot of their payment (UPI receipt, bank transfer confirmation) through the PaymentApprovals component. The file is handled by multer on the backend, stored in the uploads directory, and served statically. The organizer sees pending payments in their event dashboard and can approve or reject each one with optional notes. On approval, the system generates a QR ticket and sends it via email. On rejection, the participant is notified and can re-upload.

Design decisions: We implemented a state machine for payment status (Pending -> Uploaded -> Approved/Rejected) to prevent race conditions. File uploads are stored locally with multer rather than requiring cloud storage setup, though cloudinary integration is available. The approval UI shows the uploaded proof image inline so organizers do not need to download files.

Technical details:
- Frontend: PaymentApprovals.js component with image preview, approve/reject buttons, and admin notes
- Backend: paymentController.js handles proof upload, approval, rejection, and triggers email plus QR generation on approval
- Routes: /api/payments/:registrationId/upload-proof (POST), /api/payments/event/:eventId/pending (GET), /api/payments/:registrationId/approve (PUT), /api/payments/:registrationId/reject (PUT)


### Tier B Features

#### 3. Real-Time Discussion Forum

Selection rationale: Participants frequently have questions about events (venue directions, what to bring, schedule changes) and organizers need a channel to post updates. Without a built-in discussion forum, this communication happens through fragmented WhatsApp groups. An integrated forum tied to each event keeps all communication in one place and accessible to all registered participants.

Implementation approach: Each event has its own discussion thread. Messages are stored in a Discussion model with references to the event and the author. The forum supports threaded replies (parentMessage field), emoji reactions (reactions array with emoji and user references), message pinning (for important organizer updates), and announcements (a special message type that auto-pins and sends in-app notifications to all registered participants). The frontend polls for new messages every 15 seconds.

Design decisions: We considered WebSocket-based real-time updates but chose polling instead for two reasons: (1) the deployment targets (Render free tier, Vercel) have limited WebSocket support, and (2) for an event discussion forum, 15-second update latency is acceptable. The polling uses a silent refresh that does not show loading spinners to avoid UI flicker. Announcements use a dedicated API endpoint that automatically pins the message and creates Notification documents for every registered participant, distinct from regular messages that just appear in the thread.

Technical details:
- Frontend: DiscussionForum.js with message list, reply threading, emoji picker (6 emoji options), pin/unpin, and announcement posting for organizers
- Backend: discussionController.js with getMessages (pagination), postMessage, postAnnouncement, deleteMessage, togglePin, toggleReaction
- Notification integration: postAnnouncement bulk-creates Notification documents for all registered participants
- Routes: /api/discussions/event/:eventId (GET, POST), /api/discussions/event/:eventId/announcement (POST), /api/discussions/:messageId (DELETE), /api/discussions/:messageId/pin (PUT), /api/discussions/:messageId/react (POST)


#### 4. Organizer Password Reset Workflow

Selection rationale: Organizers cannot self-reset their passwords since they have no self-registration flow. Without a structured reset process, a locked-out organizer would have to message the admin informally with no audit trail. A formal request-and-approval workflow gives both sides visibility into the status of the request and produces a record of every reset for accountability.

Implementation approach: An organizer submits a password reset request from their profile page, providing a reason. The request is stored in the PasswordResetRequest model with a status of Pending. The Admin sees all pending requests in the Password Reset Requests page, which shows the club name, request date, and reason. The admin can approve the request by entering a new password (which is immediately applied to the organizer account) or reject it with notes. The organizer can track their request status from their profile page. All requests regardless of outcome are retained in history for audit purposes.

Design decisions: The admin sets the new password rather than the system auto-generating one, which gives the admin control over what credentials are shared with the organizer. The PasswordResetRequest model stores the full history (Pending, Approved, Rejected) so past resets are always auditable. The organizer profile page shows current request status so the organizer does not need to contact the admin to check progress.

Technical details:
- Frontend: OrganizerProfile.js includes a request form with reason field and status display; PasswordResetRequests.js (admin page) lists all requests with tabs for Pending, Approved, Rejected, and approve/reject dialogs
- Backend: PasswordResetRequest model with organizer reference, reason, status, adminNotes, and timestamps
- Routes: /api/auth/request-password-reset (POST), /api/admin/password-resets (GET), /api/admin/password-resets/:id/approve (PUT), /api/admin/password-resets/:id/reject (PUT)


### Tier C Features

#### 5. Anonymous Feedback System

Selection rationale: After events end, organizers need structured feedback to measure how well an event was received and to identify areas for improvement. An anonymous feedback system encourages honest responses since participants do not fear social consequences from their organizer. Quantified star ratings also give organizers a quick aggregate metric rather than having to read every comment.

Implementation approach: After an event ends, participants who attended (attendance marked as true on their registration) can submit a 1-5 star rating and an optional text comment from the Event Details page. Anonymity is enforced at the API level: the organizer-facing endpoint returns feedback records with only the rating, comment, and submission timestamp -- the participant field is excluded from the query projection. Organizers see an aggregated view showing the average rating, total review count, a 5-star distribution breakdown, and the individual anonymous comments. A filter by star rating is available. Participants can edit their previously submitted feedback. The compound unique index on (event, participant) in the database ensures no participant can submit duplicate feedback for the same event.

Design decisions: Anonymity is implemented server-side (not just hidden in the UI), so the organizer cannot retrieve participant identity even by calling the API directly. The feedback form only appears for participants whose attended flag is true, which links the anonymous feedback system to the QR attendance tracking feature -- only people who actually showed up can leave a review. Organizers can filter feedback by rating to quickly identify patterns (e.g., all 1-star reviews) without reading everything.

Technical details:
- Frontend: FeedbackSection.js renders a participant submission form (star selector and comment) or the organizer aggregated view depending on the isOrganizer prop; displayed inside OrganizerEventDetail.js and EventDetails.js
- Backend: feedbackController.js submitFeedback verifies attendance before accepting, getEventFeedback excludes participant identity from the response projection
- Model: Feedback.js with compound unique index on event + participant; participant field is not selected in organizer queries
- Routes: /api/feedback/event/:eventId (GET for organizer aggregated view), /api/feedback/event/:eventId (POST for participant submission), /api/feedback/event/:eventId/my-feedback (GET for participant to check own submission)

---

## Setup and Installation

### Prerequisites

- Node.js version 18 or higher
- A MongoDB Atlas account (or local MongoDB instance)
- npm package manager
- A Gmail account with an app-specific password (for email notifications, optional)

### 1. Clone the Repository

```bash
git clone https://github.com/yoimdepressed/felicity-event-management.git
cd felicity-event-management
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/felicity
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# Email (for QR ticket delivery)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Admin seed credentials
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123456
```

Seed the admin account:

```bash
node utils/seedAdmin.js
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed because react-beautiful-dnd has not been updated for React 19 peer dependencies, but it works correctly at runtime.

Create a `.env` file in the `frontend/` directory:

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Running the Application

### Development Mode

Start the backend (terminal 1):

```bash
cd backend
node server.js
```

The backend runs on http://localhost:5000.

Start the frontend (terminal 2):

```bash
cd frontend
npm start
```

The frontend runs on http://localhost:3000.

### Production Build

```bash
cd frontend
npm run build
```

The build output goes to `frontend/build/` and can be served by any static file server.

---

## Deployment

### Frontend

Deployed on Vercel. The root directory is set to `frontend/` in the Vercel project settings.

Environment variable set in the Vercel dashboard:
- `REACT_APP_API_URL` = the deployed backend URL (for example, https://your-backend.onrender.com/api)

The `vercel.json` in the frontend directory configures SPA rewrites so all routes are handled by index.html, which is required for client-side routing with React Router.

### Backend

Deployed on Render (or Railway). The root directory is `backend/`.

Environment variables set in the hosting dashboard:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - secret key for signing JWTs
- `JWT_EXPIRE` - token expiration (7d)
- `FRONTEND_URL` - the deployed frontend URL (for CORS)
- `NODE_ENV` - production
- `EMAIL_USER` and `EMAIL_PASSWORD` - for nodemailer
- `PORT` - provided by the hosting platform

### Database

MongoDB Atlas (free tier). The connection string is stored as `MONGODB_URI` on the backend host. No additional database setup is needed beyond creating the Atlas cluster and adding the hosting platform's IP to the Atlas network access list (or allowing 0.0.0.0/0 for universal access).

### Deployment URLs

See `deployment.txt` in the project root for the live frontend and backend URLs.

---

## Project Structure

```
felicity-event-management/
|
+-- backend/
|   +-- config/
|   |   +-- database.js              # MongoDB connection setup
|   +-- controllers/
|   |   +-- adminController.js       # Organizer CRUD, password resets, stats
|   |   +-- attendanceController.js  # QR scan validation, manual override, audit log
|   |   +-- authController.js        # Register, login, profile, password change
|   |   +-- discussionController.js  # Forum messages, announcements, reactions, pins
|   |   +-- eventController.js       # Event CRUD, search, filters, form builder, lifecycle
|   |   +-- feedbackController.js    # Rating and comment submission
|   |   +-- notificationController.js# In-app notification management
|   |   +-- paymentController.js     # Payment proof upload, approve/reject
|   |   +-- registrationController.js# Event registration, ticket generation
|   +-- middleware/
|   |   +-- auth.js                  # JWT verification and role-based authorization
|   +-- models/
|   |   +-- Discussion.js            # Forum messages with threading, reactions, pins
|   |   +-- Event.js                 # Events with status machine, form builder, permissions
|   |   +-- Feedback.js              # Ratings and comments with unique constraint
|   |   +-- Notification.js          # In-app notifications
|   |   +-- PasswordResetRequest.js  # Organizer password reset tracking
|   |   +-- Registration.js          # Registrations with ticket ID, payment status
|   |   +-- User.js                  # Unified user model for all roles
|   +-- routes/
|   |   +-- admin.js, attendance.js, auth.js, calendar.js, discussion.js,
|   |   |   events.js, feedback.js, notifications.js, payment.js, public.js,
|   |   |   registrations.js
|   +-- utils/
|   |   +-- discordWebhook.js        # Discord webhook POST utility
|   |   +-- emailService.js          # Nodemailer email utility
|   |   +-- fuzzySearch.js           # Levenshtein-based fuzzy search
|   |   +-- seedAdmin.js             # Admin account seeding script
|   +-- uploads/payment-proofs/      # Uploaded payment screenshots
|   +-- server.js                    # Express entry point
|   +-- package.json
|
+-- frontend/
|   +-- public/index.html
|   +-- src/
|   |   +-- components/
|   |   |   +-- AddToCalendar.js     # Calendar export buttons
|   |   |   +-- DiscussionForum.js   # Threaded forum with reactions
|   |   |   +-- FeedbackSection.js   # Star rating and comments
|   |   |   +-- FormBuilder.js       # Custom registration form builder
|   |   |   +-- Navbar.js            # Navigation with notification bell
|   |   |   +-- PaymentApprovals.js  # Payment review interface
|   |   |   +-- QRScanner.js         # Camera QR code scanner
|   |   +-- context/
|   |   |   +-- AuthContext.js       # Authentication state (Context API)
|   |   +-- pages/
|   |   |   +-- AdminDashboard.js, AttendanceDashboard.js, BrowseEvents.js,
|   |   |   |   ClubsListing.js, CreateEvent.js, EditEvent.js, EventDetails.js,
|   |   |   |   Login.js, ManageOrganizers.js, MyEvents.js, Onboarding.js,
|   |   |   |   OrganizerDashboard.js, OrganizerDetailPage.js,
|   |   |   |   OrganizerEventDetail.js, OrganizerOngoingEvents.js,
|   |   |   |   OrganizerProfile.js, ParticipantDashboard.js,
|   |   |   |   ParticipantMyEvents.js, PasswordResetRequests.js,
|   |   |   |   ProfileEdit.js, ProfilePage.js, Register.js
|   |   +-- services/
|   |   |   +-- api.js               # Axios instance with all API endpoints
|   |   +-- utils/
|   |   |   +-- PrivateRoute.js      # Role-based route protection
|   |   +-- App.js                   # Route definitions
|   |   +-- index.js                 # React entry point
|   +-- package.json
|   +-- vercel.json                  # Vercel deployment config
|
+-- deployment.txt                   # Live frontend and backend URLs
+-- README.md
```

---

## API Endpoints

### Public (No Authentication)

```
POST   /api/auth/register                    Register a new participant
POST   /api/auth/login                       Login (any role)
GET    /api/public/organizers                 List active organizers/clubs
GET    /api/events                            Browse events with search and filters
GET    /api/events/trending                   Top 5 trending events (last 24 hours)
GET    /api/events/:id                        Single event details
GET    /api/events/:id/form                   Custom registration form for an event
GET    /api/calendar/event/:id/links          Calendar links for an event
GET    /api/calendar/event/:id/ics            Download .ics calendar file
```

### Authenticated (Any Role)

```
GET    /api/auth/me                           Current user profile
POST   /api/auth/logout                       Logout
PUT    /api/auth/profile                      Update profile
PUT    /api/auth/change-password              Change password
GET    /api/notifications                     Get notifications (paginated)
GET    /api/notifications/unread-count        Unread notification count
PUT    /api/notifications/:id/read            Mark notification as read
PUT    /api/notifications/read-all            Mark all as read
```

### Participant

```
POST   /api/registrations                     Register for an event
GET    /api/registrations/my                  My registrations
POST   /api/payments/:regId/upload-proof      Upload payment proof
POST   /api/discussions/event/:eventId        Post discussion message
POST   /api/discussions/:messageId/react      React to a message
POST   /api/feedback/event/:eventId           Submit feedback
GET    /api/feedback/event/:eventId/my-feedback  My feedback for an event
POST   /api/auth/request-password-reset       Request password reset
```

### Organizer

```
POST   /api/events                            Create event
GET    /api/events/my-events                  My events
PUT    /api/events/:id                        Update event
DELETE /api/events/:id                        Soft delete (draft only)
PATCH  /api/events/:id/toggle-registration    Open/close registration
PUT    /api/events/:id/publish                Publish draft
PUT    /api/events/:id/complete               Mark completed
PUT    /api/events/:id/close                  Close/cancel
GET    /api/events/:id/registrations          Event registrations
GET    /api/events/:id/permissions            Edit permissions
POST   /api/events/:id/form/field             Add form field
PUT    /api/events/:id/form/field/:idx        Update form field
DELETE /api/events/:id/form/field/:idx        Delete form field
PUT    /api/events/:id/form/reorder           Reorder fields
PUT    /api/events/:id/form                   Bulk update form
POST   /api/attendance/scan                   Scan QR for attendance
POST   /api/attendance/manual                 Manual attendance override
GET    /api/attendance/event/:eventId         Attendance list
GET    /api/attendance/event/:eventId/audit   Audit log
GET    /api/payments/event/:eventId/pending   Pending payments
PUT    /api/payments/:regId/approve           Approve payment
PUT    /api/payments/:regId/reject            Reject payment
POST   /api/discussions/event/:eventId/announcement  Post announcement
PUT    /api/discussions/:messageId/pin        Pin/unpin message
DELETE /api/discussions/:messageId            Delete message
GET    /api/feedback/event/:eventId           Event feedback
```

### Admin

```
GET    /api/admin/stats                       Dashboard statistics
POST   /api/admin/organizers                  Create organizer
GET    /api/admin/organizers                  List organizers
GET    /api/admin/organizers/:id              Organizer details
PUT    /api/admin/organizers/:id              Update (including archive/restore)
DELETE /api/admin/organizers/:id              Soft delete
DELETE /api/admin/organizers/:id/permanent    Permanently delete
POST   /api/admin/organizers/:id/reset-password  Reset password
GET    /api/admin/password-resets             Password reset requests
PUT    /api/admin/password-resets/:id/approve Approve reset
PUT    /api/admin/password-resets/:id/reject  Reject reset
GET    /api/admin/events                      All events (including inactive)
DELETE /api/admin/events/:id/permanent        Permanently delete event
```

---

## Default Credentials

### Admin Account

- Email: admin@felicity.com
- Password: Admin@123456

Created by running `node utils/seedAdmin.js` in the backend directory. Credentials can be changed via the ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running the seed script.

---

## User Roles and Access Control

### Participant
- Browse and search events with filters (type, eligibility, date range, followed clubs)
- Register for normal events and purchase merchandise
- Upload payment proofs for merchandise
- Receive QR-coded tickets via email
- View registration history and status
- Follow and unfollow clubs
- Participate in event discussion forums
- Submit feedback for completed events
- Receive in-app notifications
- Add events to calendar
- Edit profile and preferences

### Organizer
- Create events as drafts or publish directly
- Build custom registration forms with 10 field types (text, email, phone, number, textarea, date, dropdown, radio, checkbox, file)
- Manage event lifecycle (Draft, Published, Ongoing, Completed, Closed)
- View registrations and export to CSV
- Track attendance with QR scanner
- Approve or reject merchandise payments
- Post announcements in discussion forums
- Pin messages and moderate discussions
- Configure Discord webhook for automatic announcements
- View event analytics

### Admin
- Create organizer accounts with auto-generated credentials
- Archive (disable) and restore organizer accounts
- Permanently delete organizer accounts
- Reset organizer passwords
- Review password reset requests
- View system-wide statistics
- Manage all events including inactive ones
- Permanently delete events

---

Developer: 2024101006
Course: DASS (Design and Analysis of Software Systems)
