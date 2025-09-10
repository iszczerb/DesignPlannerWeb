import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { People, AdminPanelSettings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { UserRole } from '../types/auth';
import Navbar from '../components/layout/Navbar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const getRoleColor = (role: number) => {
    switch (role) {
      case 1: return '#f44336'; // Admin - Red
      case 2: return '#ff9800'; // Manager - Orange
      case 3: return '#4caf50'; // Team Member - Green
      default: return '#9e9e9e';
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 1: return 'Administrator';
      case 2: return 'Manager';
      case 3: return 'Team Member';
      default: return 'Unknown';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1">
                  {user?.fullName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1">
                  {user?.username}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: getRoleColor(user?.role || 0),
                    fontWeight: 'bold'
                  }}
                >
                  {getRoleName(user?.role || 0)}
                </Typography>
              </Box>
              {user?.employee && (
                <>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Employee ID
                    </Typography>
                    <Typography variant="body1">
                      {user.employee.employeeId}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Position
                    </Typography>
                    <Typography variant="body1">
                      {user.employee.position || 'Not specified'}
                    </Typography>
                  </Box>
                  {user.employee.team && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Team
                      </Typography>
                      <Typography variant="body1">
                        {user.employee.team.name}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                View Projects
              </Button>
              <Button variant="contained" color="secondary">
                My Tasks
              </Button>
              <Button variant="outlined">
                Team Calendar
              </Button>
              <Button variant="outlined">
                Reports
              </Button>
              
              {/* Manager and Admin only buttons */}
              {user && (user.role === UserRole.Admin || user.role === UserRole.Manager) && (
                <>
                  <Button 
                    variant="contained" 
                    startIcon={<People />}
                    onClick={() => navigate('/management/employees')}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    Manage Employees
                  </Button>
                </>
              )}
              
              {/* Admin only buttons */}
              {user && user.role === UserRole.Admin && (
                <Button 
                  variant="outlined" 
                  startIcon={<AdminPanelSettings />}
                  onClick={() => navigate('/admin')}
                  color="error"
                >
                  Admin Panel
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;