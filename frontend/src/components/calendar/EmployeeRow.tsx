import React, { useMemo } from 'react';
import TimeSlot from './TimeSlot';
import {
  EmployeeRowProps,
  Slot,
  AssignmentTaskDto,
  CalendarDayDto
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';

interface ExtendedEmployeeRowProps extends EmployeeRowProps {
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  teamColor?: string;
  isTeamManaged?: boolean;
  showTeamIndicator?: boolean;
}

const EmployeeRow: React.FC<ExtendedEmployeeRowProps> = ({
  employee,
  days,
  onTaskClick,
  onSlotClick,
  isReadOnly = false,
  onTaskDrop,
  teamColor,
  isTeamManaged = true,
  showTeamIndicator = false
}) => {
  // Create a map of day assignments for easy lookup
  const dayAssignmentMap = useMemo(() => {
    const map = new Map();
    employee.dayAssignments.forEach(dayAssignment => {
      map.set(dayAssignment.date, dayAssignment);
    });
    return map;
  }, [employee.dayAssignments]);

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
    minHeight: '280px', // Accommodate 2 time slots (2 * 120px + padding)
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
          minWidth: '160px',
          flexShrink: 0,
        }}
      >
        {/* Day header */}
        <div style={{
          textAlign: 'center',
          padding: '4px',
          backgroundColor: day.isToday ? '#dbeafe' : '#ffffff',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: day.isToday ? '#1d4ed8' : '#374151',
          border: day.isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          marginBottom: '4px',
        }}>
          <div>{day.dayName}</div>
          <div>{day.displayDate}</div>
        </div>

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
      minHeight: '280px',
    }}>
      {/* Employee sidebar */}
      <div style={getEmployeeSidebarStyle()}>
        <div style={getEmployeeNameStyle()}>
          {employee.employeeName}
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
        
        <div style={getEmployeeInfoStyle()}>
          <div>{employee.role}</div>
          <div>{employee.team}</div>
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
      }}>
        {days.map(renderDaySlots)}
      </div>
    </div>
  );
};

export default EmployeeRow;