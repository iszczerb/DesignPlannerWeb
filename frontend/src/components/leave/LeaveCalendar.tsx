import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isWeekend
} from 'date-fns';
import { 
  leaveService,
  LeaveRequest,
  LeaveType,
  LeaveStatus
} from '../../services/leaveService';

interface LeaveCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  showOnlyApproved?: boolean;
  employeeFilter?: number[]; // Array of employee IDs to filter by
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  leaveRequests: LeaveRequest[];
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  selectedDate = new Date(),
  onDateSelect,
  showOnlyApproved = false,
  employeeFilter
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate calendar days for the current month view
  const generateCalendarDays = (): CalendarDay[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days: CalendarDay[] = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      const dayLeaveRequests = leaveRequests.filter(request => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        return day >= requestStart && day <= requestEnd;
      });

      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, currentDate),
        leaveRequests: dayLeaveRequests
      });
      
      day = addDays(day, 1);
    }
    
    return days;
  };

  // Load leave requests for the current month view
  useEffect(() => {
    loadLeaveRequests();
  }, [currentDate, showOnlyApproved, employeeFilter]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      const requests = await leaveService.getLeaveRequestsForDateRange(
        format(calendarStart, 'yyyy-MM-dd'),
        format(calendarEnd, 'yyyy-MM-dd')
      );
      
      // Filter requests based on props
      let filteredRequests = requests;
      
      if (showOnlyApproved) {
        filteredRequests = filteredRequests.filter(req => req.status === LeaveStatus.Approved);
      }
      
      if (employeeFilter && employeeFilter.length > 0) {
        filteredRequests = filteredRequests.filter(req => employeeFilter.includes(req.employeeId));
      }
      
      setLeaveRequests(filteredRequests);
      
    } catch (error) {
      console.error('Error loading leave requests:', error);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getLeaveTypeColor = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.Annual:
        return '#2196f3'; // Blue
      case LeaveType.Sick:
        return '#ff9800'; // Orange
      case LeaveType.Training:
        return '#4caf50'; // Green
      default:
        return '#9e9e9e'; // Gray
    }
  };

  const getLeaveTypeLabel = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.Annual:
        return 'Annual';
      case LeaveType.Sick:
        return 'Sick';
      case LeaveType.Training:
        return 'Training';
      default:
        return 'Leave';
    }
  };

  const getStatusOpacity = (status: LeaveStatus): number => {
    switch (status) {
      case LeaveStatus.Approved:
        return 1.0;
      case LeaveStatus.Pending:
        return 0.6;
      case LeaveStatus.Rejected:
        return 0.3;
      default:
        return 0.5;
    }
  };

  const renderLeaveIndicators = (day: CalendarDay) => {
    if (day.leaveRequests.length === 0) return null;

    // Group by employee and leave type
    const grouped = day.leaveRequests.reduce((acc, request) => {
      const key = `${request.employeeId}-${request.leaveType}`;
      if (!acc[key]) {
        acc[key] = {
          employee: request.employeeName,
          type: request.leaveType,
          status: request.status,
          requests: []
        };
      }
      acc[key].requests.push(request);
      return acc;
    }, {} as Record<string, any>);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
        {Object.values(grouped).slice(0, 3).map((group: any, index) => (
          <Tooltip 
            key={index}
            title={`${group.employee} - ${getLeaveTypeLabel(group.type)} (${group.status === LeaveStatus.Pending ? 'Pending' : group.status === LeaveStatus.Approved ? 'Approved' : 'Rejected'})`}
          >
            <Box
              sx={{
                height: 4,
                backgroundColor: getLeaveTypeColor(group.type),
                opacity: getStatusOpacity(group.status),
                borderRadius: 0.5,
                cursor: 'pointer'
              }}
            />
          </Tooltip>
        ))}
        {Object.values(grouped).length > 3 && (
          <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
            +{Object.values(grouped).length - 3} more
          </Typography>
        )}
      </Box>
    );
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Calendar Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Box>
            <IconButton onClick={handlePreviousMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <IconButton onClick={handleToday} size="small" color="primary">
              <TodayIcon />
            </IconButton>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Calendar Grid */}
        <Paper variant="outlined">
          {/* Week Day Headers */}
          <Grid container>
            {weekDays.map((day) => (
              <Grid item xs key={day} sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                py: 1, 
                borderBottom: 1, 
                borderColor: 'divider',
                backgroundColor: 'grey.50'
              }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days */}
          <Box>
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
              <Grid container key={weekIndex}>
                {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <Grid 
                    item 
                    xs 
                    key={dayIndex}
                    sx={{
                      height: 80,
                      borderRight: dayIndex < 6 ? 1 : 0,
                      borderBottom: weekIndex < Math.ceil(calendarDays.length / 7) - 1 ? 1 : 0,
                      borderColor: 'divider',
                      cursor: onDateSelect ? 'pointer' : 'default',
                      backgroundColor: 
                        isSameDay(day.date, selectedDate) ? 'primary.light' :
                        isToday(day.date) ? 'action.selected' :
                        isWeekend(day.date) ? 'grey.50' :
                        'background.paper',
                      '&:hover': onDateSelect ? {
                        backgroundColor: 'action.hover'
                      } : {}
                    }}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <Box sx={{ p: 0.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: day.isCurrentMonth ? 'text.primary' : 'text.disabled',
                          fontWeight: isToday(day.date) ? 'bold' : 'normal'
                        }}
                      >
                        {format(day.date, 'd')}
                      </Typography>
                      
                      {renderLeaveIndicators(day)}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Box>
        </Paper>

        {/* Legend */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            size="small" 
            label="Annual Leave"
            sx={{ backgroundColor: getLeaveTypeColor(LeaveType.Annual), color: 'white' }}
          />
          <Chip 
            size="small" 
            label="Sick Leave"
            sx={{ backgroundColor: getLeaveTypeColor(LeaveType.Sick), color: 'white' }}
          />
          <Chip 
            size="small" 
            label="Training Leave"
            sx={{ backgroundColor: getLeaveTypeColor(LeaveType.Training), color: 'white' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Faded colors indicate pending approval
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeaveCalendar;