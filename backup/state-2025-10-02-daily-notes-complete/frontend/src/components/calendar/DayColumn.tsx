import React from 'react';
import { CalendarDayDto, EmployeeCalendarDto, AssignmentTaskDto, Slot } from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';

interface DayColumnProps {
  day: CalendarDayDto;
  employees: EmployeeCalendarDto[];
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  onTaskPaste?: (date: Date, slot: Slot, employeeId: number) => void;
  hasCopiedTask?: boolean;
  isReadOnly?: boolean;
}

const DayColumn: React.FC<DayColumnProps> = ({
  day,
  employees,
  onTaskClick,
  onSlotClick,
  onTaskDrop,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  onTaskPaste,
  hasCopiedTask = false,
  isReadOnly = false
}) => {
  const getDayColumnStyle = (): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: '300px',
    borderRight: '1px solid #e5e7eb',
  });

  const getDayHeaderStyle = (): React.CSSProperties => ({
    padding: '12px 8px',
    backgroundColor: day.isToday ? 'var(--dp-primary-600)' : 'var(--dp-neutral-800)',
    color: 'white',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--dp-neutral-200)',
    boxShadow: day.isToday ? '0 2px 8px rgba(14, 165, 233, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    fontFamily: 'var(--dp-font-family-primary)',
  });

  const getDayNameStyle = (): React.CSSProperties => ({
    fontSize: 'var(--dp-text-body-large)',
    fontWeight: 'var(--dp-font-weight-bold)',
    lineHeight: 'var(--dp-line-height-tight)',
    letterSpacing: '-0.01em',
    fontFamily: 'var(--dp-font-family-primary)',
  });

  const getTimeSlotContainerStyle = (isAM: boolean): React.CSSProperties => ({
    minHeight: '120px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  });

  const getTimeSlotLabelStyle = (isAM: boolean): React.CSSProperties => {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

    let backgroundColor: string;
    if (isDarkTheme) {
      // Dark theme: AM should be slightly lighter than PM
      backgroundColor = isAM ? 'var(--dp-neutral-50)' : 'var(--dp-neutral-0)';
    } else {
      // Light theme: AM darker grey, PM even darker grey
      backgroundColor = isAM ? 'var(--dp-neutral-100)' : 'var(--dp-neutral-200)';
    }

    return {
      position: 'absolute',
      top: '8px',
      left: '8px',
      fontSize: 'var(--dp-text-body-small)',
      fontWeight: 'var(--dp-font-weight-bold)',
      color: 'var(--dp-neutral-700)',
      backgroundColor,
      padding: '4px 10px',
      borderRadius: 'var(--dp-radius-md)',
      zIndex: 5,
      letterSpacing: '-0.005em',
      fontFamily: 'var(--dp-font-family-primary)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    };
  };

  const getTasksContainerStyle = (): React.CSSProperties => ({
    padding: '24px 8px 8px 8px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'flex-start',
    minHeight: '96px',
  });

  // Collect all tasks for a specific time slot (AM or PM) from all employees
  const getAllTasksForSlot = (isAM: boolean) => {
    const dateObj = new Date(day.date);
    const allTasks: AssignmentTaskDto[] = [];

    employees.forEach(employee => {
      const dayAssignment = employee.dayAssignments.find(
        assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
      );

      if (dayAssignment) {
        const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
        if (slotData && slotData.tasks) {
          allTasks.push(...slotData.tasks);
        }
      }
    });

    return allTasks;
  };

  const getTaskCardStyle = (task: AssignmentTaskDto): React.CSSProperties => {
    return {
      backgroundColor: task.clientColor || '#f8f9fa',
      color: '#ffffff',
      padding: '6px 8px',
      borderRadius: '6px',
      fontSize: '0.6875rem',
      fontWeight: '500',
      cursor: 'pointer',
      minWidth: '120px',
      maxWidth: '140px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    };
  };

  const renderTaskCard = (task: AssignmentTaskDto) => (
    <div
      key={task.assignmentId}
      style={getTaskCardStyle(task)}
      onClick={() => onTaskClick?.(task)}
    >
      <div style={{ fontWeight: '600', fontSize: '0.7rem' }}>
        {task.projectName || 'TASK'}
      </div>
      <div style={{ fontSize: '0.6rem', opacity: 0.9 }}>
        {task.clientName || 'CLIENT'}
      </div>
      <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
        {task.taskName}
      </div>
    </div>
  );

  const amTasks = getAllTasksForSlot(true);
  const pmTasks = getAllTasksForSlot(false);

  return (
    <div style={getDayColumnStyle()}>
      {/* Day Header */}
      <div style={getDayHeaderStyle()}>
        <div style={getDayNameStyle()}>
          {day.dayName} {day.displayDate}
          {day.isToday && (
            <span style={{ fontSize: 'var(--dp-text-body-small)', fontWeight: 'var(--dp-font-weight-regular)' }}>
              {' '}(Today)
            </span>
          )}
        </div>
      </div>

      {/* AM Section */}
      <div style={getTimeSlotContainerStyle(true)}>
        <div style={getTimeSlotLabelStyle(true)}>AM</div>
        <div style={getTasksContainerStyle()}>
          {amTasks.length > 0 ? (
            amTasks.map(task => renderTaskCard(task))
          ) : (
            <div 
              style={{ 
                color: '#9ca3af',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                padding: '8px'
              }}
            >
              No tasks scheduled
            </div>
          )}
        </div>
      </div>

      {/* PM Section */}
      <div style={getTimeSlotContainerStyle(false)}>
        <div style={getTimeSlotLabelStyle(false)}>PM</div>
        <div style={getTasksContainerStyle()}>
          {pmTasks.length > 0 ? (
            pmTasks.map(task => renderTaskCard(task))
          ) : (
            <div 
              style={{ 
                color: '#9ca3af',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                padding: '8px'
              }}
            >
              No tasks scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayColumn;