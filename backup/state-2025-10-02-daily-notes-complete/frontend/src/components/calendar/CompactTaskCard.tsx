import React, { useRef, useEffect, useState } from 'react';
import { AssignmentTaskDto } from '../../types/schedule';

interface CompactTaskCardProps {
  task: AssignmentTaskDto;
  onClick?: (task: AssignmentTaskDto) => void;
  isReadOnly?: boolean;
}

const CompactTaskCard: React.FC<CompactTaskCardProps> = ({
  task,
  onClick,
  isReadOnly = false
}) => {
  const projectNameRef = useRef<HTMLSpanElement>(null);
  const clientNameRef = useRef<HTMLSpanElement>(null);
  const taskTypeRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [projectFontSize, setProjectFontSize] = useState('0.75rem');
  const [clientFontSize, setClientFontSize] = useState('0.7rem');
  const [taskTypeFontSize, setTaskTypeFontSize] = useState('0.65rem');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !isReadOnly) {
      onClick(task);
    }
  };

  // Calculate font size based on text length - simpler approach
  const calculateFontSizeByLength = (text: string, minSize: number = 0.45, maxSize: number = 0.75): string => {
    if (!text) return `${maxSize}rem`;

    const length = text.length;
    let fontSize: number;

    if (length <= 8) {
      fontSize = maxSize; // Short text gets max size
    } else if (length <= 15) {
      fontSize = maxSize * 0.85; // Medium text gets reduced size
    } else if (length <= 25) {
      fontSize = maxSize * 0.7; // Long text gets more reduced size
    } else {
      fontSize = minSize; // Very long text gets minimum size
    }

    return `${fontSize}rem`;
  };

  // Update font sizes when task changes
  useEffect(() => {
    const projectOptimalSize = calculateFontSizeByLength(task.projectName, 0.45, 0.75);
    const clientOptimalSize = calculateFontSizeByLength(task.clientName, 0.4, 0.65);
    const taskTypeOptimalSize = calculateFontSizeByLength(task.taskTypeName || '', 0.35, 0.6);

    setProjectFontSize(projectOptimalSize);
    setClientFontSize(clientOptimalSize);
    setTaskTypeFontSize(taskTypeOptimalSize);
  }, [task.projectName, task.clientName, task.taskTypeName]);

  // Get initials from employee name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to lighten a color
  const lightenColor = (color: string, amount: number): string => {
    if (!color || color === '#e5e7eb') return '#f3f4f6';

    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Lighten by mixing with white
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);

    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  // Smart text truncation that preserves readability
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
  };

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 8px',
    margin: '1px 0',
    borderRadius: '4px',
    backgroundColor: lightenColor(task.clientColor || '#e5e7eb', 0.7),
    color: '#1f2937',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: isReadOnly ? 'default' : 'pointer',
    minHeight: '18px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    transition: 'all 0.1s ease',
    lineHeight: '1.2',
  };

  const hoverStyle: React.CSSProperties = {
    ...cardStyle,
    backgroundColor: lightenColor(task.clientColor || '#e5e7eb', 0.5),
    transform: 'scale(1.01)',
    zIndex: 10,
    position: 'relative',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      ref={containerRef}
      style={isHovered ? hoverStyle : cardStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${task.projectName} - ${task.taskTitle}\nClient: ${task.clientName}\nTask Type: ${task.taskTypeName || 'N/A'}\nAssigned to: ${task.employeeName}\nDuration: ${task.hours || 'N/A'} hours\nStatus: ${task.taskStatus}`}
    >
      {/* Left side content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
      }}>
        {/* Project name */}
        <span
          ref={projectNameRef}
          style={{
            fontWeight: '600',
            fontSize: projectFontSize,
            marginRight: '6px',
            flexShrink: 0,
          }}
        >
          {task.projectName}
        </span>

        {/* Client name */}
        <span
          ref={clientNameRef}
          style={{
            fontSize: clientFontSize,
            opacity: 0.8,
            marginRight: '6px',
            flexShrink: 0,
          }}
        >
          {task.clientName}
        </span>

        {/* Task type */}
        {task.taskTypeName && (
          <span
            ref={taskTypeRef}
            style={{
              fontSize: taskTypeFontSize,
              opacity: 0.7,
              flexShrink: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '1px 4px',
              borderRadius: '2px',
            }}
          >
            {task.taskTypeName}
          </span>
        )}
      </div>

      {/* Right side content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
      }}>
        {/* Employee initials */}
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: '600',
            opacity: 0.8,
          }}
        >
          {getInitials(task.employeeName)}
        </span>

        {/* Hours indicator */}
        {task.hours && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: '600',
              opacity: 0.7,
            }}
          >
            {task.hours}h
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactTaskCard;