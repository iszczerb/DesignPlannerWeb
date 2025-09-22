import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Typography,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  styled,
  alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as DatabaseIcon,
  EventBusy as AbsenceIcon,
  Psychology as SkillsIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  ViewWeek as ViewIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

// Styled components for iOS-like appearance
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: '#1e3a5f',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  borderBottom: '1px solid #e9ecef',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginRight: theme.spacing(3),
}));

const LogoImage = styled('img')(({ theme }) => ({
  height: 40,
  width: 'auto',
  display: 'block',
}));

const DesignPlannerLogo = styled('img')(({ theme }) => ({
  height: 48,
  width: 48,
  display: 'block',
}));

const ClickableLogoContainer = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: '8px',
  padding: '4px',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: alpha('#3498db', 0.1),
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const TateLogo = styled('img')(({ theme }) => ({
  height: 36,
  width: 'auto',
  display: 'block',
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginRight: 'auto',
  marginLeft: theme.spacing(2),
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: '#1e3a5f',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  borderRadius: '8px',
  padding: '6px 16px',
  '&:hover': {
    backgroundColor: alpha('#3498db', 0.1),
    color: '#3498db',
  },
  '&.active': {
    backgroundColor: '#3498db',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  '&:hover': {
    backgroundColor: '#f1f3f4',
  },
  marginRight: theme.spacing(2),
  width: '300px',
}));

const SearchIconWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6c757d',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#1e3a5f',
  fontSize: '14px',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
  },
}));

const UserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface AppHeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  // Date navigation props
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  currentViewType?: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
  onViewTypeChange?: (viewType: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly') => void;
  // Logo click handler
  onLogoClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentPage = 'dashboard',
  onNavigate,
  onSearch,
  userName = 'John Manager',
  userRole = 'Manager',
  userAvatar,
  onProfile,
  onSettings,
  onLogout,
  currentDate = new Date(),
  onDateChange,
  currentViewType = 'Weekly',
  onViewTypeChange,
  onLogoClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);
  const viewMenuOpen = Boolean(viewMenuAnchor);
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'skills', label: 'Skills', icon: SkillsIcon },
    { id: 'database', label: 'Database', icon: DatabaseIcon },
    { id: 'absence', label: 'Absence', icon: AbsenceIcon },
  ];

  // Split navigation items: Dashboard always visible, others in burger menu on mobile
  const alwaysVisibleItems = navigationItems.filter(item => item.id === 'dashboard');
  const burgerMenuItems = navigationItems.filter(item => item.id !== 'dashboard');

  const viewTypes: ('Daily' | 'Weekly' | 'Biweekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Biweekly', 'Monthly'];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(event.target.value);
  };

  const handleNavigation = (pageId: string) => {
    onNavigate?.(pageId);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMenuItemClick = (action: () => void | undefined) => {
    handleUserMenuClose();
    action?.();
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchor(null);
  };

  // Keyboard and mouse wheel navigation handlers - only works for Weekly and Biweekly views (like WPF)
  React.useEffect(() => {
    let accumulatedScroll = 0;
    let scrollAnimationFrame: number | null = null;
    let lastWheelTime = 0;
    const SCROLL_SENSITIVITY = 100; // How much scroll delta equals one day navigation
    const SCROLL_DECAY = 0.95; // Momentum decay factor
    const SCROLL_RESET_TIME = 200; // Reset accumulated scroll after this many ms of inactivity

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only allow navigation in Weekly and Biweekly views (matching WPF logic)
      if ((currentViewType === 'Weekly' || currentViewType === 'Biweekly') && onDateChange && currentDate) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          navigatePreviousDay();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          navigateNextDay();
        }
      }
    };

    // Smooth animation for accumulated scroll
    const applyScrollNavigation = () => {
      if (Math.abs(accumulatedScroll) >= SCROLL_SENSITIVITY) {
        const daysToNavigate = Math.floor(Math.abs(accumulatedScroll) / SCROLL_SENSITIVITY);
        const direction = accumulatedScroll > 0 ? 1 : -1;

        // Navigate multiple days at once for smoother feel
        if (onDateChange && currentDate) {
          const newDate = new Date(currentDate);
          let daysNavigated = 0;

          while (daysNavigated < daysToNavigate) {
            newDate.setDate(newDate.getDate() + direction);
            // Skip weekends
            while (newDate.getDay() === 0 || newDate.getDay() === 6) {
              newDate.setDate(newDate.getDate() + direction);
            }
            daysNavigated++;
          }

          // Only trigger one update for all days
          onDateChange(newDate);
        }

        // Reduce accumulated scroll by the amount we navigated
        accumulatedScroll = accumulatedScroll % SCROLL_SENSITIVITY;
      }

      // Apply momentum decay
      accumulatedScroll *= SCROLL_DECAY;

      // Continue animation if there's still momentum
      if (Math.abs(accumulatedScroll) > 0.1) {
        scrollAnimationFrame = requestAnimationFrame(applyScrollNavigation);
      } else {
        accumulatedScroll = 0;
        scrollAnimationFrame = null;
      }
    };

    // Handle mouse wheel events with momentum
    const handleWheel = (event: WheelEvent) => {
      // Only allow navigation in Weekly and Biweekly views
      if ((currentViewType === 'Weekly' || currentViewType === 'Biweekly') && onDateChange && currentDate) {
        let delta = 0;

        // Native horizontal scroll (e.g., trackpad or mouse with horizontal wheel)
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          delta = event.deltaX;
        }
        // Vertical scroll with Shift key held
        else if (event.shiftKey && event.deltaY !== 0) {
          delta = event.deltaY;
        }

        if (delta !== 0) {
          event.preventDefault();

          const now = Date.now();
          // Reset accumulated scroll if too much time has passed
          if (now - lastWheelTime > SCROLL_RESET_TIME) {
            accumulatedScroll = 0;
          }
          lastWheelTime = now;

          // Add to accumulated scroll
          accumulatedScroll += delta;

          // Cancel any existing animation and start a new one
          if (scrollAnimationFrame) {
            cancelAnimationFrame(scrollAnimationFrame);
          }
          scrollAnimationFrame = requestAnimationFrame(applyScrollNavigation);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      if (scrollAnimationFrame) {
        cancelAnimationFrame(scrollAnimationFrame);
      }
    };
  }, [currentDate, currentViewType]);

  // Simple navigation helpers for keyboard input - actual WPF logic is in TeamSchedule
  const navigatePreviousDay = () => {
    if (!onDateChange || !currentDate) return;
    
    // Only works in Weekly and Biweekly views
    if (currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      // Skip weekends - if we hit Saturday, go to Friday
      while (newDate.getDay() === 0 || newDate.getDay() === 6) {
        newDate.setDate(newDate.getDate() - 1);
      }
      onDateChange(newDate);
    }
  };

  const navigateNextDay = () => {
    if (!onDateChange || !currentDate) return;
    
    // Only works in Weekly and Biweekly views
    if (currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      // Skip weekends - if we hit Saturday, go to Monday
      while (newDate.getDay() === 0 || newDate.getDay() === 6) {
        newDate.setDate(newDate.getDate() + 1);
      }
      onDateChange(newDate);
    }
  };

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar sx={{ minHeight: '64px', px: 3 }}>
        {/* DesignPlanner Logo Section */}
        <LogoContainer>
          <ClickableLogoContainer
            onClick={onLogoClick}
            title="Go to current week"
          >
            <DesignPlannerLogo
              src="/assets/logos/design-planner-logo.png"
              alt="Design Planner"
              onError={(e) => {
                console.error('Failed to load DesignPlanner logo');
                e.currentTarget.style.display = 'none';
              }}
            />
          </ClickableLogoContainer>
        </LogoContainer>

        {/* Navigation Buttons - Dashboard always visible, others in burger menu on mobile */}
        <NavigationContainer>
          {/* Dashboard button - always visible */}
          {alwaysVisibleItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <NavButton
                key={item.id}
                startIcon={<IconComponent />}
                className={isActive ? 'active' : ''}
                onClick={() => handleNavigation(item.id)}
              >
                {item.label}
              </NavButton>
            );
          })}
          
          {/* Other navigation items - show on desktop, burger menu on mobile */}
          {!isMobile ? (
            burgerMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <NavButton
                  key={item.id}
                  startIcon={<IconComponent />}
                  className={isActive ? 'active' : ''}
                  onClick={() => handleNavigation(item.id)}
                >
                  {item.label}
                </NavButton>
              );
            })
          ) : (
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{
                color: '#1e3a5f',
                marginLeft: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </NavigationContainer>

        {/* Search Bar */}
        <SearchContainer>
          <SearchIconWrapper>
            <SearchIcon fontSize="small" />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search tasks..."
            inputProps={{ 'aria-label': 'search' }}
            onChange={handleSearchChange}
          />
        </SearchContainer>

        {/* View Button - Always Visible */}
        <Button
          startIcon={<ViewIcon />}
          endIcon={<ArrowDownIcon />}
          onClick={handleViewMenuOpen}
          sx={{
            color: '#1e3a5f',
            fontWeight: '500',
            fontSize: '14px',
            textTransform: 'none',
            borderRadius: '8px',
            padding: '6px 16px',
            marginRight: 2,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              borderColor: '#d1d5db',
            },
          }}
        >
          {currentViewType}
        </Button>

        {/* User Section */}
        <UserSection>
          <Box sx={{ textAlign: 'right', mr: 2, display: 'none' }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              fontSize: '14px',
              color: '#1e3a5f'
            }}>
              John
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#6c757d',
              fontSize: '12px'
            }}>
              Manager
            </Typography>
          </Box>
          
          {/* User Avatar with Menu */}
          <IconButton
            onClick={handleUserMenuOpen}
            sx={{
              p: 0,
              ml: 1,
              mr: 2,
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <Avatar
              src={userAvatar}
              alt={userName}
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#3498db',
                fontSize: '14px',
                fontWeight: 600,
                border: '2px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {!userAvatar && getUserInitials(userName)}
            </Avatar>
          </IconButton>
          
          {/* Tate Logo */}
          <TateLogo 
            src="/assets/logos/tate-logo.png" 
            alt="Tate"
            onError={(e) => {
              console.error('Failed to load Tate logo');
              e.currentTarget.style.display = 'none';
            }}
          />
        </UserSection>

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          onClick={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              borderRadius: '8px',
              minWidth: 180,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={() => handleMenuItemClick(onProfile)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuItemClick(onSettings)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => handleMenuItemClick(onLogout)}
            sx={{ 
              py: 1, 
              px: 2,
              color: '#dc3545',
              '&:hover': {
                backgroundColor: alpha('#dc3545', 0.1),
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#dc3545' }} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Mobile Navigation Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              borderRadius: '8px',
              minWidth: 180,
            },
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          {/* Only show non-Dashboard items in burger menu */}
          {burgerMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <MenuItem 
                key={item.id}
                onClick={() => {
                  handleMobileMenuClose();
                  handleNavigation(item.id);
                }}
                sx={{ 
                  py: 1, 
                  px: 2,
                  backgroundColor: isActive ? alpha('#3498db', 0.1) : 'transparent',
                  color: isActive ? '#3498db' : '#374151',
                  '&:hover': {
                    backgroundColor: alpha('#3498db', 0.1),
                    color: '#3498db',
                  },
                }}
              >
                <ListItemIcon>
                  <IconComponent fontSize="small" sx={{ color: isActive ? '#3498db' : '#6b7280' }} />
                </ListItemIcon>
                {item.label}
              </MenuItem>
            );
          })}
        </Menu>

        {/* View Type Menu */}
        <Menu
          anchorEl={viewMenuAnchor}
          open={viewMenuOpen}
          onClose={handleViewMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              borderRadius: '8px',
              minWidth: 120,
            },
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          {viewTypes.map((viewType) => (
            <MenuItem 
              key={viewType}
              onClick={() => {
                handleViewMenuClose();
                onViewTypeChange?.(viewType);
              }}
              sx={{ 
                py: 1, 
                px: 2,
                backgroundColor: currentViewType === viewType ? alpha('#3498db', 0.1) : 'transparent',
                color: currentViewType === viewType ? '#3498db' : '#374151',
                '&:hover': {
                  backgroundColor: alpha('#3498db', 0.1),
                  color: '#3498db',
                },
              }}
            >
              {viewType}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default AppHeader;