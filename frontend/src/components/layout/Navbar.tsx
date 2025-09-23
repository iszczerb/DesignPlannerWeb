import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Box,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Dashboard as DashboardIcon,
  People,
  AdminPanelSettings,
  Storage,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { AbsenceButton } from '../leave';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { UserRole } from '../../types/auth';
import DatabaseManagementModal from '../database/DatabaseManagementModal';
import SettingsModal from '../settings/SettingsModal';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [databaseModalOpen, setDatabaseModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const canAccessManagement = user && (user.role === UserRole.Admin || user.role === UserRole.Manager);
  const canAccessAdmin = user && user.role === UserRole.Admin;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          DesignPlanner
        </Typography>
        
        {/* Navigation Links */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {canAccessManagement && (
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
              variant={isActive('/dashboard') ? 'outlined' : 'text'}
              sx={{
                borderColor: isActive('/dashboard') ? 'white' : 'transparent',
                color: 'white'
              }}
            >
              Dashboard
            </Button>
          )}

          {canAccessManagement && (
            <Button
              color="inherit"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/analytics')}
              variant={isActive('/analytics') ? 'outlined' : 'text'}
              sx={{
                borderColor: isActive('/analytics') ? 'white' : 'transparent',
                color: 'white'
              }}
            >
              Analytics
            </Button>
          )}

          {canAccessManagement && (
            <Button
              color="inherit"
              startIcon={<People />}
              onClick={() => navigate('/management/employees')}
              variant={location.pathname.startsWith('/management') ? 'outlined' : 'text'}
              sx={{ 
                borderColor: location.pathname.startsWith('/management') ? 'white' : 'transparent',
                color: 'white'
              }}
            >
              Employees
            </Button>
          )}
          
          {canAccessAdmin && (
            <>
              <Button
                color="inherit"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/admin')}
                variant={location.pathname.startsWith('/admin') ? 'outlined' : 'text'}
                sx={{
                  borderColor: location.pathname.startsWith('/admin') ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                Admin
              </Button>
              <Button
                color="inherit"
                startIcon={<Storage />}
                onClick={() => setDatabaseModalOpen(true)}
                variant={databaseModalOpen ? 'outlined' : 'text'}
                sx={{
                  borderColor: databaseModalOpen ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                Database
              </Button>
            </>
          )}
          
          {/* Absence Button */}
          <AbsenceButton 
            variant="text"
            showLabel={true}
          />
        </Box>

        {/* User Menu */}
        <div>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); setSettingsModalOpen(true); }}>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>

      {/* Database Management Modal */}
      <DatabaseManagementModal
        isOpen={databaseModalOpen}
        onClose={() => setDatabaseModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </AppBar>
  );
};

export default Navbar;