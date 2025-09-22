import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Material Design 3 Theme Configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#006494',
      light: '#3d8db3',
      dark: '#004568',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#54627b',
      light: '#7e8ca0',
      dark: '#3b4556',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    error: {
      main: '#e53e3e',
      light: '#fc8181',
      dark: '#c53030',
    },
    warning: {
      main: '#ed8936',
      light: '#f6ad55',
      dark: '#c05621',
    },
    info: {
      main: '#3182ce',
      light: '#63b3ed',
      dark: '#2c5282',
    },
    success: {
      main: '#38a169',
      light: '#68d391',
      dark: '#2f855a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const App: React.FC = () => {
  console.log('🎯 App.tsx: App component rendering...');
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
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/schedule"
                    element={
                      <ProtectedRoute>
                        <TeamSchedule />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/team-schedule"
                    element={
                      <ProtectedRoute>
                        <TeamSchedule />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute requiredRoles={[UserRole.Manager, UserRole.Admin]}>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />

                  {/* Management Routes - Manager/Admin Only */}
                  <Route
                    path="/management/employees"
                    element={
                      <ProtectedRoute requiredRoles={[UserRole.Manager, UserRole.Admin]}>
                        <EmployeeManagement />
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