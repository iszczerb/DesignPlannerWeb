import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Design Token System
import './styles/tokens.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { DragDropProvider } from './contexts/DragDropContext';
import AuthProvider from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types/auth';

// Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import TeamSchedule from './pages/TeamSchedule';
import Analytics from './pages/Analytics';
import Unauthorized from './pages/Unauthorized';

// Management Components
import EmployeeManagement from './components/management/EmployeeManagement';

// Page Transition
import PageTransition from './components/common/PageTransition';

// Material Design 3 Theme Configuration with Design Tokens
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0ea5e9',      // dp-primary-500
      light: '#38bdf8',     // dp-primary-400
      dark: '#0369a1',      // dp-primary-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',      // dp-neutral-500
      light: '#94a3b8',     // dp-neutral-400
      dark: '#334155',      // dp-neutral-700
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1a1a',   // Dark background
      paper: '#262626',     // Dark paper
    },
    text: {
      primary: '#f8fafc',   // Light text
      secondary: '#cbd5e1', // Light secondary text
    },
    error: {
      main: '#ef4444',      // dp-error-500
      light: '#fca5a5',     // dp-error-600 (adjusted for light)
      dark: '#dc2626',      // dp-error-600
    },
    warning: {
      main: '#f59e0b',      // dp-warning-500
      light: '#fcd34d',     // dp-warning-600 (adjusted for light)
      dark: '#d97706',      // dp-warning-600
    },
    info: {
      main: '#3b82f6',      // dp-info-500
      light: '#93c5fd',     // dp-info-600 (adjusted for light)
      dark: '#2563eb',      // dp-info-600
    },
    success: {
      main: '#10b981',      // dp-success-500
      light: '#6ee7b7',     // dp-success-600 (adjusted for light)
      dark: '#059669',      // dp-success-600
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',        // dp-text-display-large equivalent
      lineHeight: 1.25,          // dp-line-height-tight
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',          // dp-text-headline-large
      lineHeight: 1.25,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',       // dp-text-headline-medium
      lineHeight: 1.25,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',        // dp-text-headline-small
      lineHeight: 1.25,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',       // Close to dp-text-title-large
      lineHeight: 1.25,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',      // dp-text-title-medium
      lineHeight: 1.25,
    },
    body1: {
      fontSize: '1rem',          // dp-text-body-large
      lineHeight: 1.5,           // dp-line-height-normal
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',      // dp-text-body-medium
      lineHeight: 1.43,
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem',      // dp-text-label-large
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',       // dp-text-body-small
      lineHeight: 1.43,
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 12,  // dp-radius-lg equivalent
  },
  spacing: 8,  // Matches dp-space-2 (8px base)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,        // dp-radius-md
          padding: '12px 20px',   // dp-space-3 dp-space-5
          fontSize: '0.875rem',   // dp-text-label-large
          transition: 'all 150ms ease', // dp-transition-fast
          minHeight: '44px',      // Accessibility minimum
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // dp-shadow-md
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // dp-shadow-lg
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: '#f8fafc', // dp-neutral-50
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // dp-shadow-md
          borderRadius: 12,      // dp-radius-lg
          border: '1px solid #e2e8f0', // dp-neutral-200
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: '#cbd5e1', // dp-neutral-300
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,      // dp-radius-md
            transition: 'all 150ms ease',
            '& fieldset': {
              borderColor: '#e2e8f0', // dp-neutral-200
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e1', // dp-neutral-300
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0ea5e9', // dp-primary-500
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,      // dp-radius-lg
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // dp-shadow-sm
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // dp-shadow-md
        },
        elevation2: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // dp-shadow-lg
        },
        elevation3: {
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // dp-shadow-xl
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,      // dp-radius-lg for pill shape
          fontSize: '0.75rem',   // dp-text-label-medium
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,      // dp-radius-xl for modals
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // dp-shadow-2xl
        },
      },
    },
  },
});

const App: React.FC = () => {
  console.log('🎯 App.tsx: App component rendering...');

  // Initialize theme on app load - DEFAULT TO DARK
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Set CSS custom properties based on saved theme
    if (savedTheme === 'light') {
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
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DragDropProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <PageTransition>
                          <Dashboard />
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/schedule"
                    element={
                      <ProtectedRoute>
                        <PageTransition>
                          <TeamSchedule />
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/team-schedule"
                    element={
                      <ProtectedRoute>
                        <PageTransition>
                          <TeamSchedule />
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute requiredRoles={[UserRole.Manager, UserRole.Admin]}>
                        <PageTransition>
                          <Analytics />
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  {/* Management Routes - Manager/Admin Only */}
                  <Route
                    path="/management/employees"
                    element={
                      <ProtectedRoute requiredRoles={[UserRole.Manager, UserRole.Admin]}>
                        <PageTransition>
                          <EmployeeManagement />
                        </PageTransition>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Default Route */}
                  <Route path="/" element={<Navigate to="/schedule" replace />} />
                  
                  {/* Catch-all Route */}
                  <Route path="*" element={<Navigate to="/schedule" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </DragDropProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;