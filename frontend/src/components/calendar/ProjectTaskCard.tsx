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
import { createCardColorScheme } from '../../utils/colorUtils';
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
          fontSize: 'var(--dp-text-body-small)',
          padding: 'var(--dp-space-1p5) var(--dp-space-2)',
          minHeight: '32px',
          borderRadius: 'var(--dp-radius-md)',
        };
      case 'large':
        return {
          fontSize: 'var(--dp-text-body-large)',
          padding: 'var(--dp-space-3) var(--dp-space-4)',
          minHeight: '64px',
          borderRadius: 'var(--dp-radius-lg)',
        };
      default: // medium
        return {
          fontSize: 'var(--dp-text-body-medium)',
          padding: 'var(--dp-space-2) var(--dp-space-3)',
          minHeight: '44px',
          borderRadius: 'var(--dp-radius-lg)',
        };
    }
  };

  const priorityColor = scheduleService.getPriorityColor(task.priority);
  const statusColor = scheduleService.getStatusColor(task.taskStatus);
  const sizeStyles = getSizeStyles();
  const colorScheme = createCardColorScheme(task.clientColor);

  const cardStyles: React.CSSProperties = {
    ...sizeStyles,
    background: `linear-gradient(135deg, ${colorScheme.gradient.start}, ${colorScheme.gradient.end})`,
    border: `1px solid ${colorScheme.border}`,
    borderLeft: `4px solid ${priorityColor}`,
    borderRadius: 'var(--dp-radius-lg)',
    color: colorScheme.text,
    cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : (onClick ? 'pointer' : 'default'),
    position: 'relative',
    width: '100%',
    maxWidth,
    boxSizing: 'border-box',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
    fontFamily: 'var(--dp-font-family-primary)',
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'rotate(5deg)' : 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(8px)',
  };

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-2px) scale(1.01)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12), 0 3px 10px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${colorScheme.border}`,
    borderLeft: `4px solid ${priorityColor}`,
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
      title={showTooltip ? `${task.projectName} - ${task.taskTitle}\nClient: ${task.clientName}\nType: ${task.taskTypeName}\nHours: ${calculatedHours !== undefined ? formatHours(calculatedHours) : (task.hours ? formatHours(task.hours) : 'N/A')}\nStatus: ${STATUS_LABELS[task.taskStatus]}\nPriority: ${PRIORITY_LABELS[task.priority]}${task.dueDate ? `\nDue: ${new Date(task.dueDate).toLocaleDateString()}` : ''}${task.notes ? `\nNotes: ${task.notes}` : ''}${isDraggable ? '\n\n(Drag to move to another slot)\n(Right-click for menu)' : '\n\n(Right-click for menu)'}` : undefined}
      whileHover={!isDragging && isDraggable ? { scale: 1.02 } : {}}
      whileTap={isDraggable ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Header with project code (title) and status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: size === 'small' ? 'var(--dp-space-1)' : (size === 'large' ? 'var(--dp-space-2)' : 'var(--dp-space-1p5)'),
      }}>
        <span style={{
          fontWeight: '700',
          color: colorScheme.text,
          fontSize: size === 'small' ? '0.6875rem' : (size === 'large' ? '0.9375rem' : '0.8125rem'),
          lineHeight: '1.2',
          letterSpacing: '-0.01em',
          textShadow: colorScheme.text === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          flex: 1,
          marginRight: '8px',
          fontFamily: 'var(--dp-font-family-primary)',
        }}>
          {task.projectName}
        </span>
        
        <div style={{ display: 'flex', gap: 'var(--dp-space-1)', alignItems: 'center' }}>
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

      {/* Task Type and Hours */}
      <div style={{
        fontSize: size === 'small' ? '0.625rem' : (size === 'large' ? '0.75rem' : '0.6875rem'),
        color: colorScheme.text === '#ffffff' ? 'rgba(255,255,255,0.85)' : 'rgba(108,117,125,0.95)',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '3px',
        fontFamily: 'var(--dp-font-family-primary)',
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
          fontWeight: '700',
          color: colorScheme.text === '#ffffff' ? 'rgba(255,255,255,0.98)' : '#495057',
          flexShrink: 0,
          letterSpacing: '-0.01em',
          textShadow: colorScheme.text === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
        }}>
          {calculatedHours !== undefined ? formatHours(calculatedHours) : (task.hours ? formatHours(task.hours) : '')}
        </span>
      </div>

      {/* Due date (if present and not small size) */}
      {size !== 'small' && task.dueDate && (
        <div style={{
          fontSize: '0.6875rem',
          color: isOverdue ? '#dc3545' : (colorScheme.text === '#ffffff' ? 'rgba(255,255,255,0.8)' : '#6c757d'),
          fontWeight: isOverdue ? '600' : 'normal',
          marginTop: '2px',
          textShadow: colorScheme.text === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
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
          color: colorScheme.text === '#ffffff' ? 'rgba(255,255,255,0.7)' : '#6c757d',
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
