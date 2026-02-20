import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const INTEREST_OPTIONS = [
  'Technology',
  'Sports',
  'Music',
  'Dance',
  'Art',
  'Photography',
  'Coding',
  'Gaming',
  'Drama',
  'Literature',
  'Entrepreneurship',
  'Social Service',
  'Debate',
  'Quiz',
  'Fashion',
  'Culinary',
];

const ProfilePage = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    college: '',
    interests: [],
    followedClubs: [],
  });

  // Non-editable data
  const [userData, setUserData] = useState({
    email: '',
    participantType: '',
  });

  // Password change state
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Clubs/Organizers list
  const [allOrganizers, setAllOrganizers] = useState([]);

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
    fetchOrganizers();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      const user = response.data.user;

      // Extract club IDs - handle both populated objects and plain IDs
      const clubIds = (user.followedClubs || []).map(club =>
        typeof club === 'string' ? club : club._id
      );

      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        college: user.college || '',
        interests: user.interests || [],
        followedClubs: clubIds, // Always use IDs only
      });

      setUserData({
        email: user.email,
        participantType: user.participantType || 'Non-IIIT',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const response = await api.get('/public/organizers');
      setAllOrganizers(response.data.organizers || []);
    } catch (err) {
      console.error('Error fetching organizers:', err);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.put('/auth/profile', profileData);

      // Refresh user data from backend to get populated followedClubs
      if (refreshUser) {
        await refreshUser();
      }

      setSuccess('Profile updated successfully!');
      setEditMode(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setPasswordError('');
      setPasswordSuccess('');

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('All fields are required');
        setChangingPassword(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters');
        setChangingPassword(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        setChangingPassword(false);
        return;
      }

      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess('Password changed successfully!');

      setTimeout(() => {
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle interest change
  const handleInterestChange = (event, newValue) => {
    setProfileData({ ...profileData, interests: newValue });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/participant')}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Home
      </Button>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information and settings
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Profile Information */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Profile Information
          </Typography>
          {!editMode ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setEditMode(false);
                  fetchProfile(); // Reset to original values
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* First Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              disabled={!editMode}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>

          {/* Last Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              disabled={!editMode}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>

          {/* Email (Non-editable) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              value={userData.email}
              disabled
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              helperText="Email address cannot be changed"
            />
          </Grid>

          {/* Participant Type (Non-editable) */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Participant Type
              </Typography>
              <Chip
                icon={<VerifiedIcon />}
                label={userData.participantType}
                color={userData.participantType === 'IIIT' ? 'primary' : 'default'}
                sx={{ mt: 0.5 }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                Participant type cannot be changed
              </Typography>
            </Box>
          </Grid>

          {/* Contact Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              value={profileData.contactNumber}
              onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
              disabled={!editMode}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>

          {/* College/Organization */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="College / Organization Name"
              value={profileData.college}
              onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
              disabled={!editMode}
              InputProps={{
                startAdornment: <SchoolIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>

          {/* Interests */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={INTEREST_OPTIONS}
              value={profileData.interests}
              onChange={handleInterestChange}
              disabled={!editMode}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Interests"
                  placeholder={editMode ? "Select interests" : ""}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <CategoryIcon sx={{ mr: 1, color: 'action.active' }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    disabled={!editMode}
                  />
                ))
              }
            />
          </Grid>

          {/* Followed Clubs */}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Followed Clubs
            </Typography>

            {editMode ? (
              <>
                {/* Search/Add Clubs in Edit Mode */}
                <Autocomplete
                  multiple
                  fullWidth
                  options={allOrganizers}
                  getOptionLabel={(option) => option.organizerName || 'Unknown'}
                  value={allOrganizers.filter(org => profileData.followedClubs.includes(org._id))}
                  onChange={(e, newValue) => {
                    setProfileData({
                      ...profileData,
                      followedClubs: newValue.map(org => org._id)
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and select clubs"
                      placeholder="Type to search clubs..."
                      helperText="Search for clubs by name and click to add/remove"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.organizerName}
                        {...getTagProps({ index })}
                        color="secondary"
                        onDelete={() => {
                          setProfileData({
                            ...profileData,
                            followedClubs: profileData.followedClubs.filter(id => id !== option._id)
                          });
                        }}
                      />
                    ))
                  }
                  sx={{ mb: 2 }}
                />
              </>
            ) : (
              // View Mode - Show as chips
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {profileData.followedClubs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No clubs followed yet
                  </Typography>
                ) : (
                  profileData.followedClubs.map((clubId) => {
                    const club = allOrganizers.find(o => o._id === clubId);
                    return (
                      <Chip
                        key={clubId}
                        label={club?.organizerName || 'Loading...'}
                        color="secondary"
                        variant="outlined"
                      />
                    );
                  })
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Security Settings */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your password and security preferences
            </Typography>
          </Box>
          <LockIcon color="action" sx={{ fontSize: 40 }} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body1" gutterBottom>
            Password
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Change your password to keep your account secure
          </Typography>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => setPasswordDialog(true)}
            sx={{ mt: 1 }}
          >
            Change Password
          </Button>
        </Box>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => !changingPassword && setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>
              {passwordError}
            </Alert>
          )}
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
            sx={{ mb: 2, mt: 1 }}
            disabled={changingPassword}
          />

          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            helperText="Minimum 6 characters"
            sx={{ mb: 2 }}
            disabled={changingPassword}
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
            disabled={changingPassword}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPasswordDialog(false);
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setPasswordError('');
            }}
            disabled={changingPassword}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={changingPassword}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
