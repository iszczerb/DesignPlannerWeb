import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import type { LoginRequest } from '../../types/auth';
import './LoginPage.css';

interface ServerLight {
  id: number;
  top: number;
  left: number;
  animationDelay: number;
}

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    rememberMe: false, // Not used, but kept for API compatibility
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverLights, setServerLights] = useState<ServerLight[]>([]);

  // Generate FIXED random positions - Set once, never change, only CSS animation for blinking
  const [lightsInitialized, setLightsInitialized] = useState(false);

  useEffect(() => {
    if (!lightsInitialized) {
      // 35 lights spread across the entire screen - FIXED positions, only blink
      const fixedLights: ServerLight[] = [
        { id: 0, top: 8, left: 5, animationDelay: 0 },
        { id: 1, top: 15, left: 12, animationDelay: 1.3 },
        { id: 2, top: 22, left: 19, animationDelay: 2.7 },
        { id: 3, top: 28, left: 27, animationDelay: 4.1 },
        { id: 4, top: 35, left: 34, animationDelay: 5.5 },
        { id: 5, top: 42, left: 41, animationDelay: 0.9 },
        { id: 6, top: 48, left: 48, animationDelay: 2.3 },
        { id: 7, top: 55, left: 55, animationDelay: 3.7 },
        { id: 8, top: 62, left: 62, animationDelay: 5.1 },
        { id: 9, top: 68, left: 69, animationDelay: 1.5 },
        { id: 10, top: 75, left: 76, animationDelay: 2.9 },
        { id: 11, top: 82, left: 83, animationDelay: 4.3 },
        { id: 12, top: 88, left: 90, animationDelay: 0.7 },
        { id: 13, top: 12, left: 88, animationDelay: 2.1 },
        { id: 14, top: 25, left: 72, animationDelay: 3.5 },
        { id: 15, top: 38, left: 85, animationDelay: 4.9 },
        { id: 16, top: 52, left: 8, animationDelay: 1.1 },
        { id: 17, top: 65, left: 15, animationDelay: 2.5 },
        { id: 18, top: 78, left: 22, animationDelay: 3.9 },
        { id: 19, top: 85, left: 36, animationDelay: 5.3 },
        { id: 20, top: 18, left: 58, animationDelay: 0.5 },
        { id: 21, top: 32, left: 65, animationDelay: 1.9 },
        { id: 22, top: 45, left: 78, animationDelay: 3.3 },
        { id: 23, top: 58, left: 92, animationDelay: 4.7 },
        { id: 24, top: 72, left: 44, animationDelay: 1.7 },
        { id: 25, top: 10, left: 38, animationDelay: 3.1 },
        { id: 26, top: 92, left: 52, animationDelay: 4.5 },
        { id: 27, top: 5, left: 25, animationDelay: 0.3 },
        { id: 28, top: 50, left: 30, animationDelay: 1.8 },
        { id: 29, top: 40, left: 95, animationDelay: 3.2 },
        { id: 30, top: 70, left: 50, animationDelay: 4.6 },
        { id: 31, top: 30, left: 10, animationDelay: 2.0 },
        { id: 32, top: 60, left: 88, animationDelay: 3.4 },
        { id: 33, top: 20, left: 45, animationDelay: 4.8 },
        { id: 34, top: 80, left: 65, animationDelay: 1.2 },
      ];

      setServerLights(fixedLights);
      setLightsInitialized(true);
    }
  }, [lightsInitialized]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

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
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

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
    <div className="login-page">
      {/* Datacenter Animated Background */}
      <div className="datacenter-background">
        {/* Server Rack Lines */}
        <div className="server-rack rack-1"></div>
        <div className="server-rack rack-2"></div>
        <div className="server-rack rack-3"></div>
        <div className="server-rack rack-4"></div>
        <div className="server-rack rack-5"></div>

        {/* Randomly Positioned Flashing Server Lights */}
        {serverLights.map((light, index) => (
          <div
            key={`${light.id}-${index}`}
            className="server-light"
            style={{
              top: `${light.top}%`,
              left: `${light.left}%`,
              animationDelay: `${light.animationDelay}s`,
            }}
          />
        ))}

        {/* Data Flow Lines */}
        <div className="data-line line-1"></div>
        <div className="data-line line-2"></div>
        <div className="data-line line-3"></div>
      </div>

      {/* Top Header */}
      <div className="login-header">
        <div className="login-header-content">
          <img
            src="/assets/logos/design-planner-logo.png"
            alt="Design Planner"
            className="header-logo-left"
          />
          <h1 className="header-title">Design Planner</h1>
          <img
            src="/assets/logos/tate-logo.png"
            alt="Tate"
            className="header-logo-right"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="login-content">
        <div className="login-card">
          {/* Error Alert */}
          {error && (
            <Alert severity="error" className="login-alert">
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              className="login-input"
              variant="outlined"
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
              className="login-input"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      className="password-toggle-icon"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Log In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
