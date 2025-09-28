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
  Close
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Settings
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={activeTab === 'security' ? 'contained' : 'text'}
              startIcon={<Security />}
              onClick={() => setActiveTab('security')}
              size="small"
            >
              Security
            </Button>
            <Button
              variant={activeTab === 'appearance' ? 'contained' : 'text'}
              startIcon={<Palette />}
              onClick={() => setActiveTab('appearance')}
              size="small"
            >
              Appearance
            </Button>
            <Button
              variant={activeTab === 'about' ? 'contained' : 'text'}
              startIcon={<Info />}
              onClick={() => setActiveTab('about')}
              size="small"
            >
              About
            </Button>
          </Box>
        </Box>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Update your password to keep your account secure.
            </Typography>

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
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
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
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
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
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
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
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
                sx={{ mt: 2, alignSelf: 'flex-start' }}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Appearance Settings
            </Typography>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <FormControlLabel
                  control={<Switch disabled />}
                  label={
                    <Box>
                      <Typography>Dark Theme</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Coming Soon - Switch between light and dark themes
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Application Information
            </Typography>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Application
                    </Typography>
                    <Typography>Design Planner</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Version
                    </Typography>
                    <Typography>1.0.0</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Logged in as
                    </Typography>
                    <Typography>{currentUser.name} ({currentUser.username})</Typography>
                  </Box>
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

export default SettingsModal;