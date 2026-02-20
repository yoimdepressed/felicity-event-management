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

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrganizers();
  }, []);

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

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await authAPI.updateProfile({
        interests: selectedInterests,
        followedClubs: selectedClubs
      });
      await refreshUser();
      navigate('/participant');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/participant');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome to Felicity, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Let's personalize your experience
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1: Select Your Interests
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose as many as you like. We'll recommend events based on your interests.
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
            Step 2: Follow Clubs/Organizers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get notified about their events and updates
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

      <Box display="flex" justifyContent="space-between" gap={2}>
        <Button
          variant="outlined"
          size="large"
          onClick={handleSkip}
          disabled={loading}
        >
          Skip for Now
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </Box>
    </Container>
  );
};

export default Onboarding;
