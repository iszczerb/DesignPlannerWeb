import React, { useState, useEffect, useRef } from 'react';
import CompactTaskCard from './CompactTaskCard';
import {
  CalendarViewDto,
  AssignmentTaskDto,
  Slot,
  EmployeeScheduleDto,
  CalendarDayDto,
  DayAssignmentDto
} from '../../types/schedule';

interface MonthlyCalendarGridProps {
  calendarData: CalendarViewDto;
  isLoading?: boolean;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
  selectedEmployeeId?: number;
  onDateChange?: (date: Date) => void;
  employeeFilter?: {
    employees: Array<{ id: number; name: string }>;
    onEmployeeChange: (empId?: number) => void;
  };
}

interface CalendarDayData {
  date: string; // Full date string like "2024-09-15"
  dayNumber: number; // Day of month (1-31)
  dayName: string; // "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ONLY
  isToday: boolean;
  amTasks: AssignmentTaskDto[];
  pmTasks: AssignmentTaskDto[];
}

const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  calendarData,
  isLoading = false,
  onTaskClick,
  onRefresh,
  isReadOnly = false,
  selectedEmployeeId,
  onDateChange,
  employeeFilter
}) => {
  // DEBUG: Log the data being received
  console.log('🗓️ MonthlyCalendarGrid received data:', {
    calendarData,
    days: calendarData?.days?.length,
    employees: calendarData?.employees?.length,
    selectedEmployeeId,
    isLoading,
    firstDay: calendarData?.days?.[0],
    firstEmployee: calendarData?.employees?.[0],
    hasValidData: !!(calendarData?.days && calendarData?.employees)
  });

  // DEBUG: Check if employees have any tasks
  const totalTasks = calendarData?.employees?.reduce((total, emp) => {
    return total + emp.dayAssignments.reduce((dayTotal, day) => {
      const morningTasks = day.morningSlot?.tasks?.length || 0;
      const afternoonTasks = day.afternoonSlot?.tasks?.length || 0;
      return dayTotal + morningTasks + afternoonTasks;
    }, 0);
  }, 0) || 0;

  console.log('🗓️ Total tasks found in employee data:', totalTasks);

  if (calendarData?.employees && calendarData.employees.length > 0) {
    console.log('🗓️ First employee day assignments:', calendarData.employees[0].dayAssignments.slice(0, 3));
  }

  // State for hover effects
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);

  // State for selected employee filter (now supports multiple employees)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(selectedEmployeeId ? [selectedEmployeeId] : []);

  // State for month picker
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close month picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  // Get current month and year from calendar data
  const getCurrentDate = (): Date => {
    if (calendarData?.startDate) {
      return new Date(calendarData.startDate);
    }
    return new Date();
  };

  // Handle month selection
  const handleMonthChange = (month: number, year: number) => {
    if (onDateChange) {
      const newDate = new Date(year, month, 1);

      // Ensure we land on a business day
      const dayOfWeek = newDate.getDay();
      if (dayOfWeek === 0) { // Sunday
        newDate.setDate(newDate.getDate() + 1);
      } else if (dayOfWeek === 6) { // Saturday
        newDate.setDate(newDate.getDate() + 2);
      }

      onDateChange(newDate);
    }
    setShowMonthPicker(false);
  };

  // Generate month picker options
  const generateMonthPickerOptions = () => {
    const currentDate = getCurrentDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      years.push(year);
    }

    return { months, years, currentMonth, currentYear };
  };

  // Generate a complete weekdays-only monthly calendar
  const generateMonthlyCalendar = (): CalendarDayData[] => {
    console.log('🗓️ GENERATING COMPLETE MONTHLY WEEKDAYS CALENDAR');

    if (!calendarData?.days || calendarData.days.length === 0) {
      console.log('❌ No days data available');
      return [];
    }

    // Get the month and year from the first day in calendarData
    const firstDay = new Date(calendarData.days[0].date);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth(); // 0-based month

    console.log('📅 Generating calendar for:', year, 'month:', month + 1);

    // Generate ALL weekdays (Mon-Fri) for the entire month
    const weekdaysInMonth: CalendarDayData[] = [];
    const today = new Date();

    // Filter employees if specific employees are selected
    const filteredEmployees = selectedEmployeeIds.length > 0
      ? (calendarData.employees || []).filter(emp => selectedEmployeeIds.includes(emp.employeeId))
      : (calendarData.employees || []);

    console.log(`🔍 FILTERING: selectedEmployeeIds=${selectedEmployeeIds.join(',')}, filteredEmployees=${filteredEmployees.length}`);

    // Create task lookup map from backend data
    const taskMap = new Map<string, {amTasks: AssignmentTaskDto[], pmTasks: AssignmentTaskDto[]}>();

    console.log('🔍 MONTHLY TASK MAPPING - Processing employees:', filteredEmployees.length);

    filteredEmployees.forEach(employee => {
      console.log(`👤 Processing employee: ${employee.employeeName} (${employee.employeeId})`);
      console.log(`📅 Day assignments:`, employee.dayAssignments.length);

      employee.dayAssignments.forEach(dayAssignment => {
        // Normalize the date format to YYYY-MM-DD (remove time part if present)
        const normalizedDate = dayAssignment.date.split('T')[0];
        const existing = taskMap.get(normalizedDate) || {amTasks: [], pmTasks: []};

        console.log(`📆 Processing day: ${dayAssignment.date} -> normalized: ${normalizedDate}`);
        console.log(`🌅 Morning slot tasks:`, dayAssignment.morningSlot?.tasks?.length || 0);
        console.log(`🌇 Afternoon slot tasks:`, dayAssignment.afternoonSlot?.tasks?.length || 0);

        if (dayAssignment.morningSlot?.tasks) {
          existing.amTasks.push(...dayAssignment.morningSlot.tasks);
          console.log(`✅ Added ${dayAssignment.morningSlot.tasks.length} AM tasks for ${normalizedDate}`);
        }
        if (dayAssignment.afternoonSlot?.tasks) {
          existing.pmTasks.push(...dayAssignment.afternoonSlot.tasks);
          console.log(`✅ Added ${dayAssignment.afternoonSlot.tasks.length} PM tasks for ${normalizedDate}`);
        }

        taskMap.set(normalizedDate, existing);
      });
    });

    console.log('🗂️ FINAL TASK MAP:', Object.fromEntries(taskMap.entries()));

    // Get the number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate all weekdays (Monday-Friday) for the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

      // Only include weekdays (Monday=1 through Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Use local date formatting to avoid UTC timezone shift
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const tasksForDay = taskMap.get(dateString) || {amTasks: [], pmTasks: []};

        console.log(`📊 Day ${day} (${dateString}) [${dayNames[dayOfWeek]}]: AM=${tasksForDay.amTasks.length}, PM=${tasksForDay.pmTasks.length} tasks`);
        console.log(`📊 Available dates in taskMap:`, Array.from(taskMap.keys()));

        // Determine if this is the business "today" - if actual today is weekend, use next Monday
        const getBusinessToday = (): Date => {
          const actualToday = new Date();
          const todayDayOfWeek = actualToday.getDay();

          // If today is weekend, return next Monday
          if (todayDayOfWeek === 0 || todayDayOfWeek === 6) {
            const nextMonday = new Date(actualToday);
            const daysUntilMonday = todayDayOfWeek === 0 ? 1 : 2; // Sunday: +1, Saturday: +2
            nextMonday.setDate(actualToday.getDate() + daysUntilMonday);
            return nextMonday;
          }

          // If today is a weekday, return today
          return actualToday;
        };

        const businessToday = getBusinessToday();
        const isBusinessToday = currentDate.toDateString() === businessToday.toDateString();

        weekdaysInMonth.push({
          date: dateString,
          dayNumber: day,
          dayName: dayNames[dayOfWeek],
          isToday: isBusinessToday,
          amTasks: tasksForDay.amTasks,
          pmTasks: tasksForDay.pmTasks
        });
      }
    }

    console.log('📊 Generated', weekdaysInMonth.length, 'weekdays for month');
    console.log('📊 First few days:', weekdaysInMonth.slice(0, 5).map(d => `${d.dayNumber} (${d.dayName})`));
    console.log('📊 Last few days:', weekdaysInMonth.slice(-5).map(d => `${d.dayNumber} (${d.dayName})`));

    return weekdaysInMonth;
  };

  const monthlyCalendarData = generateMonthlyCalendar();

  // DEBUG: Log the generated monthly calendar data
  console.log('🗓️ generateMonthlyCalendar returned:', {
    monthlyCalendarDataLength: monthlyCalendarData.length,
    monthlyCalendarData: monthlyCalendarData.slice(0, 3), // Show first 3 items
    hasData: monthlyCalendarData.length > 0
  });

  // DEBUG: Log all day names and dates
  console.log('🗓️ All day names:', monthlyCalendarData.map(d => d.dayName));
  console.log('🗓️ All dates:', monthlyCalendarData.map(d => `${d.dayNumber} (${d.date})`));

  // Generate calendar grid layout (weeks as rows, weekdays as columns)
  const generateWeeksGrid = (): CalendarDayData[][] => {
    if (monthlyCalendarData.length === 0) return [];

    const weeks: CalendarDayData[][] = [];
    let currentWeek: CalendarDayData[] = [];

    monthlyCalendarData.forEach((dayData, index) => {
      currentWeek.push(dayData);

      // Complete the week when we hit Friday OR when we have 5 days (Mon-Fri)
      if (dayData.dayName === 'Friday' || currentWeek.length === 5) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }

      // Handle last day if it doesn't complete a full week
      if (index === monthlyCalendarData.length - 1 && currentWeek.length > 0) {
        weeks.push([...currentWeek]);
      }
    });

    console.log('📅 Generated', weeks.length, 'weeks for calendar grid');
    return weeks;
  };

  const gridWeeks = generateWeeksGrid();

  // DEBUG: Log the grid weeks layout
  console.log('🗓️ generateGridLayout returned:', {
    gridWeeksLength: gridWeeks.length,
    gridWeeks: gridWeeks.map(week => ({
      weekLength: week.length,
      dayNames: week.map(day => day.dayName),
      dates: week.map(day => day.displayDate)
    })),
    hasWeeks: gridWeeks.length > 0
  });

  // DEBUG: Check first week details
  if (gridWeeks.length > 0) {
    console.log('🗓️ First week details:', gridWeeks[0]);
    console.log('🗓️ First day structure:', JSON.stringify(gridWeeks[0][0], null, 2));
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 5,
  };

  const headerCellStyle = (dayName: string): React.CSSProperties => {
    const isMonday = dayName === 'Monday';
    return {
      flex: 1,
      minWidth: 0,
      padding: '12px 8px',
      fontSize: '0.875rem',
      fontWeight: '700',
      color: '#374151',
      textAlign: 'center',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: isMonday ? '#d1d5db' : '#f1f5f9', // Monday darker
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const gridContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  };

  const weekRowStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    minHeight: '120px',
    borderBottom: '1px solid #e5e7eb',
  };

  const dayCellStyle = (dayData: DayTaskData): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: dayData.isToday ? '#f0f9ff' : '#ffffff',
    border: dayData.isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
  });

  const dateHeaderStyle = (isToday: boolean): React.CSSProperties => ({
    padding: '6px 8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: isToday ? '#ffffff' : '#374151',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: isToday ? '#3b82f6' : '#f9fafb',
    textAlign: 'center',
    flexShrink: 0,
    position: 'relative',
    transition: 'all 0.2s ease',
  });

  const slotStyle = (slotType: 'AM' | 'PM'): React.CSSProperties => ({
    flex: 1,
    padding: '6px',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '60px',
    maxHeight: '120px',
    position: 'relative',
    backgroundColor: slotType === 'AM' ? '#ffffff' : '#e6f3ff',
    borderBottom: slotType === 'AM' ? '1px solid #e5e7eb' : 'none',
  });

  const slotBackgroundTextStyle = (slotType: 'AM' | 'PM'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#9ca3af',
    opacity: 0.4,
    zIndex: 0,
    pointerEvents: 'none',
    userSelect: 'none',
  });

  const taskListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    zIndex: 1,
  };

  const moreTasksStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: '2px',
    textAlign: 'center',
  };

  // Render empty state - only if we don't have calendar data with days
  if (!calendarData || !calendarData.days || calendarData.days.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '1rem',
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div>Loading monthly view...</div>
            </div>
          ) : 'No schedule data available for this month'}
        </div>
      </div>
    );
  }

  // Calculate month stats
  const monthStats = React.useMemo(() => {
    const totalTasks = monthlyCalendarData.reduce((sum, day) => sum + day.amTasks.length + day.pmTasks.length, 0);

    // Calculate total hours
    const totalHours = monthlyCalendarData.reduce((sum, day) => {
      const dayHours = [...day.amTasks, ...day.pmTasks].reduce((daySum, task) => daySum + (task.hours || 0), 0);
      return sum + dayHours;
    }, 0);

    // Calculate total unique projects
    const allProjects = new Set();
    monthlyCalendarData.forEach(day => {
      [...day.amTasks, ...day.pmTasks].forEach(task => {
        if (task.projectName) allProjects.add(task.projectName);
      });
    });
    const totalProjects = allProjects.size;

    const totalEmployees = selectedEmployeeIds.length > 0
      ? selectedEmployeeIds.length  // If filtering by specific employees
      : (calendarData?.employees?.length || 0);  // All employees
    const workingDays = monthlyCalendarData.length;
    const averageTasksPerDay = workingDays > 0 ? (totalTasks / workingDays).toFixed(1) : '0';

    return {
      totalTasks,
      totalHours,
      totalProjects,
      totalEmployees,
      workingDays,
      averageTasksPerDay
    };
  }, [monthlyCalendarData, calendarData?.employees, selectedEmployeeIds]);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#f8fafc',
    }}>
      {/* Sidebar with filters and stats */}
      {employeeFilter && (
        <div style={{
          width: '280px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          padding: '16px',
          overflow: 'auto',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Month Header - Clickable */}
          <div
            ref={monthPickerRef}
            style={{
              marginBottom: '20px',
              position: 'relative',
            }}>
            <div
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              style={{
                padding: '16px',
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: '#2563eb',
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                {calendarData?.startDate ? new Date(calendarData.startDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }) : new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
                <span style={{
                  fontSize: '0.8rem',
                  opacity: 0.8,
                }}>
                  ▼
                </span>
              </h2>
            </div>

            {/* Month Picker Dropdown */}
            {showMonthPicker && (() => {
              const { months, years, currentMonth, currentYear } = generateMonthPickerOptions();
              return (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  padding: '16px',
                  marginTop: '4px',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                  }}>
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => handleMonthChange(index, currentYear)}
                        style={{
                          padding: '8px 4px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          backgroundColor: index === currentMonth ? '#3b82f6' : '#ffffff',
                          color: index === currentMonth ? '#ffffff' : '#374151',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (index !== currentMonth) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== currentMonth) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        {month.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}>
                    {/* Previous Year Arrow */}
                    <button
                      onClick={() => handleMonthChange(currentMonth, currentYear - 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      ‹
                    </button>

                    {/* Current Year Display */}
                    <div style={{
                      padding: '6px 16px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      minWidth: '60px',
                      textAlign: 'center',
                    }}>
                      {currentYear}
                    </div>

                    {/* Next Year Arrow */}
                    <button
                      onClick={() => handleMonthChange(currentMonth, currentYear + 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      ›
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Month Stats */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              margin: '0 0 12px 0',
            }}>Month Overview</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Tasks:</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{monthStats.totalTasks}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Hours:</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{monthStats.totalHours}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Projects:</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{monthStats.totalProjects}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Working Days:</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{monthStats.workingDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Tasks/Day:</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{monthStats.averageTasksPerDay}</span>
              </div>
            </div>
          </div>

          {/* Employee Filter */}
          <div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              margin: '0 0 12px 0',
            }}>Team Members</h3>

            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => {
                  console.log('🔄 FILTER: Selecting All Members');
                  setSelectedEmployeeIds([]);
                  employeeFilter.onEmployeeChange(undefined);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: selectedEmployeeIds.length === 0 ? '#3b82f6' : '#f9fafb',
                  color: selectedEmployeeIds.length === 0 ? '#ffffff' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textAlign: 'left',
                }}
              >
                All Members ({employeeFilter.employees.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {employeeFilter.employees.map(employee => {
                const isSelected = selectedEmployeeIds.includes(employee.id);
                return (
                  <div
                    key={employee.id}
                    onClick={() => {
                      const newSelectedIds = isSelected
                        ? selectedEmployeeIds.filter(id => id !== employee.id)
                        : [...selectedEmployeeIds, employee.id];
                      console.log(`🔄 FILTER: Toggling employee ${employee.name} (${employee.id}), new selection: [${newSelectedIds.join(',')}]`);
                      setSelectedEmployeeIds(newSelectedIds);
                      employeeFilter.onEmployeeChange(newSelectedIds.length === 1 ? newSelectedIds[0] : undefined);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: '2px solid ' + (isSelected ? '#0284c7' : '#d1d5db'),
                        backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                        marginRight: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#ffffff',
                            borderRadius: '1px',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ color: isSelected ? '#0284c7' : '#374151' }}>
                      {employee.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={containerStyle}>
          {/* Calendar Header */}
          <div style={headerStyle}>
            <div style={headerCellStyle('Monday')}>Monday</div>
            <div style={headerCellStyle('Tuesday')}>Tuesday</div>
            <div style={headerCellStyle('Wednesday')}>Wednesday</div>
            <div style={headerCellStyle('Thursday')}>Thursday</div>
            <div style={headerCellStyle('Friday')}>Friday</div>
          </div>

      {/* Calendar Grid */}
      <div style={gridContainerStyle}>
        {gridWeeks.map((week, weekIndex) => (
          <div key={weekIndex} style={weekRowStyle}>
            {/* Render 5 columns for Mon-Fri */}
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, dayIndex) => {
              const dayData = week.find(d => d.dayName === dayName);

              if (!dayData) {
                // Empty cell for days not in this month
                return (
                  <div key={`${weekIndex}-${dayIndex}`} style={{
                    flex: 1,
                    minWidth: 0,
                    borderRight: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }} />
                );
              }

              // Show all tasks with scroll functionality

              return (
                <div key={dayData.date} style={dayCellStyle(dayData)}>
                  {/* Date Header with day number */}
                  <div style={dateHeaderStyle(dayData.isToday)}>
                    {dayData.dayNumber}
                    {dayData.isToday && (
                      <span style={{
                        color: '#ffffff',
                        marginLeft: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>(Today)</span>
                    )}
                  </div>

                  {/* AM Slot */}
                  <div style={slotStyle('AM')} className="calendar-slot">
                    <div style={slotBackgroundTextStyle('AM')}>AM</div>
                    <div style={taskListStyle}>
                      {dayData.amTasks.map(task => (
                        <CompactTaskCard
                          key={task.assignmentId}
                          task={task}
                          onClick={onTaskClick}
                          isReadOnly={isReadOnly}
                        />
                      ))}
                    </div>
                  </div>

                  {/* PM Slot */}
                  <div style={slotStyle('PM')} className="calendar-slot">
                    <div style={slotBackgroundTextStyle('PM')}>PM</div>
                    <div style={taskListStyle}>
                      {dayData.pmTasks.map(task => (
                        <CompactTaskCard
                          key={task.assignmentId}
                          task={task}
                          onClick={onTaskClick}
                          isReadOnly={isReadOnly}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500',
            }}>
              Loading...
            </div>
          </div>
        </div>
      )}

          {/* CSS Animations */}
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }

              /* Subtle scrollbar styling for calendar slots */
              .calendar-slot {
                scrollbar-width: thin;
                scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
              }

              .calendar-slot::-webkit-scrollbar {
                width: 4px;
              }

              .calendar-slot::-webkit-scrollbar-track {
                background: transparent;
              }

              .calendar-slot::-webkit-scrollbar-thumb {
                background-color: rgba(155, 155, 155, 0.5);
                border-radius: 2px;
              }

              .calendar-slot::-webkit-scrollbar-thumb:hover {
                background-color: rgba(155, 155, 155, 0.7);
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendarGrid;