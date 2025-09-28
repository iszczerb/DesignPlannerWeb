import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Settings as SettingsIcon,
  Palette,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    setMessage({ type: 'success', text: `Theme changed to ${newTheme} mode` });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage(null);
    setValidationErrors({});
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }

    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Password confirmation is required';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmNewPassword: passwordData.confirmNewPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setValidationErrors({});
    setMessage(null);
    setTabValue(0);
    onClose();
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--dp-radius-lg)',
          minHeight: 500,
          backgroundColor: 'var(--dp-neutral-0) !important',
          boxShadow: 'var(--dp-shadow-lg)',
        }
      }}
    >
      <DialogTitle sx={{
        pb: 0,
        backgroundColor: 'var(--dp-primary-600)',
        color: 'var(--dp-neutral-0)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: 'var(--dp-neutral-0)' }} />
          <Typography variant="h6" sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            fontWeight: 'var(--dp-font-weight-bold)',
            fontSize: 'var(--dp-text-headline-medium)'
          }}>Settings</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        px: 0,
        pb: 0,
        backgroundColor: 'var(--dp-neutral-25) !important'
      }}>
        <Box sx={{
          borderBottom: '1px solid var(--dp-neutral-200)',
          backgroundColor: 'var(--dp-neutral-0) !important'
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-medium)',
                textTransform: 'none',
                transition: 'var(--dp-transition-fast)',
                '&:hover': {
                  backgroundColor: 'var(--dp-primary-50)',
                },
                '&.Mui-selected': {
                  color: 'var(--dp-primary-600)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--dp-primary-500)',
                height: 3,
                borderRadius: 'var(--dp-radius-sm)',
              }
            }}
          >
            <Tab label="Profile" id="settings-tab-0" />
            <Tab label="Security" id="settings-tab-1" />
            <Tab label="Appearance" id="settings-tab-2" />
          </Tabs>
        </Box>

        <Box sx={{ px: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {/* Profile Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>

              <TextField
                fullWidth
                label="Username"
                value={user?.username || ''}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="First Name"
                value={user?.firstName || ''}
                disabled
              />

              <TextField
                fullWidth
                label="Last Name"
                value={user?.lastName || ''}
                disabled
              />

              <TextField
                fullWidth
                label="Role"
                value={user?.role === 1 ? 'Admin' : user?.role === 2 ? 'Manager' : 'Team Member'}
                disabled
              />

              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  Profile information can only be updated by administrators.
                  Contact your system administrator to make changes.
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Security Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" gutterBottom sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-bold)',
                color: 'var(--dp-neutral-800)'
              }}>
                Change Password
              </Typography>

              {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                  {message.text}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                error={!!validationErrors.currentPassword}
                helperText={validationErrors.currentPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                error={!!validationErrors.newPassword}
                helperText={validationErrors.newPassword || 'Must be at least 6 characters'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmNewPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordInputChange}
                error={!!validationErrors.confirmNewPassword}
                helperText={validationErrors.confirmNewPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={loading}
                sx={{ mt: 2 }}
                startIcon={loading ? <CircularProgress size={16} /> : <Lock />}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2" color="warning.dark">
                  <strong>Security Tips:</strong>
                  <br />• Use a strong password with at least 8 characters
                  <br />• Include uppercase, lowercase, numbers, and symbols
                  <br />• Don't reuse passwords from other accounts
                  <br />• Change your password regularly
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Appearance Tab */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

              {message && tabValue === 2 && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                  {message.text}
                </Alert>
              )}

              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}>
                <Typography variant="subtitle1" sx={{
                  fontWeight: 'var(--dp-font-weight-bold)',
                  fontFamily: 'var(--dp-font-family-primary)',
                  color: 'var(--dp-neutral-800)'
                }}>
                  Select Theme
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={theme === 'light' ? 'contained' : 'outlined'}
                    startIcon={<LightMode />}
                    onClick={() => handleThemeChange('light')}
                    sx={{
                      flex: 1,
                      py: 2,
                      textTransform: 'none',
                      fontSize: '1rem'
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
                      py: 2,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                  >
                    Dark Mode
                  </Button>
                </Box>

                <Typography variant="body2" sx={{
                  color: 'var(--dp-neutral-600)',
                  fontFamily: 'var(--dp-font-family-primary)'
                }}>
                  Current theme: <strong>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</strong>
                </Typography>
              </Box>

              <Box sx={{
                mt: 2,
                p: 2,
                bgcolor: 'var(--dp-info-50)',
                borderRadius: 'var(--dp-radius-md)',
                border: '1px solid var(--dp-info-200)'
              }}>
                <Typography variant="body2" sx={{
                  color: 'var(--dp-info-700)',
                  fontFamily: 'var(--dp-font-family-primary)'
                }}>
                  <strong>Theme Information:</strong>
                  <br />• Light mode provides better visibility during daytime use
                  <br />• Dark mode reduces eye strain in low-light environments
                  <br />• Your theme preference is saved locally
                  <br />• Changes take effect immediately
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 2,
        backgroundColor: 'var(--dp-neutral-50) !important',
        borderTop: '1px solid var(--dp-neutral-200)',
      }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            backgroundColor: 'var(--dp-primary-500)',
            fontFamily: 'var(--dp-font-family-primary)',
            fontWeight: 'var(--dp-font-weight-medium)',
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