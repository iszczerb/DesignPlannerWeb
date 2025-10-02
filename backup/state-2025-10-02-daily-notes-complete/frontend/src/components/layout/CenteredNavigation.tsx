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
  gap: 'var(--dp-space-4)',
  padding: 'var(--dp-space-2) var(--dp-space-4)',
  backgroundColor: 'var(--dp-neutral-0)',
  borderBottom: '1px solid var(--dp-neutral-200)',
  minHeight: '60px',
  fontFamily: 'var(--dp-font-family-primary)',
}));

const DateDisplay = styled(Typography)(({ theme }) => ({
  fontSize: 'var(--dp-text-body-large)',
  fontWeight: 'var(--dp-font-weight-semibold)',
  fontFamily: 'var(--dp-font-family-primary)',
  color: 'var(--dp-neutral-800)',
  minWidth: '180px',
  textAlign: 'center',
}));

const ViewToggleGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 'var(--dp-space-1)',
  backgroundColor: 'var(--dp-neutral-100)',
  borderRadius: 'var(--dp-radius-md)',
  padding: 'var(--dp-space-1)',
}));

const ViewButton = styled(Button)<{ isActive?: boolean }>(({ theme, isActive }) => ({
  color: isActive ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-500)',
  backgroundColor: isActive ? 'var(--dp-primary-500)' : 'transparent',
  fontWeight: 'var(--dp-font-weight-medium)',
  fontSize: 'var(--dp-text-body-medium)',
  fontFamily: 'var(--dp-font-family-primary)',
  textTransform: 'none',
  borderRadius: 'var(--dp-radius-sm)',
  padding: 'var(--dp-space-2) var(--dp-space-3)',
  minWidth: '70px',
  transition: 'var(--dp-transition-fast)',
  '&:hover': {
    backgroundColor: isActive ? 'var(--dp-primary-600)' : 'var(--dp-neutral-200)',
    color: isActive ? 'var(--dp-neutral-0)' : 'var(--dp-neutral-700)',
  },
}));

const ArrowButton = styled(IconButton)(({ theme }) => ({
  color: 'var(--dp-neutral-500)',
  backgroundColor: 'var(--dp-neutral-50)',
  border: '1px solid var(--dp-neutral-300)',
  borderRadius: 'var(--dp-radius-sm)',
  width: '36px',
  height: '36px',
  transition: 'var(--dp-transition-fast)',
  '&:hover': {
    backgroundColor: 'var(--dp-neutral-100)',
    borderColor: 'var(--dp-neutral-400)',
    color: 'var(--dp-neutral-600)',
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