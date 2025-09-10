import React, { useMemo } from 'react';
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

interface ExtendedTimeSlotProps extends TimeSlotProps {
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
}

const TimeSlot: React.FC<ExtendedTimeSlotProps> = ({
  slot,
  slotData,
  date,
  employeeId,
  isReadOnly = false,
  onTaskClick,
  onSlotClick,
  onTaskDrop
}) => {
  // Drop functionality
  const canDropTask = (dragItem: DragItem): boolean => {
    if (isReadOnly) return false;
    
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

    // Check if slot is blocked (could add blocked slot logic here)
    if (slotData?.isOverbooked) {
      return false;
    }

    return true;
  };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, DropResult, { isOver: boolean; canDrop: boolean }>({
    accept: ItemTypes.TASK,
    canDrop: (dragItem) => canDropTask(dragItem),
    drop: (dragItem) => {
      if (onTaskDrop && canDropTask(dragItem)) {
        onTaskDrop(dragItem, date, slot, employeeId);
      }
      return {
        targetSlot: {
          date,
          slot,
          employeeId,
        },
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleSlotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReadOnly && onSlotClick) {
      onSlotClick(date, slot, employeeId);
    }
  };

  const handleTaskClick = (task: AssignmentTaskDto) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  // Check if slot has tasks for easier reference
  const hasTasks = slotData?.tasks && slotData.tasks.length > 0;

  const getSlotStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      minHeight: '120px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e9ecef',
      borderRadius: '6px',
      padding: '8px',
      backgroundColor: '#ffffff',
      position: 'relative',
      cursor: isReadOnly ? 'default' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      overflow: 'hidden',
    };

    // Drop zone visual feedback
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

    // Add styling based on slot state
    if (slotData?.isOverbooked) {
      baseStyle.backgroundColor = '#fff5f5';
      baseStyle.borderColor = '#fecaca';
      baseStyle.borderWidth = '2px';
    } else if (hasTasks) {
      baseStyle.backgroundColor = '#f8fafc';
      baseStyle.borderColor = '#cbd5e1';
    }

    // Weekend styling
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      baseStyle.backgroundColor = '#f8f9fa';
      baseStyle.opacity = 0.7;
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

  const renderTasks = () => {
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
        ...(isHovered && !isReadOnly && !isOver && {
          borderColor: '#3b82f6',
          backgroundColor: '#fafbff',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }),
      }}
      onClick={handleSlotClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={!isReadOnly && !isOver ? { scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Slot header */}
      <div style={getHeaderStyle()}>
        <span>{SLOT_LABELS[slot]}</span>
        <span style={getCapacityIndicatorStyle()}>
          {slotData?.tasks?.length || 0}/{MAX_TASKS_PER_SLOT}
        </span>
      </div>

      {/* Tasks container */}
      {renderTasks()}

      {/* Overbooked indicator */}
      {slotData?.isOverbooked && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          backgroundColor: '#ef4444',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '700',
        }}>
          !
        </div>
      )}

      {/* Add task button (on hover for non-readonly) */}
      {!isReadOnly && isHovered && (!hasTasks || slotData!.tasks.length < MAX_TASKS_PER_SLOT) && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          +
        </div>
      )}

      {/* Available capacity indicator */}
      {slotData && slotData.availableCapacity > 0 && slotData.availableCapacity < MAX_TASKS_PER_SLOT && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          fontSize: '0.6875rem',
          color: '#10b981',
          fontWeight: '500',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 4px',
          borderRadius: '3px',
        }}>
          {slotData.availableCapacity} free
        </div>
      )}
    </motion.div>
  );
};

export default TimeSlot;