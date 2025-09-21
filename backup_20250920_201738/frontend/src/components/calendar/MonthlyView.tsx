import React, { useState, useEffect } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import { 
  CalendarViewType, 
  CalendarViewDto, 
  ScheduleRequestDto,
  AssignmentTaskDto,
  Slot
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';
import scheduleService from '../../services/scheduleService';

interface MonthlyViewProps {
  initialDate?: Date;
  employeeId?: number;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  isReadOnly?: boolean;
  employeeFilter?: {
    employees: Array<{ id: number; name: string }>;
  };
}

const MonthlyView: React.FC<MonthlyViewProps> = ({
  initialDate = new Date(),
  employeeId,
  onTaskClick,
  onSlotClick,
  isReadOnly = false,
  employeeFilter
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(employeeId);
  const [calendarData, setCalendarData] = useState<CalendarViewDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load calendar data
  const loadCalendarData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the month start date for the current date
      const monthStartDate = scheduleService.getViewStartDate(currentDate, CalendarViewType.Month);
      
      const request: ScheduleRequestDto = {
        startDate: scheduleService.formatDateForApi(monthStartDate),
        viewType: CalendarViewType.Month,
        employeeId: selectedEmployeeId,
        includeInactive: false
      };

      const data = await scheduleService.getCalendarView(request);
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
      console.error('Error loading monthly view data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when dependencies change
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, selectedEmployeeId]);

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewTypeChange = (viewType: CalendarViewType) => {
    // For monthly view, we don't change the view type, but we could trigger navigation
    // to parent component if needed
  };

  const handleEmployeeChange = (empId?: number) => {
    setSelectedEmployeeId(empId);
  };

  const handleRefresh = () => {
    loadCalendarData();
  };

  const handleTaskClick = (task: AssignmentTaskDto) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleSlotClick = (date: Date, slot: Slot, employeeId: number) => {
    if (!isReadOnly && onSlotClick) {
      onSlotClick(date, slot, employeeId);
    }
  };

  const handleTaskDrop = async (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => {
    if (isReadOnly) return;
    
    try {
      setIsLoading(true);
      
      // Move the assignment
      await scheduleService.moveAssignment(
        dragItem.task.assignmentId,
        targetEmployeeId,
        scheduleService.formatDateForApi(targetDate),
        targetSlot
      );
      
      // Refresh calendar data to show the changes
      await loadCalendarData();
      
    } catch (err) {
      console.error('Error moving task:', err);
      setError(err instanceof Error ? err.message : 'Failed to move task');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '16px',
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#dc2626',
          marginBottom: '8px',
        }}>
          Failed to Load Monthly View
        </div>
        <div style={{
          color: '#7f1d1d',
          marginBottom: '16px',
        }}>
          {error}
        </div>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8fafc',
    }}>
      <CalendarHeader
        currentDate={currentDate}
        viewType={CalendarViewType.Month}
        onDateChange={handleDateChange}
        onViewTypeChange={handleViewTypeChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Monthly Schedule"
        employeeFilter={employeeFilter ? {
          selectedEmployeeId,
          employees: employeeFilter.employees,
          onEmployeeChange: handleEmployeeChange
        } : undefined}
      />

      <div style={{
        flex: 1,
        padding: '16px',
        overflow: 'hidden',
      }}>
        {calendarData ? (
          <CalendarGrid
            calendarData={calendarData}
            viewType={CalendarViewType.Month}
            isLoading={isLoading}
            onTaskClick={handleTaskClick}
            onSlotClick={handleSlotClick}
            onRefresh={handleRefresh}
            onTaskDrop={handleTaskDrop}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
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
                  <div>Loading monthly schedule...</div>
                </div>
              ) : (
                'No schedule data available'
              )}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default MonthlyView;