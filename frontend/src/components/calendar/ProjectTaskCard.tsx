import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { 
  TaskCardProps, 
  AssignmentTaskDto, 
  STATUS_LABELS, 
  PRIORITY_LABELS 
} from '../../types/schedule';
import { formatHours } from '../../utils/hoursCalculator';
import { ItemTypes, DragItem } from '../../types/dragDrop';
import scheduleService from '../../services/scheduleService';
import ContextMenu from './ContextMenu';

interface ProjectTaskCardProps extends TaskCardProps {
  maxWidth?: string;
  showTooltip?: boolean;
  isDraggable?: boolean;
  sourceDate?: Date;
  sourceSlot?: number;
  sourceEmployeeId?: number;
  onView?: (task: AssignmentTaskDto) => void;
  onCopy?: (task: AssignmentTaskDto) => void;
  calculatedHours?: number;
}

const ProjectTaskCard: React.FC<ProjectTaskCardProps> = ({
  task,
  size = 'medium',
  maxWidth = '100%',
  showTooltip = true,
  isDraggable = false,
  sourceDate,
  sourceSlot,
  sourceEmployeeId,
  onClick,
  onEdit,
  onDelete,
  onView,
  onCopy,
  calculatedHours
}) => {
  // Drag and drop setup
  const [{ isDragging }, drag, preview] = useDrag<DragItem, any, { isDragging: boolean }>({
    type: ItemTypes.TASK,
    item: () => {
      if (!isDraggable || !sourceDate || !sourceSlot || !sourceEmployeeId) {
        return null;
      }
      
      return {
        type: ItemTypes.TASK,
        task,
        sourceSlot: {
          date: sourceDate,
          slot: sourceSlot,
          employeeId: sourceEmployeeId,
        },
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => isDraggable && !!sourceDate && !!sourceSlot && !!sourceEmployeeId,
  });

  // Use empty image for drag preview (we'll create custom preview)
  React.useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Context menu triggered at:', e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Prevent click during drag
    e.stopPropagation();
    onClick?.(task);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      onDelete?.(task.assignmentId);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: '0.6875rem',
          padding: '4px 6px',
          minHeight: '28px',
          borderRadius: '4px',
        };
      case 'large':
        return {
          fontSize: '0.875rem',
          padding: '8px 12px',
          minHeight: '56px', // Reduced from 64px to fit better in fixed height
          borderRadius: '6px',
        };
      default: // medium
        return {
          fontSize: '0.75rem',
          padding: '6px 8px',
          minHeight: '36px', // Reduced from 48px to fit better
          borderRadius: '5px',
        };
    }
  };

  const priorityColor = scheduleService.getPriorityColor(task.priority);
  const statusColor = scheduleService.getStatusColor(task.taskStatus);
  const sizeStyles = getSizeStyles();
  
  const cardStyles: React.CSSProperties = {
    ...sizeStyles,
    backgroundColor: task.clientColor || '#f8f9fa',
    borderTop: `1px solid ${task.clientColor ? task.clientColor : '#dee2e6'}`,
    borderRight: `1px solid ${task.clientColor ? task.clientColor : '#dee2e6'}`,
    borderBottom: `1px solid ${task.clientColor ? task.clientColor : '#dee2e6'}`,
    borderLeft: `4px solid ${priorityColor}`,
    color: '#212529',
    cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : (onClick ? 'pointer' : 'default'),
    position: 'relative',
    width: '100%',
    maxWidth,
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'rotate(5deg)' : 'none',
  };

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderTop: `1px solid ${priorityColor}`,
    borderRight: `1px solid ${priorityColor}`,
    borderBottom: `1px solid ${priorityColor}`,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.taskStatus !== 3;

  return (
    <motion.div
      ref={isDraggable ? drag : undefined}
      style={{
        ...cardStyles,
        ...(isHovered && !isDragging && (onClick || isDraggable) && hoverStyles),
        ...(isOverdue && { borderLeft: '4px solid #dc3545' }),
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={showTooltip ? `${task.projectCode} - ${task.taskTitle}\nClient: ${task.clientName}\nType: ${task.taskTypeName}\nStatus: ${STATUS_LABELS[task.taskStatus]}\nPriority: ${PRIORITY_LABELS[task.priority]}${task.dueDate ? `\nDue: ${new Date(task.dueDate).toLocaleDateString()}` : ''}${task.notes ? `\nNotes: ${task.notes}` : ''}${isDraggable ? '\n\n(Drag to move to another slot)\n(Right-click for menu)' : '\n\n(Right-click for menu)'}` : undefined}
      whileHover={!isDragging && isDraggable ? { scale: 1.02 } : {}}
      whileTap={isDraggable ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Header with project code (title) and status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: size === 'small' ? '2px' : (size === 'large' ? '6px' : '3px'),
      }}>
        <span style={{
          fontWeight: '700',
          color: '#212529',
          fontSize: size === 'small' ? '0.6875rem' : (size === 'large' ? '0.875rem' : '0.75rem'),
          lineHeight: '1.1',
        }}>
          {task.projectCode}
        </span>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Status indicator */}
          <div style={{
            width: size === 'small' ? '6px' : '8px',
            height: size === 'small' ? '6px' : '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
          }} />
          
          {/* Priority indicator */}
          {task.priority >= 3 && (
            <div style={{
              fontSize: size === 'small' ? '0.625rem' : '0.6875rem',
              color: priorityColor,
              fontWeight: '700',
            }}>
              {task.priority === 4 ? '!!' : '!'}
            </div>
          )}
          
          {/* Overdue indicator */}
          {isOverdue && (
            <div style={{
              fontSize: size === 'small' ? '0.625rem' : '0.6875rem',
              color: '#dc3545',
              fontWeight: '700',
            }}>
              ⚠
            </div>
          )}
        </div>
      </div>

      {/* Client name */}
      <div style={{
        fontWeight: '500',
        color: '#495057',
        fontSize: size === 'small' ? '0.625rem' : (size === 'large' ? '0.75rem' : '0.6875rem'),
        lineHeight: '1.2',
        marginBottom: size === 'small' ? '1px' : (size === 'large' ? '4px' : '2px'),
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}>
        {task.clientName}
      </div>

      {/* Task Type and Hours */}
      <div style={{
        fontSize: size === 'small' ? '0.5625rem' : (size === 'large' ? '0.6875rem' : '0.625rem'),
        color: '#6c757d',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '3px',
      }}>
        <span style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          flex: 1,
        }}>
          {task.taskTypeName}
        </span>
        <span style={{
          fontWeight: '600',
          color: '#495057',
          flexShrink: 0,
        }}>
          {calculatedHours !== undefined ? formatHours(calculatedHours) : (task.hours ? formatHours(task.hours) : '')}
        </span>
      </div>

      {/* Due date (if present and not small size) */}
      {size !== 'small' && task.dueDate && (
        <div style={{
          fontSize: '0.6875rem',
          color: isOverdue ? '#dc3545' : '#6c757d',
          fontWeight: isOverdue ? '600' : 'normal',
          marginTop: '2px',
        }}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      {/* Action buttons (on hover for copy/edit/delete - only for larger sizes) */}
      {size !== 'small' && isHovered && (onCopy || onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          display: 'flex',
          gap: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          padding: '2px',
        }}>
          {onCopy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(task);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '2px',
                color: '#10b981',
                fontSize: '0.75rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d1fae5')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Copy task"
            >
              📋
            </button>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '2px',
                color: '#6c757d',
                fontSize: '0.75rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Edit assignment"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '2px',
                color: '#dc3545',
                fontSize: '0.75rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8d7da')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Delete assignment"
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Notes indicator (if present) */}
      {task.notes && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          fontSize: '0.625rem',
          color: '#6c757d',
          opacity: 0.7,
        }}>
          📝
        </div>
      )}

      {/* Context Menu - Always render when contextMenu state exists */}
      {contextMenu && (
        <ContextMenu
          task={task}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onViewEdit={onView || onEdit}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      )}
      
    </motion.div>
  );
};

export default ProjectTaskCard;