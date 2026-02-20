import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link as MuiLink,
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    college: '',
    contactNumber: '',
    participantType: 'IIIT',
    interests: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.participantType === 'IIIT') {
      const isIIITEmail = formData.email.endsWith('@iiit.ac.in') ||
        formData.email.endsWith('@students.iiit.ac.in') ||
        formData.email.endsWith('@research.iiit.ac.in');

      if (!isIIITEmail) {
        setError('IIIT students must use college email (@iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)');
        setLoading(false);
        return;
      }
    }

    const submitData = {
      ...formData,
      college: formData.participantType === 'IIIT' ? 'IIIT Hyderabad' : formData.college,
    };

    try {
      await register(submitData);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Participant Registration
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} autoComplete="off">
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                margin="normal"
                autoComplete="off"
              />

              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                margin="normal"
                autoComplete="off"
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
                autoComplete="off"
                helperText={
                  formData.participantType === 'IIIT'
                    ? 'Use your college email (@iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)'
                    : 'Use your email address'
                }
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                margin="normal"
                autoComplete="new-password"
                helperText="Minimum 6 characters"
              />

              {formData.participantType === 'Non-IIIT' && (
                <TextField
                  fullWidth
                  label="College"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              )}

              <TextField
                fullWidth
                label="Contact Number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                margin="normal"
              />

              <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
                <FormLabel component="legend">Participant Type</FormLabel>
                <RadioGroup
                  name="participantType"
                  value={formData.participantType}
                  onChange={handleChange}
                  row
                >
                  <FormControlLabel value="IIIT" control={<Radio />} label="IIIT Student" />
                  <FormControlLabel value="Non-IIIT" control={<Radio />} label="Non-IIIT" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                label="Interests (Optional)"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={2}
                helperText="e.g., Music, Sports, Coding"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <MuiLink component={Link} to="/login" underline="hover">
                    Login
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
