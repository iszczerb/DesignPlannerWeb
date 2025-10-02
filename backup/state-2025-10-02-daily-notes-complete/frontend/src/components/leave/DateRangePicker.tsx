import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isWeekend, addDays, isBefore, isAfter } from 'date-fns';
import { leaveService } from '../../services/leaveService';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  isStartDateAM: boolean;
  isEndDateAM: boolean;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onStartAMPMChange: (isAM: boolean) => void;
  onEndAMPMChange: (isAM: boolean) => void;
  onLeaveDaysChange: (days: number) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  isStartDateAM,
  isEndDateAM,
  onStartDateChange,
  onEndDateChange,
  onStartAMPMChange,
  onEndAMPMChange,
  onLeaveDaysChange,
  disabled = false,
  minDate,
  maxDate
}) => {
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Calculate leave days whenever dates or AM/PM selection changes
  useEffect(() => {
    if (startDate && endDate) {
      calculateLeaveDays();
      checkForConflicts();
    } else {
      setCalculatedDays(0);
      onLeaveDaysChange(0);
      setHasConflict(false);
      setConflictError(null);
    }
  }, [startDate, endDate, isStartDateAM, isEndDateAM]);

  const calculateLeaveDays = async () => {
    if (!startDate || !endDate) return;

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const days = await leaveService.calculateLeaveDays({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        isStartDateAM: isStartDateAM,
        isEndDateAM: isEndDateAM
      });
      
      setCalculatedDays(days);
      onLeaveDaysChange(days);
    } catch (error) {
      console.error('Error calculating leave days:', error);
      setCalculationError('Failed to calculate leave days');
      setCalculatedDays(0);
      onLeaveDaysChange(0);
    } finally {
      setIsCalculating(false);
    }
  };

  const checkForConflicts = async () => {
    if (!startDate || !endDate) return;

    try {
      const conflict = await leaveService.checkLeaveConflict({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      setHasConflict(conflict);
      setConflictError(conflict ? 'You already have leave booked for some of these dates' : null);
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      // Don't show conflict errors as they're not critical
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange(date);
    
    // If end date is before start date, clear it
    if (date && endDate && isBefore(endDate, date)) {
      onEndDateChange(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange(date);
  };

  const isWeekendDate = (date: Date) => {
    return isWeekend(date);
  };

  const shouldDisableDate = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return isWeekendDate(date);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    
    if (startDate.getTime() === endDate.getTime()) {
      // Same day
      const timeLabel = isStartDateAM && isEndDateAM 
        ? ' (AM only)' 
        : !isStartDateAM && !isEndDateAM 
        ? ' (PM only)' 
        : ' (Full day)';
      return format(startDate, 'MMM dd, yyyy') + timeLabel;
    } else {
      // Date range
      const startLabel = isStartDateAM ? ' (from AM)' : ' (from PM)';
      const endLabel = isEndDateAM ? ' (until AM)' : ' (until PM)';
      return format(startDate, 'MMM dd') + startLabel + ' - ' + format(endDate, 'MMM dd, yyyy') + endLabel;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Grid container spacing={3}>
          {/* Start Date */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              disabled={disabled}
              shouldDisableDate={shouldDisableDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: hasConflict && !!startDate,
                  helperText: isWeekendDate(startDate || new Date()) 
                    ? 'Weekends are excluded from leave calculations' 
                    : undefined
                }
              }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              disabled={disabled || !startDate}
              shouldDisableDate={shouldDisableDate}
              minDate={startDate || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: hasConflict && !!endDate,
                  helperText: isWeekendDate(endDate || new Date()) 
                    ? 'Weekends are excluded from leave calculations' 
                    : undefined
                }
              }}
            />
          </Grid>

          {/* Start Date AM/PM Selection */}
          {startDate && (
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" disabled={disabled}>
                <FormLabel component="legend">
                  Start: {format(startDate, 'MMM dd, yyyy')}
                </FormLabel>
                <RadioGroup
                  row
                  value={isStartDateAM ? 'am' : 'pm'}
                  onChange={(e) => onStartAMPMChange(e.target.value === 'am')}
                >
                  <FormControlLabel
                    value="am"
                    control={<Radio size="small" />}
                    label="From AM"
                  />
                  <FormControlLabel
                    value="pm"
                    control={<Radio size="small" />}
                    label="From PM"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* End Date AM/PM Selection */}
          {endDate && startDate && endDate.getTime() !== startDate.getTime() && (
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" disabled={disabled}>
                <FormLabel component="legend">
                  End: {format(endDate, 'MMM dd, yyyy')}
                </FormLabel>
                <RadioGroup
                  row
                  value={isEndDateAM ? 'am' : 'pm'}
                  onChange={(e) => onEndAMPMChange(e.target.value === 'am')}
                >
                  <FormControlLabel
                    value="am"
                    control={<Radio size="small" />}
                    label="Until AM"
                  />
                  <FormControlLabel
                    value="pm"
                    control={<Radio size="small" />}
                    label="Until PM"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* Single Day AM/PM Selection */}
          {startDate && endDate && startDate.getTime() === endDate.getTime() && (
            <Grid item xs={12}>
              <FormControl component="fieldset" disabled={disabled}>
                <FormLabel component="legend">
                  {format(startDate, 'MMM dd, yyyy')} - Select Time
                </FormLabel>
                <RadioGroup
                  row
                  value={isStartDateAM && isEndDateAM ? 'am' : !isStartDateAM && !isEndDateAM ? 'pm' : 'full'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'am') {
                      onStartAMPMChange(true);
                      onEndAMPMChange(true);
                    } else if (value === 'pm') {
                      onStartAMPMChange(false);
                      onEndAMPMChange(false);
                    } else {
                      onStartAMPMChange(true);
                      onEndAMPMChange(false);
                    }
                  }}
                >
                  <FormControlLabel
                    value="am"
                    control={<Radio size="small" />}
                    label="AM Only"
                  />
                  <FormControlLabel
                    value="pm"
                    control={<Radio size="small" />}
                    label="PM Only"
                  />
                  <FormControlLabel
                    value="full"
                    control={<Radio size="small" />}
                    label="Full Day"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {/* Summary Card */}
        {startDate && endDate && (
          <Card sx={{ mt: 2, backgroundColor: hasConflict ? 'error.light' : 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Leave Request Summary
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Dates:</strong> {formatDateRange()}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1">
                  <strong>Days Requested:</strong>
                </Typography>
                {isCalculating ? (
                  <Chip label="Calculating..." size="small" />
                ) : (
                  <Chip 
                    label={`${calculatedDays} day${calculatedDays !== 1 ? 's' : ''}`}
                    color={hasConflict ? 'error' : 'primary'}
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Error Messages */}
        {calculationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {calculationError}
          </Alert>
        )}

        {conflictError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {conflictError}
          </Alert>
        )}

        {/* Weekend Warning */}
        {(startDate && isWeekendDate(startDate)) || (endDate && isWeekendDate(endDate)) ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Weekends are automatically excluded from leave calculations.
          </Alert>
        ) : null}
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;