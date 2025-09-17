import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Container,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import type { LoginRequest } from '../../types/auth';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/schedule';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      // Navigation will happen automatically due to the useEffect above
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        px: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 480, md: 500 },
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 15px 25px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeInUp 0.6s ease-out',
            '@keyframes fadeInUp': {
              '0%': {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
              color: 'white',
              p: { xs: 3, sm: 4, md: 4 },
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Tate Logo */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 12, sm: 16 },
                right: { xs: 12, sm: 16 },
                opacity: 0.9,
              }}
            >
              <img
                src="/assets/logos/tate-logo.png"
                alt="Tate Logo"
                style={{
                  height: '28px',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </Box>

            {/* DesignPlanner Logo */}
            <Box sx={{ mb: 3 }}>
              <img
                src="/assets/logos/design-planner-logo.png"
                alt="DesignPlanner Logo"
                style={{
                  height: '80px',
                  width: '80px',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </Box>

            <Typography
              variant="h3"
              component="h1"
              fontWeight="700"
              gutterBottom
              sx={{
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' },
              }}
            >
              DesignPlanner
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.95,
                fontWeight: 300,
                mb: 1,
              }}
            >
              by Tate
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.9,
                fontWeight: 400,
              }}
            >
              Team Schedule Management Portal
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!validationErrors.username}
                helperText={validationErrors.username}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#1e40af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1e40af',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1e40af',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#1e40af' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        sx={{ color: '#6b7280' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1e40af',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1e40af',
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    sx={{
                      color: '#6b7280',
                      '&.Mui-checked': {
                        color: '#1e40af',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Keep me signed in
                  </Typography>
                }
                sx={{ mb: 4 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
                  },
                  mb: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

            </form>
          </CardContent>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            fontSize: '0.75rem',
          }}
        >
          © 2024 Tate. All rights reserved. | Internal Use Only
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;