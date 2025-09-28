import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security,
  Palette,
  Info,
  Close,
  LightMode,
  DarkMode
} from '@mui/icons-material';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: {
    id: number;
    username: string;
    name: string;
  };
}

interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, currentUser }) => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [themeMessage, setThemeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState('security');

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, text: '', color: 'transparent' };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const maxScore = 6;
    const percentage = (score / maxScore) * 100;

    if (percentage < 30) return { score: percentage, text: 'Weak', color: '#f44336' };
    if (percentage < 70) return { score: percentage, text: 'Medium', color: '#ff9800' };
    return { score: percentage, text: 'Strong', color: '#4caf50' };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // Theme switching function
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);

    // Force update CSS custom properties
    if (newTheme === 'light') {
      document.documentElement.style.setProperty('--dp-neutral-0', '#ffffff');
      document.documentElement.style.setProperty('--dp-neutral-50', '#f8fafc');
      document.documentElement.style.setProperty('--dp-neutral-100', '#f1f5f9');
      document.documentElement.style.setProperty('--dp-neutral-200', '#e2e8f0');
      document.documentElement.style.setProperty('--dp-neutral-800', '#1e293b');
    } else {
      document.documentElement.style.setProperty('--dp-neutral-0', '#0f172a');
      document.documentElement.style.setProperty('--dp-neutral-50', '#1e293b');
      document.documentElement.style.setProperty('--dp-neutral-100', '#334155');
      document.documentElement.style.setProperty('--dp-neutral-200', '#475569');
      document.documentElement.style.setProperty('--dp-neutral-800', '#f8fafc');
    }

    setThemeMessage({ type: 'success', text: `Theme changed to ${newTheme} mode` });
    setTimeout(() => setThemeMessage(null), 3000);
  };

  // Password validation
  const validatePassword = () => {
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return false;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return false;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }

    return true;
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!validatePassword()) return;

    setIsChangingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword
        })
      });

      if (response.ok) {
        setPasswordSuccess('Password changed successfully! You will be logged out in 3 seconds...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Auto logout after 3 seconds
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 3000);
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClose = () => {
    // Clear form state
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setActiveTab('security');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0) !important',
          borderRadius: 'var(--dp-radius-lg)',
          boxShadow: 'var(--dp-shadow-lg)',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--dp-primary-600)',
        color: 'var(--dp-neutral-0)',
        fontFamily: 'var(--dp-font-family-primary)',
        fontWeight: 'var(--dp-font-weight-bold)',
        fontSize: 'var(--dp-text-headline-medium)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }}>
        Settings
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: 'var(--dp-neutral-0)',
            transition: 'var(--dp-transition-fast)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        backgroundColor: 'var(--dp-neutral-25) !important',
        fontFamily: 'var(--dp-font-family-primary)',
      }}>
        {/* Tab Navigation */}
        <Box sx={{
          borderBottom: '2px solid var(--dp-neutral-200)',
          mb: 3,
          backgroundColor: 'var(--dp-neutral-50)',
          borderRadius: 'var(--dp-radius-md)',
          p: 1
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={activeTab === 'security' ? 'contained' : 'text'}
              startIcon={<Security />}
              onClick={() => setActiveTab('security')}
              size="small"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-medium)',
                backgroundColor: activeTab === 'security' ? 'var(--dp-primary-500)' : 'transparent',
                color: activeTab === 'security' ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-600)',
                borderRadius: 'var(--dp-radius-md)',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  backgroundColor: activeTab === 'security' ? 'var(--dp-primary-600)' : 'var(--dp-neutral-100)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Security
            </Button>
            <Button
              variant={activeTab === 'appearance' ? 'contained' : 'text'}
              startIcon={<Palette />}
              onClick={() => setActiveTab('appearance')}
              size="small"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-medium)',
                backgroundColor: activeTab === 'appearance' ? 'var(--dp-primary-500)' : 'transparent',
                color: activeTab === 'appearance' ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-600)',
                borderRadius: 'var(--dp-radius-md)',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  backgroundColor: activeTab === 'appearance' ? 'var(--dp-primary-600)' : 'var(--dp-neutral-100)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Appearance
            </Button>
            <Button
              variant={activeTab === 'about' ? 'contained' : 'text'}
              startIcon={<Info />}
              onClick={() => setActiveTab('about')}
              size="small"
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-medium)',
                backgroundColor: activeTab === 'about' ? 'var(--dp-primary-500)' : 'transparent',
                color: activeTab === 'about' ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-600)',
                borderRadius: 'var(--dp-radius-md)',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  backgroundColor: activeTab === 'about' ? 'var(--dp-primary-600)' : 'var(--dp-neutral-100)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              About
            </Button>
          </Box>
        </Box>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Box sx={{
            backgroundColor: 'var(--dp-neutral-0)',
            borderRadius: 'var(--dp-radius-lg)',
            border: '1px solid var(--dp-neutral-200)',
            boxShadow: 'var(--dp-shadow-sm)',
            p: 3,
            transition: 'var(--dp-transition-fast)',
            '&:hover': {
              boxShadow: 'var(--dp-shadow-md)',
              transform: 'translateY(-2px)',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-bold)',
              color: 'var(--dp-neutral-800)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Security sx={{ color: 'var(--dp-primary-500)' }} />
              Change Password
            </Typography>
            <Typography variant="body2" sx={{
              mb: 3,
              color: 'var(--dp-neutral-600)',
              fontFamily: 'var(--dp-font-family-primary)'
            }}>
              Update your password to keep your account secure.
            </Typography>

            {passwordError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  fontFamily: 'var(--dp-font-family-primary)',
                  borderRadius: 'var(--dp-radius-md)',
                  boxShadow: 'var(--dp-shadow-sm)',
                }}
              >
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  fontFamily: 'var(--dp-font-family-primary)',
                  borderRadius: 'var(--dp-radius-md)',
                  boxShadow: 'var(--dp-shadow-sm)',
                }}
              >
                {passwordSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Current Password */}
              <TextField
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    borderRadius: 'var(--dp-radius-md)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 'var(--dp-shadow-sm)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      sx={{
                        transition: 'var(--dp-transition-fast)',
                        '&:hover': {
                          backgroundColor: 'var(--dp-neutral-100)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />

              {/* New Password */}
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    borderRadius: 'var(--dp-radius-md)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 'var(--dp-shadow-sm)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      sx={{
                        transition: 'var(--dp-transition-fast)',
                        '&:hover': {
                          backgroundColor: 'var(--dp-neutral-100)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Password Strength</Typography>
                    <Typography variant="caption" sx={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.score}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.color
                      }
                    }}
                  />
                </Box>
              )}

              {/* Confirm Password */}
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    borderRadius: 'var(--dp-radius-md)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 'var(--dp-shadow-sm)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        transition: 'var(--dp-transition-fast)',
                        '&:hover': {
                          backgroundColor: 'var(--dp-neutral-100)',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />

              <Button
                variant="contained"
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                sx={{
                  mt: 2,
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--dp-primary-500)',
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontWeight: 'var(--dp-font-weight-medium)',
                  borderRadius: 'var(--dp-radius-md)',
                  transition: 'var(--dp-transition-fast)',
                  boxShadow: 'var(--dp-shadow-sm)',
                  '&:hover': {
                    backgroundColor: 'var(--dp-primary-600)',
                    boxShadow: 'var(--dp-shadow-md)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--dp-neutral-300)',
                  }
                }}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <Box sx={{
            backgroundColor: 'var(--dp-neutral-0)',
            borderRadius: 'var(--dp-radius-lg)',
            border: '1px solid var(--dp-neutral-200)',
            boxShadow: 'var(--dp-shadow-sm)',
            p: 3,
            transition: 'var(--dp-transition-fast)',
            '&:hover': {
              boxShadow: 'var(--dp-shadow-md)',
              transform: 'translateY(-2px)',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-bold)',
              color: 'var(--dp-neutral-800)'
            }}>
              <Palette sx={{ color: 'var(--dp-primary-500)' }} />
              Theme Settings
            </Typography>

            {themeMessage && (
              <Alert
                severity={themeMessage.type}
                sx={{
                  mb: 2,
                  fontFamily: 'var(--dp-font-family-primary)',
                  borderRadius: 'var(--dp-radius-md)',
                  boxShadow: 'var(--dp-shadow-sm)',
                }}
              >
                {themeMessage.text}
              </Alert>
            )}

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              p: 3,
              border: '1px solid var(--dp-neutral-200)',
              borderRadius: 'var(--dp-radius-lg)',
              backgroundColor: 'var(--dp-neutral-25)',
              boxShadow: 'var(--dp-shadow-sm)',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                boxShadow: 'var(--dp-shadow-md)',
              }
            }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 'var(--dp-font-weight-bold)',
                fontFamily: 'var(--dp-font-family-primary)',
                color: 'var(--dp-neutral-800)'
              }}>
                Select Theme
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={theme === 'light' ? 'contained' : 'outlined'}
                  startIcon={<LightMode />}
                  onClick={() => handleThemeChange('light')}
                  sx={{
                    flex: 1,
                    py: 2.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                    borderRadius: 'var(--dp-radius-lg)',
                    backgroundColor: theme === 'light' ? 'var(--dp-primary-500)' : 'transparent',
                    borderColor: 'var(--dp-primary-500)',
                    color: theme === 'light' ? 'var(--dp-neutral-0)' : 'var(--dp-primary-500)',
                    transition: 'var(--dp-transition-fast)',
                    boxShadow: theme === 'light' ? 'var(--dp-shadow-md)' : 'none',
                    '&:hover': {
                      backgroundColor: theme === 'light' ? 'var(--dp-primary-600)' : 'var(--dp-primary-50)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--dp-shadow-lg)',
                    }
                  }}
                >
                  Light Mode
                </Button>

                <Button
                  variant={theme === 'dark' ? 'contained' : 'outlined'}
                  startIcon={<DarkMode />}
                  onClick={() => handleThemeChange('dark')}
                  sx={{
                    flex: 1,
                    py: 2.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                    borderRadius: 'var(--dp-radius-lg)',
                    backgroundColor: theme === 'dark' ? 'var(--dp-primary-500)' : 'transparent',
                    borderColor: 'var(--dp-primary-500)',
                    color: theme === 'dark' ? 'var(--dp-neutral-0)' : 'var(--dp-primary-500)',
                    transition: 'var(--dp-transition-fast)',
                    boxShadow: theme === 'dark' ? 'var(--dp-shadow-md)' : 'none',
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? 'var(--dp-primary-600)' : 'var(--dp-primary-50)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--dp-shadow-lg)',
                    }
                  }}
                >
                  Dark Mode
                </Button>
              </Box>

            </Box>
          </Box>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <Box sx={{
            backgroundColor: 'var(--dp-neutral-0)',
            borderRadius: 'var(--dp-radius-lg)',
            border: '1px solid var(--dp-neutral-200)',
            boxShadow: 'var(--dp-shadow-sm)',
            p: 3,
            transition: 'var(--dp-transition-fast)',
            '&:hover': {
              boxShadow: 'var(--dp-shadow-md)',
              transform: 'translateY(-2px)',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-bold)',
              color: 'var(--dp-neutral-800)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Info sx={{ color: 'var(--dp-primary-500)' }} />
              Application Information
            </Typography>

            <Card sx={{
              mt: 2,
              borderRadius: 'var(--dp-radius-lg)',
              border: '1px solid var(--dp-neutral-200)',
              boxShadow: 'var(--dp-shadow-md)',
              transition: 'var(--dp-transition-fast)',
              backgroundColor: 'var(--dp-neutral-0) !important',
              '&:hover': {
                boxShadow: 'var(--dp-shadow-lg)',
                transform: 'translateY(-2px)',
              }
            }}>
              <CardContent sx={{
                backgroundColor: 'var(--dp-neutral-0) !important',
                fontFamily: 'var(--dp-font-family-primary)',
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Application
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)',
                      fontWeight: 'var(--dp-font-weight-semibold)'
                    }}>Design Planner</Typography>
                  </Box>
                  <Divider sx={{ my: 2, borderColor: 'var(--dp-neutral-200)' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Version
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)',
                      fontWeight: 'var(--dp-font-weight-semibold)'
                    }}>1.0.0</Typography>
                  </Box>
                  <Divider sx={{ my: 2, borderColor: 'var(--dp-neutral-200)' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{
                      color: 'var(--dp-neutral-600)',
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-medium)'
                    }}>
                      Logged in as
                    </Typography>
                    <Typography sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-800)',
                      fontWeight: 'var(--dp-font-weight-semibold)'
                    }}>{currentUser.name} ({currentUser.username})</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        backgroundColor: 'var(--dp-neutral-50) !important',
        borderTop: '1px solid var(--dp-neutral-200)',
        p: 3
      }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            backgroundColor: 'var(--dp-primary-500)',
            fontFamily: 'var(--dp-font-family-primary)',
            fontWeight: 'var(--dp-font-weight-medium)',
            borderRadius: 'var(--dp-radius-md)',
            transition: 'var(--dp-transition-fast)',
            boxShadow: 'var(--dp-shadow-sm)',
            '&:hover': {
              backgroundColor: 'var(--dp-primary-600)',
              boxShadow: 'var(--dp-shadow-md)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;