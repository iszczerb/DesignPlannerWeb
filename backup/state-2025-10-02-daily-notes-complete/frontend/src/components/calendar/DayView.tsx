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

interface DayViewProps {
  initialDate?: Date;
  employeeId?: number;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  isReadOnly?: boolean;
  employeeFilter?: {
    employees: Array<{ id: number; name: string }>;
  };
}

const DayView: React.FC<DayViewProps> = ({
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
      const request: ScheduleRequestDto = {
        startDate: scheduleService.formatDateForApi(currentDate),
        viewType: CalendarViewType.Day,
        employeeId: selectedEmployeeId,
        includeInactive: false
      };

      const data = await scheduleService.getCalendarView(request);
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
      console.error('Error loading day view data:', err);
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
    // For day view, we don't change the view type, but we could trigger navigation
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
        backgroundColor: 'var(--dp-error-50)',
        border: '1px solid var(--dp-error-200)',
        borderRadius: '8px',
        margin: '16px',
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--dp-error-600)',
          marginBottom: '8px',
        }}>
          Failed to Load Day View
        </div>
        <div style={{
          color: 'var(--dp-error-700)',
          marginBottom: '16px',
        }}>
          {error}
        </div>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--dp-error-500)',
            color: 'var(--dp-neutral-0)',
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
      backgroundColor: 'var(--dp-neutral-25)',
    }}>
      <CalendarHeader
        currentDate={currentDate}
        viewType={CalendarViewType.Day}
        onDateChange={handleDateChange}
        onViewTypeChange={handleViewTypeChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        title="Daily Schedule"
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
            viewType={CalendarViewType.Day}
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
            backgroundColor: 'var(--dp-neutral-0)',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              textAlign: 'center',
              color: 'var(--dp-neutral-500)',
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
                    border: '3px solid var(--dp-neutral-200)',
                    borderTop: '3px solid var(--dp-primary-500)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div>Loading day schedule...</div>
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

export default DayView;