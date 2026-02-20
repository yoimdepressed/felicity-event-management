import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ProfileEdit from './pages/ProfileEdit';
import AdminDashboard from './pages/AdminDashboard';
import ManageOrganizers from './pages/ManageOrganizers';
import PasswordResetRequests from './pages/PasswordResetRequests';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import MyEvents from './pages/MyEvents';
import OrganizerOngoingEvents from './pages/OrganizerOngoingEvents';
import OrganizerProfile from './pages/OrganizerProfile';
import OrganizerEventDetail from './pages/OrganizerEventDetail';
import ParticipantMyEvents from './pages/ParticipantMyEvents';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import ProfilePage from './pages/ProfilePage';
import ClubsListing from './pages/ClubsListing';
import OrganizerDetailPage from './pages/OrganizerDetailPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/onboarding"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <Onboarding />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ProfileEdit />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/organizers"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <ManageOrganizers />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/password-resets"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <PasswordResetRequests />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ParticipantDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/my-events"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ParticipantMyEvents />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/browse-events"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <BrowseEvents />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/event/:id"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <EventDetails />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/profile"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/clubs"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ClubsListing />
              </PrivateRoute>
            }
          />

          <Route
            path="/participant/club/:id"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <OrganizerDetailPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/create-event"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/event/:id/edit"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <EditEvent />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/my-events"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <MyEvents />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/ongoing-events"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerOngoingEvents />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/profile"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/organizer/event/:id"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerEventDetail />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
