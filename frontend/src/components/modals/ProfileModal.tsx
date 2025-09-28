import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip
} from '@mui/material';
import {
  Person,
  Work,
  Settings as SettingsIcon,
  Close,
  PhotoCamera,
  CalendarToday
} from '@mui/icons-material';
import { databaseService } from '../../services/databaseService';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: {
    id: number;
    username: string;
    name: string;
    role: string;
    teamId?: number;
    teamName?: string;
  };
}

interface UserProfile {
  id: number;
  username: string;
  name: string;
  role: string;
  teamId?: number;
  teamName?: string;
  profilePicture?: string;
  defaultCalendarView?: string;
  isActive: boolean;
  createdAt: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, currentUser }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [defaultCalendarView, setDefaultCalendarView] = useState('weekly');
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  // Initialize user profile data from currentUser
  const initializeUserProfile = () => {
    // Use the data we already have from currentUser
    const profile: UserProfile = {
      id: currentUser.id || 0,
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
      teamId: currentUser.teamId,
      teamName: currentUser.teamName,
      profilePicture: undefined,
      defaultCalendarView: localStorage.getItem('defaultCalendarView') || 'weekly',
      isActive: true, // Assume active since they're logged in
      createdAt: new Date().toISOString() // Placeholder
    };

    setUserProfile(profile);
    setDefaultCalendarView(profile.defaultCalendarView || 'weekly');
    setLoading(false);
  };

  // Update calendar view preference
  const updateCalendarViewPreference = async (newView: string) => {
    setIsUpdatingPreferences(true);
    setError('');

    try {
      // Update localStorage for immediate effect
      localStorage.setItem('defaultCalendarView', newView);

      // Update in database only if we have a valid user ID
      if (currentUser.id) {
        await databaseService.updateUser({
          id: currentUser.id,
          defaultCalendarView: newView
        });
      }

      setDefaultCalendarView(newView);
      setSuccess('Calendar view preference updated successfully!');

      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update calendar view preference');
      console.error('Error updating preference:', err);
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  // Get role display
  const getRoleDisplay = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { label: 'Administrator', color: 'error' as const };
      case 'manager':
        return { label: 'Manager', color: 'warning' as const };
      case 'teammember':
        return { label: 'Team Member', color: 'primary' as const };
      default:
        return { label: role, color: 'default' as const };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (open) {
      initializeUserProfile();
    }
  }, [open]);

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  const roleInfo = getRoleDisplay(currentUser.role);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Profile
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography>Loading profile...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {userProfile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Profile Header */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        fontSize: '1.5rem',
                        bgcolor: 'primary.main'
                      }}
                      src={userProfile.profilePicture}
                    >
                      {getInitials(userProfile.name)}
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'background.paper' }
                      }}
                      disabled // Future: Enable when profile picture upload is implemented
                    >
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" gutterBottom>
                      {userProfile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      @{userProfile.username}
                    </Typography>
                    <Chip
                      label={roleInfo.label}
                      color={roleInfo.color}
                      size="small"
                      icon={<Work />}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person />
                  Basic Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography>{userProfile.name}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Username
                    </Typography>
                    <Typography>{userProfile.username}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Role
                    </Typography>
                    <Typography>{roleInfo.label}</Typography>
                  </Box>

                  {currentUser.teamName && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Team
                        </Typography>
                        <Typography>{currentUser.teamName}</Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography>{formatDate(userProfile.createdAt)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  Preferences
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Default Calendar View</InputLabel>
                    <Select
                      value={defaultCalendarView}
                      label="Default Calendar View"
                      onChange={(e) => updateCalendarViewPreference(e.target.value)}
                      disabled={isUpdatingPreferences}
                      startAdornment={<CalendarToday sx={{ mr: 1 }} />}
                    >
                      <MenuItem value="daily">Daily View</MenuItem>
                      <MenuItem value="weekly">Weekly View</MenuItem>
                      <MenuItem value="biweekly">Bi-weekly View</MenuItem>
                      <MenuItem value="monthly">Monthly View</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="caption" color="text.secondary">
                    This will be your default view when opening the calendar.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;