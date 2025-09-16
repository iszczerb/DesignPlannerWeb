import React, { useMemo, useState } from 'react';
import TimeSlot from './TimeSlot';
import {
  EmployeeRowProps,
  Slot,
  AssignmentTaskDto,
  CalendarDayDto,
  TEAM_TYPE_LABELS
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';

interface ExtendedEmployeeRowProps extends EmployeeRowProps {
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  onTaskPaste?: (date: Date, slot: Slot, employeeId: number) => void;
  hasCopiedTask?: boolean;
  teamColor?: string;
  isTeamManaged?: boolean;
  showTeamIndicator?: boolean;
  onEmployeeView?: (employee: EmployeeScheduleDto) => void;
  onEmployeeEdit?: (employee: EmployeeScheduleDto) => void;
  onEmployeeDelete?: (employeeId: number) => void;
}

const EmployeeRow: React.FC<ExtendedEmployeeRowProps> = ({
  employee,
  days,
  onTaskClick,
  onSlotClick,
  isReadOnly = false,
  onTaskDrop,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  onTaskPaste,
  hasCopiedTask = false,
  teamColor,
  isTeamManaged = true,
  showTeamIndicator = false,
  onEmployeeView,
  onEmployeeEdit,
  onEmployeeDelete
}) => {
  // Create a map of day assignments for easy lookup
  const dayAssignmentMap = useMemo(() => {
    const map = new Map();
    employee.dayAssignments.forEach(dayAssignment => {
      map.set(dayAssignment.date, dayAssignment);
    });
    return map;
  }, [employee.dayAssignments]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0
  });

  const handleTaskClick = (task: AssignmentTaskDto) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleSlotClick = (date: Date, slot: Slot, employeeId: number) => {
    if (onSlotClick && !isReadOnly) {
      onSlotClick(date, slot, employeeId);
    }
  };

  const handleTaskDrop = (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => {
    if (onTaskDrop) {
      onTaskDrop(dragItem, targetDate, targetSlot, targetEmployeeId);
    }
  };

  const handleEmployeeContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleEmployeeView = () => {
    onEmployeeView?.(employee);
    handleCloseContextMenu();
  };

  const handleEmployeeEdit = () => {
    onEmployeeEdit?.(employee);
    handleCloseContextMenu();
  };

  const handleEmployeeDelete = () => {
    const confirmMessage = `Are you sure you want to delete ${employee.employeeName}?\n\n` +
      `Role: ${employee.role}\n` +
      `Team: ${employee.team}\n` +
      `Status: ${employee.isActive ? 'Active' : 'Inactive'}\n\n` +
      `This action cannot be undone and will:\n` +
      `• Remove the member from all teams and assignments\n` +
      `• Delete all associated schedule data\n` +
      `• Remove access to all systems and projects\n\n` +
      `Are you absolutely sure you want to proceed?`;

    if (window.confirm(confirmMessage)) {
      onEmployeeDelete?.(employee.employeeId);
    }
    handleCloseContextMenu();
  };

  const getEmployeeSidebarStyle = (): React.CSSProperties => ({
    minWidth: '200px',
    maxWidth: '200px',
    padding: '12px 16px',
    backgroundColor: isTeamManaged ? '#f8fafc' : '#f1f5f9',
    borderRight: '1px solid #e2e8f0',
    borderLeft: teamColor ? `4px solid ${teamColor}` : undefined,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'sticky',
    left: 0,
    zIndex: 2,
    minHeight: '240px', // Accommodate 2 time slots (2 * 108px + padding + gap)
    opacity: isTeamManaged ? 1 : 0.75,
  });

  const getEmployeeNameStyle = (): React.CSSProperties => ({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: employee.isActive ? (isTeamManaged ? '#1f2937' : '#6b7280') : '#6b7280',
    lineHeight: '1.2',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const getEmployeeInfoStyle = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: '1.3',
  });

  const getEmployeeStatusStyle = (): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '0.6875rem',
    fontWeight: '500',
  });

  const getWorkloadSummary = () => {
    const totalAssignments = employee.dayAssignments.reduce((sum, day) => sum + day.totalAssignments, 0);
    const daysWithConflicts = employee.dayAssignments.filter(day => day.hasConflicts).length;
    const totalSlots = days.length * 2; // 2 slots per day
    const utilizationPercentage = Math.round((totalAssignments / totalSlots) * 100);

    return {
      totalAssignments,
      daysWithConflicts,
      utilizationPercentage
    };
  };

  const workloadSummary = getWorkloadSummary();

  const renderDaySlots = (day: CalendarDayDto) => {
    const dayAssignment = dayAssignmentMap.get(day.date);
    const dateObj = new Date(day.date);

    return (
      <div
        key={day.date}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '160px',
          minWidth: '160px',
          maxWidth: '160px',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >

        {/* Morning slot */}
        <TimeSlot
          slot={Slot.Morning}
          slotData={dayAssignment?.morningSlot}
          date={dateObj}
          employeeId={employee.employeeId}
          isReadOnly={isReadOnly}
          onTaskClick={handleTaskClick}
          onSlotClick={handleSlotClick}
          onTaskDrop={handleTaskDrop}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskView={onTaskView}
          onTaskCopy={onTaskCopy}
          onTaskPaste={onTaskPaste}
          hasCopiedTask={hasCopiedTask}
        />

        {/* Afternoon slot */}
        <TimeSlot
          slot={Slot.Afternoon}
          slotData={dayAssignment?.afternoonSlot}
          date={dateObj}
          employeeId={employee.employeeId}
          isReadOnly={isReadOnly}
          onTaskClick={handleTaskClick}
          onSlotClick={handleSlotClick}
          onTaskDrop={handleTaskDrop}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onTaskView={onTaskView}
          onTaskCopy={onTaskCopy}
          onTaskPaste={onTaskPaste}
          hasCopiedTask={hasCopiedTask}
        />

        {/* Day conflicts indicator */}
        {dayAssignment?.hasConflicts && (
          <div style={{
            textAlign: 'center',
            fontSize: '0.6875rem',
            color: '#ef4444',
            fontWeight: '600',
            backgroundColor: '#fef2f2',
            padding: '2px 4px',
            borderRadius: '3px',
            marginTop: '2px',
          }}>
            Overbooked
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      minHeight: '240px',
    }}>
      {/* Employee sidebar */}
      <div
        style={{
          ...getEmployeeSidebarStyle(),
          cursor: 'pointer',
        }}
        onContextMenu={handleEmployeeContextMenu}
        title="Right-click to view employee options"
      >
        {/* Clickable Employee Info Section */}
        <div
          onClick={() => onEmployeeView?.(employee)}
          style={{
            cursor: onEmployeeView ? 'pointer' : 'default',
            padding: '4px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease',
            ...( onEmployeeView && {
              ':hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }
            })
          }}
          onMouseEnter={(e) => {
            if (onEmployeeView) {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (onEmployeeView) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Employee Name */}
          <div style={getEmployeeNameStyle()}>
            {employee.firstName && employee.lastName
              ? `${employee.firstName} ${employee.lastName}`
              : employee.employeeName}
            {!isTeamManaged && (
              <span style={{
                fontSize: '0.6875rem',
                padding: '2px 6px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '10px',
                fontWeight: '500',
              }}>
                🔒
              </span>
            )}
            {showTeamIndicator && teamColor && (
              <span style={{
                width: '12px',
                height: '12px',
                backgroundColor: teamColor,
                borderRadius: '50%',
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
              }} />
            )}
          </div>

          {/* Role */}
          <div style={getEmployeeInfoStyle()}>
            <div>{employee.role}</div>
          </div>

          {/* Team Name */}
          <div style={getEmployeeInfoStyle()}>
            <div style={{ fontWeight: '600', color: '#4f46e5', fontSize: '0.8125rem' }}>
              {employee.team || (employee.teamType ? TEAM_TYPE_LABELS[employee.teamType] : 'Unassigned')}
            </div>
          </div>
        </div>

        <div style={getEmployeeStatusStyle()}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: employee.isActive ? '#10b981' : '#6b7280',
            flexShrink: 0,
          }} />
          {employee.isActive ? 'Active' : 'Inactive'}
        </div>

        {/* Workload summary */}
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '6px',
          fontSize: '0.6875rem',
          lineHeight: '1.3',
        }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '4px',
            color: '#374151'
          }}>
            Workload
          </div>
          <div style={{ color: '#6b7280' }}>
            {workloadSummary.totalAssignments} tasks
          </div>
          <div style={{ color: '#6b7280' }}>
            {workloadSummary.utilizationPercentage}% utilization
          </div>
          {workloadSummary.daysWithConflicts > 0 && (
            <div style={{ 
              color: '#ef4444',
              fontWeight: '600',
              marginTop: '2px'
            }}>
              {workloadSummary.daysWithConflicts} conflicts
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontSize: '0.6875rem',
          color: '#6b7280',
        }}>
          <div>
            AM: {employee.dayAssignments.filter(d => d.morningSlot).length} days
          </div>
          <div>
            PM: {employee.dayAssignments.filter(d => d.afternoonSlot).length} days
          </div>
        </div>
      </div>

      {/* Days and slots container */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        overflowX: 'auto',
        flex: 1,
        backgroundColor: '#fafbfc',
        alignItems: 'stretch',
      }}>
        {days.map(renderDaySlots)}
      </div>

      {/* Employee Context Menu */}
      {contextMenu.visible && (
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999998,
            }}
            onClick={handleCloseContextMenu}
          />

          {/* Context Menu */}
          <div
            style={{
              position: 'fixed',
              left: Math.max(10, Math.min(contextMenu.x, window.innerWidth - 200)),
              top: Math.max(10, Math.min(contextMenu.y, window.innerHeight - 200)),
              zIndex: 999999,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              minWidth: '180px',
            }}
          >
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#f9fafb',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {employee.employeeName}
            </div>

            <div
              onClick={handleEmployeeView}
              style={{
                padding: '12px 16px',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1rem' }}>👁️</span>
              View Member Details
            </div>

            <div
              onClick={handleEmployeeEdit}
              style={{
                padding: '12px 16px',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1rem' }}>✏️</span>
              Edit Member
            </div>

            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />

            <div
              onClick={handleEmployeeDelete}
              style={{
                padding: '12px 16px',
                fontSize: '0.875rem',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ fontSize: '1rem' }}>🗑️</span>
              Delete Member
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeRow;