import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAPI, authAPI } from '../services/api';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const INTEREST_OPTIONS = [
  'Music',
  'Dance',
  'Drama',
  'Sports',
  'Coding',
  'Robotics',
  'Quiz',
  'Gaming',
  'Art',
  'Photography',
  'Literature',
  'Debate',
  'Film Making',
  'Entrepreneurship'
];

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setSelectedInterests(user.interests || []);
      setSelectedClubs(user.followedClubs?.map(club => club._id || club) || []);
    }
    fetchOrganizers();
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      const response = await publicAPI.getOrganizers();
      setOrganizers(response.data.organizers);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
    }
  };

  const handleInterestToggle = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleClubToggle = (clubId) => {
    if (selectedClubs.includes(clubId)) {
      setSelectedClubs(selectedClubs.filter(id => id !== clubId));
    } else {
      setSelectedClubs([...selectedClubs, clubId]);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.updateProfile({
        interests: selectedInterests,
        followedClubs: selectedClubs
      });
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/participant');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/participant')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          Edit Your Preferences
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Interests
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select topics you're interested in
          </Typography>

          <Grid container spacing={1}>
            {INTEREST_OPTIONS.map((interest) => (
              <Grid item xs={6} sm={4} md={3} key={interest}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedInterests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                    />
                  }
                  label={interest}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Following Clubs/Organizers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Stay updated about their events
          </Typography>

          {organizers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No organizers available at the moment.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {organizers.map((org) => (
                <Grid item xs={12} sm={6} key={org._id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedClubs.includes(org._id)}
                        onChange={() => handleClubToggle(org._id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">
                          {org.organizerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {org.category}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/participant')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </Box>
    </Container>
  );
};

export default ProfileEdit;
