import React from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { 
  TaskCardProps, 
  AssignmentTaskDto, 
  STATUS_LABELS, 
  PRIORITY_LABELS 
} from '../../types/schedule';
import { ItemTypes, DragItem } from '../../types/dragDrop';
import scheduleService from '../../services/scheduleService';

interface ProjectTaskCardProps extends TaskCardProps {
  maxWidth?: string;
  showTooltip?: boolean;
  isDraggable?: boolean;
  sourceDate?: Date;
  sourceSlot?: number;
  sourceEmployeeId?: number;
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
  onDelete
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
          fontSize: '0.75rem',
          padding: '6px 8px',
          minHeight: '32px',
          borderRadius: '4px',
        };
      case 'large':
        return {
          fontSize: '0.875rem',
          padding: '12px 16px',
          minHeight: '64px',
          borderRadius: '8px',
        };
      default: // medium
        return {
          fontSize: '0.8125rem',
          padding: '8px 12px',
          minHeight: '48px',
          borderRadius: '6px',
        };
    }
  };

  const priorityColor = scheduleService.getPriorityColor(task.priority);
  const statusColor = scheduleService.getStatusColor(task.taskStatus);
  const sizeStyles = getSizeStyles();
  
  const cardStyles: React.CSSProperties = {
    ...sizeStyles,
    backgroundColor: task.clientColor || '#f8f9fa',
    border: `1px solid ${task.clientColor ? task.clientColor : '#dee2e6'}`,
    borderLeftWidth: '4px',
    borderLeftColor: priorityColor,
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
    borderColor: priorityColor,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.taskStatus !== 3;

  return (
    <motion.div
      ref={isDraggable ? drag : undefined}
      style={{
        ...cardStyles,
        ...(isHovered && !isDragging && (onClick || isDraggable) && hoverStyles),
        ...(isOverdue && { borderLeftColor: '#dc3545', borderLeftWidth: '4px' }),
      }}
      onClick={handleClick}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={showTooltip ? `${task.projectCode} - ${task.taskTitle}\nClient: ${task.clientName}\nStatus: ${STATUS_LABELS[task.taskStatus]}\nPriority: ${PRIORITY_LABELS[task.priority]}${task.dueDate ? `\nDue: ${new Date(task.dueDate).toLocaleDateString()}` : ''}${task.notes ? `\nNotes: ${task.notes}` : ''}${isDraggable ? '\n\n(Drag to move to another slot)' : ''}` : undefined}
      whileHover={!isDragging && isDraggable ? { scale: 1.02 } : {}}
      whileTap={isDraggable ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Header with project code and status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: size === 'small' ? '4px' : '6px',
      }}>
        <span style={{
          fontWeight: '600',
          color: '#495057',
          fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
          lineHeight: '1.2',
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

      {/* Task title */}
      <div style={{
        fontWeight: '500',
        color: '#212529',
        lineHeight: '1.3',
        marginBottom: size === 'small' ? '2px' : '4px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: size === 'small' ? 1 : 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
      }}>
        {task.taskTitle}
      </div>

      {/* Client name (for larger sizes) */}
      {size !== 'small' && (
        <div style={{
          fontSize: '0.6875rem',
          color: '#6c757d',
          marginTop: 'auto',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          {task.clientName}
        </div>
      )}

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

      {/* Action buttons (on hover for edit/delete - only for larger sizes) */}
      {size !== 'small' && isHovered && (onEdit || onDelete) && (
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
    </motion.div>
  );
};

export default ProjectTaskCard;