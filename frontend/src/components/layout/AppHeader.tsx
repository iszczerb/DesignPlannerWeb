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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
  Visibility as ViewIcon,
  KeyboardArrowDown as ArrowDownIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

// Styled components for iOS-like appearance
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'var(--dp-neutral-0)',
  color: 'var(--dp-neutral-800)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  borderBottom: '1px solid var(--dp-neutral-100)',
  fontFamily: 'var(--dp-font-family-primary)',
  backdropFilter: 'blur(12px)',
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
  // Only white in dark theme
  '[data-theme="dark"] &': {
    filter: 'brightness(0) invert(1)',
  },
}));

const ClickableLogoContainer = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: 'var(--dp-radius-md)',
  padding: 'var(--dp-space-1)',
  transition: 'var(--dp-transition-fast)',
  '&:hover': {
    backgroundColor: 'var(--dp-primary-50)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

const TateLogo = styled('img')(({ theme }) => ({
  height: 36,
  width: 'auto',
  display: 'block',
  // Only white in dark theme
  '[data-theme="dark"] &': {
    filter: 'brightness(0) invert(1)',
  },
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginLeft: 'auto',
  marginRight: theme.spacing(2),
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: 'var(--dp-neutral-700)',
  fontWeight: 'var(--dp-font-weight-medium)',
  fontSize: 'var(--dp-text-body-medium)',
  fontFamily: 'var(--dp-font-family-primary)',
  textTransform: 'none',
  borderRadius: 'var(--dp-radius-lg)',
  padding: 'var(--dp-space-2) var(--dp-space-5)',
  position: 'relative',
  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: '44px',
  backdropFilter: 'blur(8px)',
  border: '1px solid transparent',

  '&:hover': {
    backgroundColor: 'var(--dp-primary-50)',
    color: 'var(--dp-primary-600)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
    border: '1px solid var(--dp-primary-200)',
  },

  '&.active': {
    backgroundColor: 'var(--dp-primary-500)',
    color: 'var(--dp-neutral-0)',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
    fontWeight: 'var(--dp-font-weight-semibold)',

    '&:hover': {
      backgroundColor: 'var(--dp-primary-600)',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
    },
  },

  '&:active': {
    transform: 'translateY(0px)',
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
  onDirectDateNavigation?: (date: Date) => void;
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
  onDirectDateNavigation,
  currentViewType = 'Weekly',
  onViewTypeChange,
  onLogoClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // < 1200px: icon-only for Database, Skills, Absence
  const isVeryCondensed = useMediaQuery(theme.breakpoints.down('md')); // < 900px: icon-only for Dashboard and View too
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  const viewMenuOpen = Boolean(viewMenuAnchor);
  const navigationItems = [
    { id: 'database', label: 'Database', icon: DatabaseIcon, roles: ['Manager', 'Admin'] },
    { id: 'skills', label: 'Skills', icon: SkillsIcon, roles: ['Manager', 'Admin'] },
    { id: 'absence', label: 'Absence', icon: AbsenceIcon, roles: ['Manager', 'Admin', 'TeamMember'] },
  ];

  const dashboardItem = { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon };

  // Filter navigation items based on user role
  const mainNavigationItems = navigationItems.filter(item =>
    item.roles.includes(userRole)
  );

  const viewTypes: ('Daily' | 'Weekly' | 'Biweekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Biweekly', 'Monthly'];


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
      // Allow navigation in Daily, Weekly, Biweekly, and Monthly views
      if (onDateChange && currentDate) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (currentViewType === 'Monthly') {
            navigatePreviousMonth();
          } else if (currentViewType === 'Daily' || currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
            navigatePreviousDay();
          }
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (currentViewType === 'Monthly') {
            navigateNextMonth();
          } else if (currentViewType === 'Daily' || currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
            navigateNextDay();
          }
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

    // Works in Daily, Weekly and Biweekly views
    if (currentViewType === 'Daily' || currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);

      // For Daily view, include weekends; for Weekly/Biweekly, skip weekends
      if (currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
        // Skip weekends - if we hit Saturday, go to Friday
        while (newDate.getDay() === 0 || newDate.getDay() === 6) {
          newDate.setDate(newDate.getDate() - 1);
        }
      }

      onDateChange(newDate);
    }
  };

  const navigateNextDay = () => {
    if (!onDateChange || !currentDate) return;

    // Works in Daily, Weekly and Biweekly views
    if (currentViewType === 'Daily' || currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);

      // For Daily view, include weekends; for Weekly/Biweekly, skip weekends
      if (currentViewType === 'Weekly' || currentViewType === 'Biweekly') {
        // Skip weekends - if we hit Saturday, go to Monday
        while (newDate.getDay() === 0 || newDate.getDay() === 6) {
          newDate.setDate(newDate.getDate() + 1);
        }
      }

      onDateChange(newDate);
    }
  };

  // Month navigation functions for Monthly view
  const navigatePreviousMonth = () => {
    if (!onDateChange || !currentDate) return;

    if (currentViewType === 'Monthly') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);

      // Ensure we stay on a business day - if we land on weekend, move to next Monday
      const dayOfWeek = newDate.getDay();
      if (dayOfWeek === 0) { // Sunday
        newDate.setDate(newDate.getDate() + 1);
      } else if (dayOfWeek === 6) { // Saturday
        newDate.setDate(newDate.getDate() + 2);
      }

      onDateChange(newDate);
    }
  };

  const navigateNextMonth = () => {
    if (!onDateChange || !currentDate) return;

    if (currentViewType === 'Monthly') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);

      // Ensure we stay on a business day - if we land on weekend, move to next Monday
      const dayOfWeek = newDate.getDay();
      if (dayOfWeek === 0) { // Sunday
        newDate.setDate(newDate.getDate() + 1);
      } else if (dayOfWeek === 6) { // Saturday
        newDate.setDate(newDate.getDate() + 2);
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
        {/* DesignPlanner Logo Section with Current Date */}
        <LogoContainer>
          <ClickableLogoContainer
            onClick={onLogoClick}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedDate(new Date());
              setDatePickerOpen(true);
            }}
            title="Left-click: Go to today | Right-click: Pick date"
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

          {/* Current Date Display - shows next business day if today is weekend */}
          <Typography
            variant="body2"
            sx={{
              color: 'var(--dp-neutral-500)',
              fontSize: '18px',
              fontWeight: '500',
              marginLeft: '12px',
            }}
          >
            {(() => {
              const today = new Date();
              const todayDayOfWeek = today.getDay();

              // If today is weekend, show next Monday
              if (todayDayOfWeek === 0 || todayDayOfWeek === 6) {
                const nextMonday = new Date(today);
                const daysUntilMonday = todayDayOfWeek === 0 ? 1 : 2; // Sunday: +1, Saturday: +2
                nextMonday.setDate(today.getDate() + daysUntilMonday);

                return nextMonday.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              }

              // If today is a weekday, show today
              return today.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
            })()}
          </Typography>
        </LogoContainer>

        {/* Navigation Buttons - moved to right side */}
        <NavigationContainer>
          {/* Navigation items - show with text on desktop, icon-only on mobile with tooltips */}
          {mainNavigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Tooltip key={item.id} title={item.label} arrow placement="bottom">
                <NavButton
                  startIcon={isMobile ? undefined : <IconComponent />}
                  className={isActive ? 'active' : ''}
                  onClick={() => handleNavigation(item.id)}
                  sx={isMobile ? {
                    minWidth: '44px',
                    padding: 'var(--dp-space-2)',
                    '& .MuiButton-startIcon': {
                      margin: 0,
                    }
                  } : {}}
                >
                  {isMobile ? <IconComponent /> : item.label}
                </NavButton>
              </Tooltip>
            );
          })}

          {/* Dashboard button - Text on desktop, icon-only on very condensed */}
          {(() => {
            const IconComponent = dashboardItem.icon;
            const isActive = currentPage === dashboardItem.id;

            return (
              <Tooltip title={isVeryCondensed ? dashboardItem.label : ''} arrow placement="bottom">
                <NavButton
                  key={dashboardItem.id}
                  startIcon={isVeryCondensed ? undefined : <IconComponent />}
                  className={isActive ? 'active' : ''}
                  onClick={() => handleNavigation(dashboardItem.id)}
                  sx={isVeryCondensed ? {
                    minWidth: '44px',
                    padding: 'var(--dp-space-2)',
                    '& .MuiButton-startIcon': {
                      margin: 0,
                    }
                  } : {}}
                >
                  {isVeryCondensed ? <IconComponent /> : dashboardItem.label}
                </NavButton>
              </Tooltip>
            );
          })()}
        </NavigationContainer>


        {/* View Button - Text on desktop, icon-only on very condensed */}
        <Tooltip title={isVeryCondensed ? `View: ${currentViewType}` : ''} arrow placement="bottom">
          <Button
            startIcon={isVeryCondensed ? undefined : <ViewIcon />}
            endIcon={isVeryCondensed ? undefined : <ArrowDownIcon />}
            onClick={handleViewMenuOpen}
            sx={isVeryCondensed ? {
              minWidth: '44px',
              color: 'var(--dp-neutral-800)',
              fontWeight: 'var(--dp-font-weight-medium)',
              fontSize: 'var(--dp-text-body-medium)',
              fontFamily: 'var(--dp-font-family-primary)',
              textTransform: 'none',
              borderRadius: 'var(--dp-radius-md)',
              padding: 'var(--dp-space-2)',
              marginRight: 2,
              border: '1px solid var(--dp-neutral-200)',
              backgroundColor: 'var(--dp-neutral-0)',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                backgroundColor: 'var(--dp-neutral-50)',
                borderColor: 'var(--dp-neutral-300)',
                color: 'var(--dp-neutral-900)',
              },
            } : {
              color: 'var(--dp-neutral-800)',
              fontWeight: 'var(--dp-font-weight-medium)',
              fontSize: 'var(--dp-text-body-medium)',
              fontFamily: 'var(--dp-font-family-primary)',
              textTransform: 'none',
              borderRadius: 'var(--dp-radius-md)',
              padding: 'var(--dp-space-2) var(--dp-space-4)',
              marginRight: 2,
              border: '1px solid var(--dp-neutral-200)',
              backgroundColor: 'var(--dp-neutral-0)',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                backgroundColor: 'var(--dp-neutral-50)',
                borderColor: 'var(--dp-neutral-300)',
                color: 'var(--dp-neutral-900)',
              },
            }}
          >
            {isVeryCondensed ? <ViewIcon /> : currentViewType}
          </Button>
        </Tooltip>

        {/* User Section */}
        <UserSection>
          <Box sx={{ textAlign: 'right', mr: 2, display: 'none' }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              fontSize: '14px',
              color: 'var(--dp-neutral-800)'
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
                backgroundColor: 'var(--dp-primary-500)',
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
              backgroundColor: 'var(--dp-neutral-0)',
              border: '1px solid var(--dp-neutral-200)',
              '& .MuiMenuItem-root': {
                color: 'var(--dp-neutral-700)',
                '&:hover': {
                  backgroundColor: 'var(--dp-neutral-100)',
                },
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'var(--dp-neutral-0)',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                border: '1px solid var(--dp-neutral-200)',
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
              <PersonIcon fontSize="small" sx={{ color: 'var(--dp-neutral-500)' }} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem 
            onClick={() => handleMenuItemClick(onSettings)}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" sx={{ color: 'var(--dp-neutral-500)' }} />
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
              <LogoutIcon fontSize="small" sx={{ color: 'var(--dp-error-500)' }} />
            </ListItemIcon>
            Logout
          </MenuItem>
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
              backgroundColor: 'var(--dp-neutral-0)',
              border: '1px solid var(--dp-neutral-200)',
              '& .MuiMenuItem-root': {
                color: 'var(--dp-neutral-700)',
                '&:hover': {
                  backgroundColor: 'var(--dp-neutral-100)',
                },
              },
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
                backgroundColor: currentViewType === viewType ? alpha('#0ea5e9', 0.1) : 'transparent',
                color: currentViewType === viewType ? 'var(--dp-primary-500)' : '#374151',
                '&:hover': {
                  backgroundColor: alpha('#0ea5e9', 0.1),
                  color: 'var(--dp-primary-500)',
                },
              }}
            >
              {viewType}
            </MenuItem>
          ))}
        </Menu>

        {/* Date Picker Dialog */}
        <Dialog
          open={datePickerOpen}
          onClose={() => setDatePickerOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 'var(--dp-radius-xl)',
              padding: 'var(--dp-space-2)',
              backgroundColor: 'var(--dp-neutral-0)',
              boxShadow: 'var(--dp-shadow-2xl)',
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--dp-space-2)',
            color: 'var(--dp-neutral-900)',
            fontSize: 'var(--dp-text-title-large)',
            fontWeight: 'var(--dp-font-weight-bold)',
            fontFamily: 'var(--dp-font-family-primary)',
          }}>
            <DateRangeIcon sx={{ color: 'var(--dp-primary-500)' }} />
            Go to Date
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{
              color: 'var(--dp-neutral-600)',
              mb: 'var(--dp-space-3)',
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
            }}>
              Select a business day (Monday - Friday) to navigate to:
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newValue) => {
                  if (newValue) {
                    const dayOfWeek = newValue.getDay();
                    // If weekend is selected, find the nearest Monday
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                      const nearestMonday = new Date(newValue);
                      if (dayOfWeek === 0) { // Sunday
                        nearestMonday.setDate(nearestMonday.getDate() + 1);
                      } else if (dayOfWeek === 6) { // Saturday
                        nearestMonday.setDate(nearestMonday.getDate() + 2);
                      }
                      setSelectedDate(nearestMonday);
                    } else {
                      setSelectedDate(newValue);
                    }
                  } else {
                    setSelectedDate(null);
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      sx: {
                        color: 'var(--dp-neutral-900)',
                      },
                    },
                    sx: {
                      mt: 'var(--dp-space-2)',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 'var(--dp-radius-lg)',
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-medium)',
                        color: 'var(--dp-neutral-900)',
                        backgroundColor: 'var(--dp-neutral-0)',
                        '& fieldset': {
                          borderColor: 'var(--dp-neutral-300)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--dp-primary-500)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--dp-primary-500)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-medium)',
                        color: 'var(--dp-neutral-600)',
                        '&.Mui-focused': {
                          color: 'var(--dp-primary-500)',
                        },
                      },
                      '& .MuiIconButton-root': {
                        color: 'var(--dp-primary-500)',
                      },
                      '& input': {
                        color: 'var(--dp-neutral-900)',
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-medium)',
                      },
                    },
                  },
                  popper: {
                    sx: {
                      '& .MuiPaper-root': {
                        backgroundColor: 'var(--dp-neutral-0)',
                        borderRadius: 'var(--dp-radius-xl)',
                        boxShadow: 'var(--dp-shadow-2xl)',
                        border: '1px solid var(--dp-neutral-300)',
                        fontFamily: 'var(--dp-font-family-primary)',
                        '& .MuiPickersCalendarHeader-root': {
                          fontFamily: 'var(--dp-font-family-primary)',
                          color: 'var(--dp-neutral-900)',
                          '& .MuiPickersCalendarHeader-label': {
                            fontWeight: 'var(--dp-font-weight-bold)',
                            fontSize: 'var(--dp-text-body-large)',
                          },
                          '& .MuiIconButton-root': {
                            color: 'var(--dp-neutral-700)',
                          },
                        },
                        '& .MuiDayCalendar-header': {
                          '& .MuiTypography-root': {
                            fontFamily: 'var(--dp-font-family-primary)',
                            fontWeight: 'var(--dp-font-weight-semibold)',
                            color: 'var(--dp-neutral-600)',
                          },
                        },
                        '& .MuiPickersDay-root': {
                          fontFamily: 'var(--dp-font-family-primary)',
                          color: 'var(--dp-neutral-800)',
                          '&:hover': {
                            backgroundColor: 'var(--dp-primary-100)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--dp-primary-500)',
                            color: 'var(--dp-neutral-0)',
                            fontWeight: 'var(--dp-font-weight-bold)',
                            '&:hover': {
                              backgroundColor: 'var(--dp-primary-600)',
                            },
                          },
                          '&.MuiPickersDay-today': {
                            border: '2px solid var(--dp-primary-500)',
                            fontWeight: 'var(--dp-font-weight-semibold)',
                          },
                        },
                        '& .MuiPickersYear-yearButton': {
                          fontFamily: 'var(--dp-font-family-primary)',
                          color: 'var(--dp-neutral-800)',
                          '&:hover': {
                            backgroundColor: 'var(--dp-primary-100)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--dp-primary-500)',
                            color: 'var(--dp-neutral-0)',
                            fontWeight: 'var(--dp-font-weight-bold)',
                            '&:hover': {
                              backgroundColor: 'var(--dp-primary-600)',
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
            {selectedDate && (() => {
              const dayOfWeek = selectedDate.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <Typography
                  variant="caption"
                  sx={{
                    color: isWeekend ? 'var(--dp-error-600)' : 'var(--dp-neutral-600)',
                    mt: 'var(--dp-space-2)',
                    display: 'block',
                    fontWeight: isWeekend ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-regular)',
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-body-small)',
                  }}
                >
                  {isWeekend ? '⚠️ Weekend selected - will navigate to nearest Monday' : 'Selected:'} {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ padding: 'var(--dp-space-4) var(--dp-space-6)' }}>
            <Button
              onClick={() => setDatePickerOpen(false)}
              sx={{
                color: 'var(--dp-neutral-700)',
                textTransform: 'none',
                borderRadius: 'var(--dp-radius-lg)',
                padding: 'var(--dp-space-2) var(--dp-space-4)',
                fontFamily: 'var(--dp-font-family-primary)',
                fontSize: 'var(--dp-text-body-medium)',
                fontWeight: 'var(--dp-font-weight-medium)',
                '&:hover': {
                  backgroundColor: 'var(--dp-neutral-100)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedDate && onDirectDateNavigation) {
                  console.log('📅 Go to Date: Navigating to selected date:', selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

                  // Use direct navigation for all view types (already a business day due to onChange validation)
                  onDirectDateNavigation(selectedDate);
                }
                setDatePickerOpen(false);
              }}
              disabled={!selectedDate || !onDirectDateNavigation}
              sx={{
                backgroundColor: 'var(--dp-primary-500)',
                color: 'var(--dp-neutral-0)',
                textTransform: 'none',
                borderRadius: 'var(--dp-radius-lg)',
                padding: 'var(--dp-space-2) var(--dp-space-6)',
                fontFamily: 'var(--dp-font-family-primary)',
                fontSize: 'var(--dp-text-body-medium)',
                fontWeight: 'var(--dp-font-weight-semibold)',
                boxShadow: 'var(--dp-shadow-sm)',
                '&:hover': {
                  backgroundColor: 'var(--dp-primary-600)',
                  boxShadow: 'var(--dp-shadow-md)',
                },
                '&:disabled': {
                  backgroundColor: 'var(--dp-neutral-300)',
                  color: 'var(--dp-neutral-500)',
                  boxShadow: 'none',
                },
              }}
            >
              Go to Date
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </StyledAppBar>
  );
};

export default AppHeader;