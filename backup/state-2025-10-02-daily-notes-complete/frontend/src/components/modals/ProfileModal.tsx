import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
  PhotoCamera,
  CalendarToday
} from '@mui/icons-material';
import { databaseService } from '../../services/databaseService';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';

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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
        }
      }}
    >
      <ModalHeader
        title="Profile"
        onClose={handleClose}
        variant="primary"
      />

      <DialogContent sx={{
        backgroundColor: 'var(--dp-neutral-50)',
        padding: 'var(--dp-space-6)',
      }}>
        {loading && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            gap: 'var(--dp-space-4)'
          }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                border: '3px solid var(--dp-neutral-200)',
                borderTop: '3px solid var(--dp-primary-500)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <Typography sx={{
              color: 'var(--dp-neutral-600)',
              fontFamily: 'var(--dp-font-family-primary)'
            }}>Loading profile...</Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            {success}
          </Alert>
        )}

        {userProfile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Profile Header */}
            <Card sx={{
              border: '1px solid var(--dp-neutral-200)',
              borderRadius: 'var(--dp-radius-lg)',
              boxShadow: 'var(--dp-shadow-sm)',
              backgroundColor: 'var(--dp-neutral-0) !important',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                boxShadow: 'var(--dp-shadow-md)',
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent sx={{ padding: 'var(--dp-space-4) !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        fontSize: '1.25rem',
                        bgcolor: 'var(--dp-primary-500)'
                      }}
                      src={userProfile.profilePicture}
                    >
                      {getInitials(userProfile.name)}
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: 'var(--dp-neutral-0)',
                        boxShadow: 'var(--dp-shadow-sm)',
                        width: 24,
                        height: 24,
                        '&:hover': { bgcolor: 'var(--dp-neutral-100)' }
                      }}
                      disabled // Future: Enable when profile picture upload is implemented
                    >
                      <PhotoCamera sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-800)',
                      marginBottom: 'var(--dp-space-1)',
                      fontSize: 'var(--dp-text-title-medium)'
                    }}>
                      {userProfile.name}
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      marginBottom: 'var(--dp-space-2)'
                    }}>
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
            <Card sx={{
              border: '1px solid var(--dp-neutral-200)',
              borderRadius: 'var(--dp-radius-lg)',
              boxShadow: 'var(--dp-shadow-sm)',
              backgroundColor: 'var(--dp-neutral-0) !important',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                boxShadow: 'var(--dp-shadow-md)',
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontWeight: 'var(--dp-font-weight-bold)',
                  color: 'var(--dp-neutral-800)'
                }}>
                  <Person sx={{ color: 'var(--dp-primary-500)' }} />
                  Basic Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Full Name
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)'
                    }}>{userProfile.name}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Username
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)'
                    }}>{userProfile.username}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Role
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)'
                    }}>{roleInfo.label}</Typography>
                  </Box>

                  {currentUser.teamName && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" sx={{
                          color: 'var(--dp-neutral-600)',
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontWeight: 'var(--dp-font-weight-medium)'
                        }}>
                          Team
                        </Typography>
                        <Typography sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          color: 'var(--dp-neutral-800)'
                        }}>{currentUser.teamName}</Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card sx={{
              border: '1px solid var(--dp-neutral-200)',
              borderRadius: 'var(--dp-radius-lg)',
              boxShadow: 'var(--dp-shadow-sm)',
              backgroundColor: 'var(--dp-neutral-0) !important',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                boxShadow: 'var(--dp-shadow-md)',
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontWeight: 'var(--dp-font-weight-bold)',
                  color: 'var(--dp-neutral-800)'
                }}>
                  <SettingsIcon sx={{ color: 'var(--dp-primary-500)' }} />
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

                  <Typography variant="caption" sx={{
                    color: 'var(--dp-neutral-600)',
                    fontFamily: 'var(--dp-font-family-primary)'
                  }}>
                    This will be your default view when opening the calendar.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      {/* Footer removed - close button is in header */}
    </Dialog>
  );
};

export default ProfileModal;