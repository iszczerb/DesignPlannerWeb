import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  styled
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

interface CenteredNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  currentViewType: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
  onViewTypeChange: (viewType: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly') => void;
}

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  minHeight: '60px',
}));

const DateDisplay = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1f2937',
  minWidth: '180px',
  textAlign: 'center',
}));

const ViewToggleGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '2px',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '2px',
}));

const ViewButton = styled(Button)<{ isActive?: boolean }>(({ theme, isActive }) => ({
  color: isActive ? '#ffffff' : '#6b7280',
  backgroundColor: isActive ? '#3b82f6' : 'transparent',
  fontWeight: '500',
  fontSize: '0.875rem',
  textTransform: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  minWidth: '70px',
  '&:hover': {
    backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
    color: isActive ? '#ffffff' : '#374151',
  },
}));

const ArrowButton = styled(IconButton)(({ theme }) => ({
  color: '#6b7280',
  backgroundColor: '#f9fafb',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '36px',
  height: '36px',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
}));

const CenteredNavigation: React.FC<CenteredNavigationProps> = ({
  currentDate,
  onDateChange,
  currentViewType,
  onViewTypeChange
}) => {
  const viewTypes: ('Daily' | 'Weekly' | 'Biweekly' | 'Monthly')[] = ['Daily', 'Weekly', 'Biweekly', 'Monthly'];
  
  const formatDateDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getNextWeekday = (date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    // Skip weekends
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  };

  const getPreviousWeekday = (date: Date): Date => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    // Skip weekends
    while (prevDay.getDay() === 0 || prevDay.getDay() === 6) {
      prevDay.setDate(prevDay.getDate() - 1);
    }
    return prevDay;
  };

  const handlePrevious = () => {
    let newDate: Date;
    
    switch (currentViewType) {
      case 'Daily':
        newDate = getPreviousWeekday(currentDate);
        break;
      case 'Weekly':
        newDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Biweekly':
        newDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'Monthly':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        break;
      default:
        newDate = currentDate;
    }
    
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    
    switch (currentViewType) {
      case 'Daily':
        newDate = getNextWeekday(currentDate);
        break;
      case 'Weekly':
        newDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Biweekly':
        newDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'Monthly':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        break;
      default:
        newDate = currentDate;
    }
    
    onDateChange(newDate);
  };

  return (
    <NavigationContainer>
      {/* Previous Arrow */}
      <ArrowButton onClick={handlePrevious} size="small">
        <ChevronLeftIcon fontSize="small" />
      </ArrowButton>

      {/* Date Display */}
      <DateDisplay>
        {formatDateDisplay(currentDate)}
      </DateDisplay>

      {/* View Type Toggle */}
      <ViewToggleGroup>
        {viewTypes.map((viewType) => (
          <ViewButton
            key={viewType}
            isActive={currentViewType === viewType}
            onClick={() => onViewTypeChange(viewType)}
          >
            {viewType}
          </ViewButton>
        ))}
      </ViewToggleGroup>

      {/* Next Arrow */}
      <ArrowButton onClick={handleNext} size="small">
        <ChevronRightIcon fontSize="small" />
      </ArrowButton>
    </NavigationContainer>
  );
};

export default CenteredNavigation;