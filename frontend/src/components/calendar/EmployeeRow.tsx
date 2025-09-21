import React, { useMemo, useState } from 'react';
import TimeSlot from './TimeSlot';
import TeamMemberDetailsModal from './TeamMemberDetailsModal';
import {
  EmployeeRowProps,
  Slot,
  AssignmentTaskDto,
  CalendarDayDto,
  TEAM_TYPE_LABELS,
  EmployeeScheduleDto
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';
import { calculateActualHours } from '../../utils/taskLayoutHelpers';

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
}

// Updated context menu
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

  // Team member details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
    console.log('🚀 Opening details modal for employee:', employee.employeeName);
    setShowDetailsModal(true);
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
    const totalCapacity = days.length * 2; // 2 slots per day (total capacity)

    // Calculate used capacity based on actual task hours (not task count)
    let usedCapacity = 0;
    employee.dayAssignments.forEach(dayAssignment => {
      const morningTasks = dayAssignment.morningSlot?.tasks || [];
      const afternoonTasks = dayAssignment.afternoonSlot?.tasks || [];

      // Calculate actual hours used in each slot
      let morningHours = 0;
      morningTasks.forEach((task, index) => {
        morningHours += calculateActualHours(task, index, morningTasks.length);
      });

      let afternoonHours = 0;
      afternoonTasks.forEach((task, index) => {
        afternoonHours += calculateActualHours(task, index, afternoonTasks.length);
      });

      // Convert hours to capacity (4 hours = 1.0 capacity)
      const morningCapacity = Math.min(morningHours / 4, 1.0);
      const afternoonCapacity = Math.min(afternoonHours / 4, 1.0);

      usedCapacity += morningCapacity + afternoonCapacity;
    });

    const utilizationPercentage = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

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
          transition: 'all 0.2s ease',
        }}
        onContextMenu={handleEmployeeContextMenu}
        title="Click to view details • Right-click for options"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isTeamManaged ? '#f1f5f9' : '#e2e8f0';
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isTeamManaged ? '#f8fafc' : '#f1f5f9';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={() => {
          console.log('🖱️ Employee sidebar clicked for:', employee.employeeName);
          setShowDetailsModal(true);
        }}
      >
        {/* Clickable Employee Info Section */}
        <div
          onClick={() => {
            console.log('🖱️ Employee info clicked for:', employee.employeeName);
            setShowDetailsModal(true);
          }}
          style={{
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
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
              {employee.team}
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
                padding: '16px 20px',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📊</span>
              View Member Details
            </div>
          </div>
        </>
      )}

      {/* Team Member Details Modal */}
      <TeamMemberDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        employee={employee}
      />
    </div>
  );
};

export default EmployeeRow;