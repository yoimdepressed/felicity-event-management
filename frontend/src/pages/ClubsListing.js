import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ClubsListing = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // State
  const [organizers, setOrganizers] = useState([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedClubs, setFollowedClubs] = useState([]);

  // Fetch organizers
  useEffect(() => {
    fetchOrganizers();
    if (user?.followedClubs) {
      console.log('📌 User followedClubs:', user.followedClubs);
      // Handle both array of IDs and array of objects (populated)
      const clubIds = user.followedClubs.map(club => 
        typeof club === 'string' ? club : club._id
      );
      console.log('📌 Setting followedClubs to:', clubIds);
      setFollowedClubs(clubIds);
    }
  }, [user]);

  // Filter organizers based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = organizers.filter(org =>
        org.organizerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrganizers(filtered);
    } else {
      setFilteredOrganizers(organizers);
    }
  }, [searchQuery, organizers]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/public/organizers');
      
      // Use the organizers from response
      const organizersData = response.data.organizers || [];
      
      setOrganizers(organizersData);
      setFilteredOrganizers(organizersData);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError('Failed to load clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if following
  const isFollowing = (organizerId) => {
    return followedClubs.includes(organizerId);
  };

  // Handle follow/unfollow
  const handleToggleFollow = async (organizerId) => {
    try {
      const isCurrentlyFollowing = isFollowing(organizerId);
      let updatedFollowedClubs;

      if (isCurrentlyFollowing) {
        // Unfollow
        updatedFollowedClubs = followedClubs.filter(id => id !== organizerId);
      } else {
        // Follow
        updatedFollowedClubs = [...followedClubs, organizerId];
      }

      // Update backend
      await api.put('/auth/profile', {
        followedClubs: updatedFollowedClubs,
      });

      // Update local state
      setFollowedClubs(updatedFollowedClubs);

      // Update auth context
      if (updateUser) {
        updateUser({ ...user, followedClubs: updatedFollowedClubs });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update. Please try again.');
    }
  };

  // Navigate to organizer detail
  const handleViewDetails = (organizerId) => {
    navigate(`/participant/club/${organizerId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/participant')}
          variant="outlined"
        >
          Back to Home
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            Clubs & Organizers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and follow clubs to stay updated with their events
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search clubs by name, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Organizers Grid */}
      {filteredOrganizers.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clubs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Try adjusting your search query' : 'No organizers available at the moment'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredOrganizers.map((organizer) => (
            <Grid item xs={12} sm={6} md={4} key={organizer._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Category Badge */}
                  {organizer.category && (
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        icon={<CategoryIcon />}
                        label={organizer.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}

                  {/* Organizer Name */}
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {organizer.organizerName}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '60px',
                    }}
                  >
                    {organizer.description || 'No description available'}
                  </Typography>

                  {/* Following Status */}
                  {isFollowing(organizer._id) && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        icon={<FavoriteIcon />}
                        label="Following"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleViewDetails(organizer._id)}
                  >
                    View Details
                  </Button>
                  <Button
                    fullWidth
                    variant={isFollowing(organizer._id) ? 'outlined' : 'contained'}
                    color={isFollowing(organizer._id) ? 'error' : 'primary'}
                    startIcon={
                      isFollowing(organizer._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />
                    }
                    onClick={() => handleToggleFollow(organizer._id)}
                  >
                    {isFollowing(organizer._id) ? 'Unfollow' : 'Follow'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ClubsListing;
