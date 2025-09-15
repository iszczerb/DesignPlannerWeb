import React, { useState, useRef, useEffect } from 'react';
import SimplifiedEmployeeRow from './SimplifiedEmployeeRow';
import {
  EmployeeCalendarDto,
  CalendarDayDto,
  AssignmentTaskDto,
  Slot,
  LeaveType,
  LeaveDuration,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_ICONS,
  LEAVE_TYPE_LABELS
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';

interface DayBasedCalendarGridProps {
  employees: EmployeeCalendarDto[];
  days: CalendarDayDto[];
  onTaskClick?: (task: AssignmentTaskDto, event?: React.MouseEvent) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  onTaskPaste?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskPasteMultiple?: () => void; // For multi-slot pasting
  onBulkEdit?: () => void; // For bulk editing multiple tasks
  onQuickEditTaskType?: (task: AssignmentTaskDto) => void;
  onQuickEditStatus?: (task: AssignmentTaskDto) => void;
  onQuickEditPriority?: (task: AssignmentTaskDto) => void;
  onQuickEditDueDate?: (task: AssignmentTaskDto) => void;
  onQuickEditNotes?: (task: AssignmentTaskDto) => void;
  onBulkDelete?: (taskIds: number[]) => void;
  hasCopiedTask?: boolean;
  isReadOnly?: boolean;
  onSetBankHoliday?: (date: Date) => void;
  onSetLeave?: (date: Date) => void;
  onClearBlocking?: (date: Date) => void;
  selectedTaskIds?: number[];
  selectedSlots?: Array<{ date: Date; slot: Slot; employeeId: number; }>;
  onSlotFocus?: (date: Date, slot: Slot, employeeId: number, event?: React.MouseEvent) => void;
  selectedDays?: string[]; // Array of date strings (toDateString() format)
  onDayClick?: (date: Date, event?: React.MouseEvent) => void;
}

const DayBasedCalendarGrid: React.FC<DayBasedCalendarGridProps> = ({
  employees,
  days,
  onTaskClick,
  onSlotClick,
  onTaskDrop,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  onTaskPaste,
  onTaskPasteMultiple,
  onBulkEdit,
  onQuickEditTaskType,
  onQuickEditStatus,
  onQuickEditPriority,
  onQuickEditDueDate,
  onQuickEditNotes,
  onBulkDelete,
  hasCopiedTask = false,
  isReadOnly = false,
  onSetBankHoliday,
  onSetLeave,
  onClearBlocking,
  selectedTaskIds = [],
  selectedSlots = [],
  onSlotFocus,
  selectedDays = [],
  onDayClick
}) => {
  // State management for hover and context menus
  const [hoveredSlot, setHoveredSlot] = useState<{
    employeeId: number;
    date: string;
    isAM: boolean;
  } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const [contextMenus, setContextMenus] = useState<NodeListOf<Element> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Cleanup context menus
  useEffect(() => {
    const handleClickOutside = () => {
      // Remove all existing context menus
      document.querySelectorAll('[data-context-menu]').forEach(menu => {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      handleClickOutside(); // Cleanup on unmount
    };
  }, []);

  // Helper function to create context menus with proper cleanup
  const createSlotContextMenu = (e: React.MouseEvent, employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove existing context menus
    document.querySelectorAll('[data-context-menu]').forEach(menu => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    });

    if (isReadOnly) return;

    const contextMenu = document.createElement('div');
    contextMenu.setAttribute('data-context-menu', 'true');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '6px';
    contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    contextMenu.style.zIndex = '10000';
    contextMenu.style.padding = '4px 0';
    contextMenu.style.fontSize = '14px';
    contextMenu.style.minWidth = '160px';

    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );
    const slotData = isAM ? dayAssignment?.morningSlot : dayAssignment?.afternoonSlot;
    const hasTasks = slotData?.tasks && slotData.tasks.length > 0;

    const menuItems = [
      {
        label: '➕ Create Task',
        action: () => onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
        enabled: !hasTasks || (slotData?.tasks?.length || 0) < 4
      },
      {
        label: '📋 Paste Task',
        action: () => handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
        enabled: hasCopiedTask && (!hasTasks || (slotData?.tasks?.length || 0) < 4)
      }
    ];

    menuItems.forEach(item => {
      if (!item.enabled) return;

      const menuItem = document.createElement('div');
      menuItem.textContent = item.label;
      menuItem.style.padding = '8px 16px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.transition = 'background-color 0.2s';

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f1f5f9';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
      });

      contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);
  };

  // Debug: Log when the component receives new days data
  // Get next weekday from today (skip weekends)
  const getNextWeekday = (date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    // If it's Saturday (6) or Sunday (0), move to Monday
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  };

  // Check if a date is today (ignoring weekends)
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const todayDay = today.getDay();
    
    // If today is weekend, consider next Monday as "today"
    const effectiveToday = (todayDay === 0 || todayDay === 6) ? getNextWeekday(today) : today;
    
    return date.toDateString() === effectiveToday.toDateString();
  };

  // Format day header text
  const formatDayHeader = (day: CalendarDayDto): string => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    if (isToday(date)) {
      return `${dayName} ${dayNumber} (Today)`;
    }
    return `${dayName} ${dayNumber}`;
  };
  // Helper functions for leave styling
  const hasLeaveInSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean): boolean => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    if (!dayAssignment) return false;

    // Check day-level leave (full day)
    if (dayAssignment.leave?.duration === LeaveDuration.FullDay) {
      return true;
    }

    // Check slot-level leave (half day)
    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    return !!slotData?.leave;
  };

  const getLeaveInfo = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    if (!dayAssignment) return null;

    // Check day-level leave first (full day)
    if (dayAssignment.leave?.duration === LeaveDuration.FullDay) {
      return dayAssignment.leave;
    }

    // Check slot-level leave (half day)
    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    return slotData?.leave || null;
  };

  const isHoliday = (employee: EmployeeCalendarDto, day: CalendarDayDto): boolean => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );
    return !!dayAssignment?.isHoliday;
  };

  // Color palette for task cards
  const getTaskColor = (taskId: number): string => {
    const colors = [
      '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4',
      '#f97316', '#84cc16', '#ec4899', '#6366f1', '#14b8a6'
    ];
    return colors[taskId % colors.length];
  };

  // Get darker border color for task cards
  const getTaskBorderColor = (taskId: number): string => {
    const borderColors = [
      '#b45309', '#047857', '#6d28d9', '#b91c1c', '#0e7490', 
      '#c2410c', '#4d7c0f', '#be185d', '#3730a3', '#0d9488'
    ];
    return borderColors[taskId % borderColors.length];
  };

  // Render leave slot with appropriate styling
  const renderLeaveSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const leaveInfo = getLeaveInfo(employee, day, isAM);
    if (!leaveInfo) return null;

    const backgroundColor = LEAVE_TYPE_COLORS[leaveInfo.leaveType];
    const icon = LEAVE_TYPE_ICONS[leaveInfo.leaveType];
    const label = LEAVE_TYPE_LABELS[leaveInfo.leaveType];
    const isFullDay = leaveInfo.duration === LeaveDuration.FullDay;
    const slotLabel = isFullDay ? 'Full Day' : (isAM ? 'Morning' : 'Afternoon');

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundColor + '20', // 20% opacity for background
          border: `2px solid ${backgroundColor}`,
          borderRadius: '6px',
          color: backgroundColor,
          fontWeight: '600',
          fontSize: '0.75rem',
          padding: '8px 4px',
          margin: '2px',
          textAlign: 'center',
          minHeight: '56px'
        }}
      >
        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{icon}</div>
        <div style={{ fontSize: '0.7rem', lineHeight: '1.1' }}>{label}</div>
        {!isFullDay && (
          <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{slotLabel}</div>
        )}
      </div>
    );
  };

  // Render holiday slot
  const renderHolidaySlot = (employee: EmployeeCalendarDto, day: CalendarDayDto) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    const holidayName = dayAssignment?.holidayName || 'Bank Holiday';

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2', // Light red background
          border: '2px solid #dc2626', // Red border
          borderRadius: '6px',
          color: '#dc2626',
          fontWeight: '600',
          fontSize: '0.75rem',
          padding: '8px 4px',
          margin: '2px',
          textAlign: 'center',
          minHeight: '56px'
        }}
      >
        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🏦</div>
        <div style={{ fontSize: '0.7rem', lineHeight: '1.1' }}>{holidayName}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>Holiday</div>
      </div>
    );
  };

  // Helper function to check if a slot is selected
  const isSlotSelected = (employeeId: number, date: Date, isAM: boolean): boolean => {
    return selectedSlots?.some(slot =>
      slot.employeeId === employeeId &&
      slot.date.toDateString() === date.toDateString() &&
      ((isAM && slot.slot === Slot.Morning) || (!isAM && slot.slot === Slot.Afternoon))
    ) || false;
  };

  // Helper function to check if a day is selected
  const isDaySelected = (date: Date): boolean => {
    return selectedDays?.includes(date.toDateString()) || false;
  };

  // Handle slot click with Ctrl detection for multi-select
  const handleSlotClick = (e: React.MouseEvent, employeeId: number, date: Date, isAM: boolean) => {
    e.stopPropagation();

    if (isReadOnly) return;

    // Pass the event to onSlotFocus for multi-selection handling
    onSlotFocus?.(date, isAM ? Slot.Morning : Slot.Afternoon, employeeId, e);
  };

  // Handle paste action - check if there are multiple selected slots
  const handlePasteAction = (date: Date, slot: Slot, employeeId: number) => {
    if (selectedSlots && selectedSlots.length > 0) {
      // Use multi-slot paste if there are selected slots
      onTaskPasteMultiple?.();
    } else {
      // Use single-slot paste for individual slot
      onTaskPaste?.(date, slot, employeeId);
    }
  };

  // Render task cards with proper styling and max 4 limit
  const renderTasksInSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    // Check for holiday first (takes precedence)
    if (isHoliday(employee, day)) {
      return renderHolidaySlot(employee, day);
    }

    // Check for leave
    if (hasLeaveInSlot(employee, day, isAM)) {
      return renderLeaveSlot(employee, day, isAM);
    }

    if (!dayAssignment) {
      const slotKey = `${employee.employeeId}-${day.date}-${isAM}`;
      const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                       hoveredSlot?.date === day.date &&
                       hoveredSlot?.isAM === isAM;
      const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
            cursor: isReadOnly ? 'default' : 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
            border: isSelected ? '3px solid #3b82f6' : 'none',
            borderRadius: '4px',
            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={(e) => handleSlotClick(e, employee.employeeId, dateObj, isAM)}
          onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
          onMouseEnter={() => !isReadOnly && setHoveredSlot({
            employeeId: employee.employeeId,
            date: day.date,
            isAM: isAM
          })}
          onMouseLeave={() => setHoveredSlot(null)}
          onDragOver={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }
          }}
          onDragLeave={(e) => {
            if (!isReadOnly) {
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
            }
          }}
          onDrop={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
              const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
              if (dragData && dragData.type === 'task') {
                onTaskDrop?.({
                  type: 'task',
                  task: dragData.task
                }, dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
              }
            }
          }}
        >
          {!isReadOnly ? (isAM ? 'AM' : 'PM') : ''}

          {/* Hover action buttons */}
          {isHovered && !isReadOnly && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '4px',
              padding: '2px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                title="Add task"
              >
                +
              </button>
              {hasCopiedTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Paste task"
                >
                  📋
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    
    if (!slotData || !slotData.tasks || slotData.tasks.length === 0) {
      const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                       hoveredSlot?.date === day.date &&
                       hoveredSlot?.isAM === isAM;
      const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
            cursor: isReadOnly ? 'default' : 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
            border: isSelected ? '3px solid #3b82f6' : 'none',
            borderRadius: '4px',
            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={(e) => handleSlotClick(e, employee.employeeId, dateObj, isAM)}
          onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
          onMouseEnter={() => !isReadOnly && setHoveredSlot({
            employeeId: employee.employeeId,
            date: day.date,
            isAM: isAM
          })}
          onMouseLeave={() => setHoveredSlot(null)}
          onDragOver={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }
          }}
          onDragLeave={(e) => {
            if (!isReadOnly) {
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
            }
          }}
          onDrop={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
              const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
              if (dragData && dragData.type === 'task') {
                onTaskDrop?.({
                  type: 'task',
                  task: dragData.task
                }, dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
              }
            }
          }}
        >
          {!isReadOnly ? (isAM ? 'AM' : 'PM') : ''}

          {/* Hover action buttons */}
          {isHovered && !isReadOnly && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '4px',
              padding: '2px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                title="Add task"
              >
                +
              </button>
              {hasCopiedTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Paste task"
                >
                  📋
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    // Limit to maximum 4 tasks per slot
    const tasksToShow = slotData.tasks.slice(0, 4);
    const hasMoreTasks = slotData.tasks.length > 4;
    const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                     hoveredSlot?.date === day.date &&
                     hoveredSlot?.isAM === isAM;
    const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '1px',
          padding: '1px',
          alignContent: 'center',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
          border: isSelected ? '3px solid #3b82f6' : 'none',
          borderRadius: '4px',
          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
        }}
        onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
        onMouseEnter={() => !isReadOnly && setHoveredSlot({
          employeeId: employee.employeeId,
          date: day.date,
          isAM: isAM
        })}
        onMouseLeave={() => setHoveredSlot(null)}
        onDragOver={(e) => {
          if (!isReadOnly && slotData.tasks.length < 4) {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = '#f0f9ff';
          }
        }}
        onDragLeave={(e) => {
          if (!isReadOnly) {
            e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
          }
        }}
        onDrop={(e) => {
          if (!isReadOnly && slotData.tasks.length < 4) {
            e.preventDefault();
            e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (dragData && dragData.type === 'task') {
              onTaskDrop?.({
                type: 'task',
                task: dragData.task
              }, dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
            }
          }
        }}>
        {tasksToShow.map((task) => (
          <div
            key={task.assignmentId}
            data-task-card="true"
            draggable={!isReadOnly}
            onDragStart={(e) => {
              if (!isReadOnly) {
                const dragData = {
                  type: 'task',
                  task: task
                };
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
              }
            }}
            onClick={(e) => onTaskClick?.(task, e)}
            onMouseEnter={() => setHoveredTask(task.assignmentId)}
            onMouseLeave={() => setHoveredTask(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation(); // CRITICAL: Prevent slot context menu from also opening

              // Remove existing context menus
              document.querySelectorAll('[data-context-menu]').forEach(menu => {
                if (document.body.contains(menu)) {
                  document.body.removeChild(menu);
                }
              });

              // Show context menu with Edit, Delete, View, Copy options
              const contextMenu = document.createElement('div');
              contextMenu.setAttribute('data-context-menu', 'true');
              contextMenu.style.position = 'fixed';
              contextMenu.style.left = e.clientX + 'px';
              contextMenu.style.top = e.clientY + 'px';
              contextMenu.style.backgroundColor = 'white';
              contextMenu.style.border = '1px solid #ccc';
              contextMenu.style.borderRadius = '6px';
              contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              contextMenu.style.zIndex = '10000';
              contextMenu.style.padding = '4px 0';
              contextMenu.style.fontSize = '14px';
              contextMenu.style.minWidth = '160px';

              // Check if this task is selected and if there are multiple selected tasks
              const isTaskSelected = selectedTaskIds.includes(task.assignmentId);
              const hasMultipleSelected = selectedTaskIds.length > 1;

              let menuItems = [];

              if (isTaskSelected && hasMultipleSelected) {
                // Show bulk operations for multiple selected tasks
                menuItems = [
                  {
                    label: `📝 Edit Task Type (${selectedTaskIds.length})`,
                    action: () => onQuickEditTaskType?.(task),
                    separator: false
                  },
                  {
                    label: `📊 Edit Status (${selectedTaskIds.length})`,
                    action: () => onQuickEditStatus?.(task),
                    separator: false
                  },
                  {
                    label: `🔥 Edit Priority (${selectedTaskIds.length})`,
                    action: () => onQuickEditPriority?.(task),
                    separator: false
                  },
                  {
                    label: `📅 Edit Due Date (${selectedTaskIds.length})`,
                    action: () => onQuickEditDueDate?.(task),
                    separator: false
                  },
                  {
                    label: `📝 Edit Notes (${selectedTaskIds.length})`,
                    action: () => onQuickEditNotes?.(task),
                    separator: true
                  },
                  {
                    label: `✏️ Full Edit (${selectedTaskIds.length})`,
                    action: () => onBulkEdit?.(),
                    separator: false
                  },
                  {
                    label: `🗑️ Delete Selected (${selectedTaskIds.length})`,
                    action: () => onBulkDelete?.(selectedTaskIds),
                    separator: true
                  },
                  {
                    label: 'View/Edit This One',
                    action: () => onTaskView?.(task),
                    separator: false
                  },
                  {
                    label: 'Copy This One',
                    action: () => onTaskCopy?.(task),
                    separator: false
                  }
                ];
              } else {
                // Show individual task operations
                menuItems = [
                  { label: '📝 Edit Task Type', action: () => onQuickEditTaskType?.(task), separator: false },
                  { label: '📊 Edit Status', action: () => onQuickEditStatus?.(task), separator: false },
                  { label: '🔥 Edit Priority', action: () => onQuickEditPriority?.(task), separator: false },
                  { label: '📅 Edit Due Date', action: () => onQuickEditDueDate?.(task), separator: false },
                  { label: '📝 Edit Notes', action: () => onQuickEditNotes?.(task), separator: true },
                  { label: '✏️ View/Edit', action: () => onTaskView?.(task), separator: false },
                  { label: '📋 Copy', action: () => onTaskCopy?.(task), separator: false },
                  { label: '🗑️ Delete', action: () => onTaskDelete?.(task.assignmentId), separator: false }
                ];
              }
              
              menuItems.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.padding = '8px 16px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.transition = 'background-color 0.2s';
                menuItem.onmouseenter = () => menuItem.style.backgroundColor = '#f1f5f9';
                menuItem.onmouseleave = () => menuItem.style.backgroundColor = 'transparent';
                menuItem.onclick = (e) => {
                  e.stopPropagation();
                  item.action();
                  // Use proper cleanup
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                };
                contextMenu.appendChild(menuItem);

                // Add separator if needed
                if (item.separator && index < menuItems.length - 1) {
                  const separator = document.createElement('div');
                  separator.style.height = '1px';
                  separator.style.backgroundColor = '#e5e7eb';
                  separator.style.margin = '4px 0';
                  contextMenu.appendChild(separator);
                }
              });
              
              document.body.appendChild(contextMenu);
              
              // Remove context menu when clicking elsewhere
              const removeMenu = (event: MouseEvent) => {
                if (!contextMenu.contains(event.target as Node)) {
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                  document.removeEventListener('click', removeMenu);
                }
              };
              setTimeout(() => document.addEventListener('click', removeMenu), 0);
            }}
            style={{
              backgroundColor: getTaskColor(task.taskId || 0),
              color: '#ffffff',
              border: selectedTaskIds.includes(task.assignmentId)
                ? '3px solid #3b82f6'
                : `2px solid ${getTaskBorderColor(task.taskId || 0)}`,
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontWeight: '500',
              cursor: isReadOnly ? 'pointer' : 'grab',
              display: 'flex',
              flexDirection: 'column',
              width: tasksToShow.length === 1 ? 'calc(100% - 4px)' :
                     tasksToShow.length === 2 ? 'calc(50% - 2px)' :
                     tasksToShow.length === 3 ? 'calc(33.33% - 2px)' :
                     'calc(25% - 2px)',
              height: '62px',
              boxShadow: selectedTaskIds.includes(task.assignmentId)
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : '0 1px 2px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
              transform: selectedTaskIds.includes(task.assignmentId) ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {/* Top colored section with project code */}
            <div style={{ 
              padding: '4px 8px 2px 8px',
              fontWeight: '600', 
              fontSize: '0.7rem',
              textAlign: 'center',
            }}>
              {task.projectCode || 'PROJ'}
            </div>
            <div style={{ 
              fontSize: '0.6rem', 
              opacity: 0.9,
              padding: '0 8px 4px 8px',
              textAlign: 'center',
            }}>
              {(task.clientName === 'Amazon Web Services' ? 'Amazon' : task.clientName) || 'CLIENT'}
            </div>
            
            {/* White bottom section with task type */}
            <div style={{
              backgroundColor: '#ffffff',
              color: '#374151',
              padding: '4px 2px',
              fontSize: tasksToShow.length === 4 ? '0.5rem' : '0.6rem',
              fontWeight: '500',
              textAlign: 'center',
              borderRadius: '0 0 6px 6px',
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1.1',
              minHeight: '16px'
            }}>
              {task.taskTypeName || task.taskName || 'Task'}
            </div>

            {/* Hover action icons for individual tasks */}
            {hoveredTask === task.assignmentId && !isReadOnly && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                display: 'flex',
                gap: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '4px',
                padding: '2px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                zIndex: 100
              }}>
                {/* Copy icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskCopy?.(task);
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Copy task"
                >
                  📋
                </button>

                {/* Edit icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskEdit?.(task);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Edit task"
                >
                  ✏️
                </button>

                {/* Delete icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskDelete?.(task.assignmentId);
                  }}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
        {hasMoreTasks && (
          <div style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            fontWeight: '500',
            padding: '2px 4px',
            alignSelf: 'center'
          }}>
            +{slotData.tasks.length - 4} more
          </div>
        )}

        {/* Hover action buttons for slots with tasks */}
        {isHovered && !isReadOnly && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            padding: '2px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}>
            {slotData.tasks.length < 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                title="Add new task"
              >
                +
              </button>
            )}
            {hasCopiedTask && slotData.tasks.length < 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                }}
                title="Paste task"
              >
                📋
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const getMainContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  });

  const getHeaderStyle = (): React.CSSProperties => ({
    display: 'flex',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    width: '100%',
    minWidth: '100%',
  });

  const getTeamHeaderStyle = (): React.CSSProperties => ({
    width: '120px',
    minWidth: '120px',
    padding: '12px 8px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#f1f5f9',
  });

  const getAmPmHeaderStyle = (): React.CSSProperties => ({
    width: '60px',
    minWidth: '60px',
    padding: '12px 8px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  });

  const getDayHeaderStyle = (day: CalendarDayDto): React.CSSProperties => {
    const isTodayDate = isToday(new Date(day.date));
    const isSelected = isDaySelected(new Date(day.date));

    return {
      flex: '1 1 0',
      minWidth: '250px',
      maxWidth: 'none',
      padding: '12px 8px',
      fontSize: '1rem',
      fontWeight: '700',
      color: isSelected ? '#ffffff' : (isTodayDate ? '#1d4ed8' : '#374151'),
      textAlign: 'center',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: isSelected
        ? '#3b82f6'
        : (isTodayDate ? '#dbeafe' : '#f1f5f9'),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50px',
      cursor: isReadOnly ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
      border: isSelected ? '2px solid #1d4ed8' : 'none',
      boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    };
  };

  const getContentStyle = (): React.CSSProperties => ({
    display: 'flex',
    flex: 1,
    overflow: 'auto',
    width: '100%',
    minWidth: '100%',
  });

  const getEmployeeRowStyle = (): React.CSSProperties => ({
    display: 'flex',
    height: '130px',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden'
  });

  const getEmployeeCellStyle = (): React.CSSProperties => ({
    width: '120px',
    minWidth: '120px',
    borderRight: '2px solid #e5e7eb',
  });

  const getAmPmCellStyle = (): React.CSSProperties => ({
    width: '60px',
    minWidth: '60px',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#1e40af',
    display: 'flex',
    flexDirection: 'column',
  });

  const getAmPmLabelStyle = (isAM: boolean = false): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderBottom: '1px solid #1d4ed8',
    backgroundColor: isAM ? '#60a5fa' : '#1e40af',
  });

  const getDayCellStyle = (): React.CSSProperties => ({
    flex: '1 1 0',
    minWidth: '250px',
    maxWidth: 'none',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
  });

  const getTimeSlotStyle = (isAM: boolean): React.CSSProperties => ({
    height: '65px',
    backgroundColor: isAM ? '#ffffff' : '#e6f3ff',
    borderBottom: isAM ? '1px solid #e5e7eb' : 'none',
    display: 'flex',
    position: 'relative',
    overflow: 'hidden'
  });

  return (
    <div style={getMainContainerStyle()}>
      {/* Header Row */}
      <div style={getHeaderStyle()}>
        <div style={getTeamHeaderStyle()}>Team</div>
        <div style={getAmPmHeaderStyle()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>
        </div>
        {days.map((day) => (
          <div
            key={day.date}
            style={getDayHeaderStyle(day)}
            data-day-header="true"
            onClick={(e) => {
              if (!isReadOnly) {
                console.log('Day header clicked:', day.date, 'Ctrl:', e.ctrlKey);
                onDayClick?.(new Date(day.date), e);
              }
            }}
            onMouseEnter={(e) => {
              if (!isReadOnly) {
                const isTodayDate = isToday(new Date(day.date));
                const isSelected = isDaySelected(new Date(day.date));
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isTodayDate ? '#bfdbfe' : '#e2e8f0';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!isReadOnly) {
                const isTodayDate = isToday(new Date(day.date));
                const isSelected = isDaySelected(new Date(day.date));
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isTodayDate ? '#dbeafe' : '#f1f5f9';
                }
              }
            }}
            onContextMenu={(e) => {
              if (isReadOnly) return;
              e.preventDefault();

              // Remove existing context menus
              document.querySelectorAll('[data-context-menu]').forEach(menu => {
                if (document.body.contains(menu)) {
                  document.body.removeChild(menu);
                }
              });

              const contextMenu = document.createElement('div');
              contextMenu.setAttribute('data-context-menu', 'true');
              contextMenu.style.position = 'fixed';
              contextMenu.style.left = e.clientX + 'px';
              contextMenu.style.top = e.clientY + 'px';
              contextMenu.style.backgroundColor = 'white';
              contextMenu.style.border = '1px solid #ccc';
              contextMenu.style.borderRadius = '6px';
              contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              contextMenu.style.zIndex = '10000';
              contextMenu.style.padding = '4px 0';
              contextMenu.style.fontSize = '14px';
              contextMenu.style.minWidth = '180px';

              const dayDate = new Date(day.date);

              // Check if there are any blocking items on this day
              const hasBlocking = employees.some(emp => {
                const dayAssignment = emp.dayAssignments.find(assignment =>
                  new Date(assignment.date).toDateString() === dayDate.toDateString()
                );
                return dayAssignment?.isHoliday ||
                       dayAssignment?.leave ||
                       dayAssignment?.morningSlot?.leave ||
                       dayAssignment?.afternoonSlot?.leave;
              });

              // Check if this day is selected and determine count for context menu
              const isDayCurrentlySelected = isDaySelected(dayDate);
              let daysCount = 1; // Default to 1 (just this day)

              if (selectedDays && selectedDays.length > 0) {
                if (isDayCurrentlySelected) {
                  // This day is part of selection - show count for all selected days
                  daysCount = selectedDays.length;
                } else {
                  // This day is NOT in selection - will only process this day
                  daysCount = 1;
                }
              }

              const menuItems = [
                {
                  label: `🏦 Set Bank Holiday${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onSetBankHoliday?.(dayDate),
                  description: daysCount > 1
                    ? `Block all slots for all team members on ${daysCount} selected days`
                    : 'Block all slots for all team members on this day'
                },
                {
                  label: `✈️ Set Leave${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onSetLeave?.(dayDate),
                  description: daysCount > 1
                    ? `Set leave for specific team members on ${daysCount} selected days`
                    : 'Set leave for specific team members'
                },
                ...(hasBlocking ? [{
                  label: `🧹 Clear Blocking${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onClearBlocking?.(dayDate),
                  description: daysCount > 1
                    ? `Remove all leave and holidays from ${daysCount} selected days`
                    : 'Remove all leave and holidays from this day'
                }] : [])
              ];

              menuItems.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.padding = '8px 16px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.borderBottom = index < menuItems.length - 1 ? '1px solid #eee' : 'none';
                menuItem.style.whiteSpace = 'nowrap';

                // Add hover effects
                menuItem.onmouseenter = () => {
                  menuItem.style.backgroundColor = '#f5f5f5';
                };
                menuItem.onmouseleave = () => {
                  menuItem.style.backgroundColor = 'white';
                };

                menuItem.onclick = () => {
                  item.action();
                  document.body.removeChild(contextMenu);
                };

                // Add tooltip on hover
                menuItem.title = item.description;

                contextMenu.appendChild(menuItem);
              });

              document.body.appendChild(contextMenu);

              // Remove context menu when clicking elsewhere
              const removeMenu = (event: MouseEvent) => {
                if (!contextMenu.contains(event.target as Node)) {
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                  document.removeEventListener('click', removeMenu);
                }
              };
              setTimeout(() => document.addEventListener('click', removeMenu), 0);
            }}
          >
            {formatDayHeader(day)}
          </div>
        ))}
      </div>

      {/* Content Rows */}
      <div style={getContentStyle()}>
        <div style={{ flex: 1, width: '100%', minWidth: '100%' }}>
          {employees.map((employee) => (
            <div key={employee.employeeId} style={getEmployeeRowStyle()}>
              {/* Employee Info */}
              <div style={getEmployeeCellStyle()}>
                <SimplifiedEmployeeRow employee={employee} />
              </div>

              {/* AM/PM Labels */}
              <div style={getAmPmCellStyle()}>
                <div style={getAmPmLabelStyle(true)}>AM</div>
                <div style={getAmPmLabelStyle(false)}>PM</div>
              </div>

              {/* Day Columns */}
              {days.map((day) => (
                <div key={day.date} style={getDayCellStyle()}>
                  {/* AM Slot */}
                  <div style={getTimeSlotStyle(true)}>
                    {renderTasksInSlot(employee, day, true)}
                  </div>
                  
                  {/* PM Slot */}
                  <div style={getTimeSlotStyle(false)}>
                    {renderTasksInSlot(employee, day, false)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayBasedCalendarGrid;