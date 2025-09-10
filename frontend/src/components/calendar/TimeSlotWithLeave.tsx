import React, { useMemo, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import TaskLayout from './TaskLayout';
import {
  TimeSlotProps,
  SLOT_LABELS,
  MAX_TASKS_PER_SLOT,
  AssignmentTaskDto,
  Slot
} from '../../types/schedule';
import { ItemTypes, DragItem, DropResult } from '../../types/dragDrop';
import { leaveService, LeaveRequest, LeaveStatus, LeaveType } from '../../services/leaveService';

interface ExtendedTimeSlotProps extends TimeSlotProps {
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
}

const TimeSlotWithLeave: React.FC<ExtendedTimeSlotProps> = ({
  slot,
  slotData,
  date,
  employeeId,
  isReadOnly = false,
  onTaskClick,
  onSlotClick,
  onTaskDrop
}) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Load leave requests for this date
  useEffect(() => {
    loadLeaveRequests();
  }, [date, employeeId]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const requests = await leaveService.getLeaveRequestsForDateRange(dateStr, dateStr);
      
      // Filter for current employee and check if this date is covered
      const employeeLeave = requests.filter(request => 
        request.employeeId === employeeId &&
        new Date(request.startDate) <= date &&
        new Date(request.endDate) >= date
      );
      
      setLeaveRequests(employeeLeave);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if this specific slot is affected by leave
  const slotLeaveInfo = useMemo(() => {
    const relevantLeave = leaveRequests.find(request => {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      
      // Same day check
      if (requestStart.toDateString() === date.toDateString() && 
          requestEnd.toDateString() === date.toDateString()) {
        // Check AM/PM for same day
        if (slot === Slot.AM && !request.isStartDateAM) return false;
        if (slot === Slot.PM && request.isEndDateAM) return false;
        return true;
      }
      
      // Multi-day check
      if (requestStart.toDateString() === date.toDateString()) {
        // Start date - check if this slot is included
        return slot === Slot.AM ? request.isStartDateAM : true;
      }
      
      if (requestEnd.toDateString() === date.toDateString()) {
        // End date - check if this slot is included  
        return slot === Slot.PM ? !request.isEndDateAM : true;
      }
      
      // Middle day - both slots affected
      return requestStart < date && requestEnd > date;
    });
    
    return relevantLeave;
  }, [leaveRequests, date, slot]);

  // Drop functionality
  const canDropTask = (dragItem: DragItem): boolean => {
    if (isReadOnly) return false;
    
    // Can't drop on slots with approved leave
    if (slotLeaveInfo && slotLeaveInfo.status === LeaveStatus.Approved) {
      return false;
    }
    
    // Can't drop on itself
    if (
      dragItem.sourceSlot.date.toDateString() === date.toDateString() &&
      dragItem.sourceSlot.slot === slot &&
      dragItem.sourceSlot.employeeId === employeeId
    ) {
      return false;
    }

    // Check if slot is already full
    const currentTaskCount = slotData?.tasks?.length || 0;
    if (currentTaskCount >= MAX_TASKS_PER_SLOT) {
      return false;
    }

    // Check if slot is blocked
    if (slotData?.isOverbooked) {
      return false;
    }

    return true;
  };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, DropResult, { isOver: boolean; canDrop: boolean }>({
    accept: ItemTypes.TASK_CARD,
    canDrop: canDropTask,
    drop: (item) => {
      if (onTaskDrop) {
        onTaskDrop(item, date, slot, employeeId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleTaskClick = (task: AssignmentTaskDto) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleSlotClick = () => {
    // Don't allow clicks on approved leave slots
    if (slotLeaveInfo && slotLeaveInfo.status === LeaveStatus.Approved) {
      return;
    }
    
    if (onSlotClick && !isReadOnly) {
      onSlotClick(date, slot, employeeId);
    }
  };

  const hasTasks = slotData?.tasks && slotData.tasks.length > 0;
  const hasLeave = !!slotLeaveInfo;

  const getSlotStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      minHeight: '80px',
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      position: 'relative',
      cursor: (isReadOnly || (hasLeave && slotLeaveInfo?.status === LeaveStatus.Approved)) ? 'default' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      overflow: 'hidden',
    };

    // Leave styling takes precedence
    if (hasLeave) {
      const leave = slotLeaveInfo!;
      
      if (leave.status === LeaveStatus.Approved) {
        // Approved leave - solid styling based on leave type
        switch (leave.leaveType) {
          case LeaveType.Annual:
            baseStyle.backgroundColor = '#dbeafe'; // Blue
            baseStyle.borderColor = '#60a5fa';
            baseStyle.borderWidth = '2px';
            break;
          case LeaveType.Sick:
            baseStyle.backgroundColor = '#fed7d7'; // Red
            baseStyle.borderColor = '#f56565';
            baseStyle.borderWidth = '2px';
            break;
          case LeaveType.Training:
            baseStyle.backgroundColor = '#d1fae5'; // Green
            baseStyle.borderColor = '#34d399';
            baseStyle.borderWidth = '2px';
            break;
        }
      } else if (leave.status === LeaveStatus.Pending) {
        // Pending leave - striped/faded styling
        baseStyle.backgroundColor = '#f8f9fa';
        baseStyle.borderColor = '#dee2e6';
        baseStyle.borderWidth = '2px';
        baseStyle.borderStyle = 'dashed';
        baseStyle.opacity = 0.7;
      } else if (leave.status === LeaveStatus.Rejected) {
        // Rejected leave - no special styling, falls back to normal
        hasLeave = false;
      }
    }

    // Drop zone visual feedback (only if no approved leave)
    if (!hasLeave || slotLeaveInfo?.status !== LeaveStatus.Approved) {
      if (isOver && canDrop) {
        baseStyle.backgroundColor = '#dcfce7';
        baseStyle.borderColor = '#22c55e';
        baseStyle.borderWidth = '2px';
        baseStyle.transform = 'scale(1.02)';
      } else if (isOver && !canDrop) {
        baseStyle.backgroundColor = '#fef2f2';
        baseStyle.borderColor = '#ef4444';
        baseStyle.borderWidth = '2px';
      }
    }

    // Add styling based on slot state (if no leave overrides)
    if (!hasLeave) {
      if (slotData?.isOverbooked) {
        baseStyle.backgroundColor = '#fff5f5';
        baseStyle.borderColor = '#fecaca';
        baseStyle.borderWidth = '2px';
      } else if (hasTasks) {
        baseStyle.backgroundColor = '#f8fafc';
        baseStyle.borderColor = '#cbd5e1';
      }
    }

    // Weekend styling
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      baseStyle.opacity = (baseStyle.opacity || 1) * 0.7;
    }

    return baseStyle;
  };

  const getHeaderStyle = (): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
  });

  const getCapacityIndicatorStyle = (): React.CSSProperties => {
    const used = slotData?.tasks?.length || 0;
    const percentage = (used / MAX_TASKS_PER_SLOT) * 100;
    
    let color = '#10b981'; // Green for low usage
    if (percentage >= 75) color = '#f59e0b'; // Yellow for high usage
    if (percentage > 100) color = '#ef4444'; // Red for overbooked

    return {
      fontSize: '0.6875rem',
      color,
      fontWeight: '500',
    };
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

  const renderContent = () => {
    if (hasLeave && slotLeaveInfo!.status === LeaveStatus.Approved) {
      // Show leave information
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#374151',
          fontSize: '0.75rem',
          fontWeight: '500',
        }}>
          <div>
            <div>{getLeaveTypeLabel(slotLeaveInfo!.leaveType)} Leave</div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>
              {slotLeaveInfo!.employeeName}
            </div>
          </div>
        </div>
      );
    }

    if (hasLeave && slotLeaveInfo!.status === LeaveStatus.Pending) {
      // Show pending leave
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}>
          <div>
            <div>{getLeaveTypeLabel(slotLeaveInfo!.leaveType)} Leave</div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>
              Pending Approval
            </div>
          </div>
        </div>
      );
    }

    if (!hasTasks) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '20px 0',
        }}>
          {isReadOnly ? 'No tasks' : 'Click to add task'}
        </div>
      );
    }

    return (
      <div style={{ flex: 1, width: '100%' }}>
        <TaskLayout
          tasks={slotData!.tasks}
          onTaskClick={handleTaskClick}
          maxTasks={MAX_TASKS_PER_SLOT}
          isDraggable={!isReadOnly}
          sourceDate={date}
          sourceSlot={slot}
          sourceEmployeeId={employeeId}
        />
      </div>
    );
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      ref={drop}
      layout
      style={{
        ...getSlotStyle(),
        ...(isHovered && !isReadOnly && !isOver && !hasLeave && {
          borderColor: '#3b82f6',
          backgroundColor: '#fafbff',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }),
      }}
      onClick={handleSlotClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={!isReadOnly && !isOver && !hasLeave ? { scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Slot header */}
      <div style={getHeaderStyle()}>
        <span>{SLOT_LABELS[slot]}</span>
        {!hasLeave && (
          <span style={getCapacityIndicatorStyle()}>
            {slotData?.tasks?.length || 0}/{MAX_TASKS_PER_SLOT}
          </span>
        )}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Overbooked indicator (only show if no leave) */}
      {!hasLeave && slotData?.isOverbooked && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '8px',
          height: '8px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          zIndex: 10,
        }} />
      )}
    </motion.div>
  );
};

export default TimeSlotWithLeave;