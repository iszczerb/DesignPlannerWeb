import React, { useState } from 'react';
import { EmployeeCalendarDto, TEAM_TYPE_LABELS } from '../../types/schedule';

interface SimplifiedEmployeeRowProps {
  employee: EmployeeCalendarDto;
  onEmployeeView?: (employee: EmployeeCalendarDto) => void;
  onEmployeeEdit?: (employee: EmployeeCalendarDto) => void;
  onEmployeeDelete?: (employeeId: number) => void;
}

const SimplifiedEmployeeRow: React.FC<SimplifiedEmployeeRowProps> = ({
  employee,
  onEmployeeView,
  onEmployeeEdit,
  onEmployeeDelete
}) => {
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
  // Calculate filled slots for progress bar (x/total available)
  const getFilledSlots = () => {
    let filledSlots = 0;
    employee.dayAssignments.forEach((day) => {
      // Only count slots that are NOT blocked by leave/holidays and have tasks
      if (day.morningSlot &&
          day.morningSlot.tasks &&
          day.morningSlot.tasks.length > 0 &&
          !day.morningSlot.leave &&
          !day.isHoliday) {
        filledSlots++;
      }
      if (day.afternoonSlot &&
          day.afternoonSlot.tasks &&
          day.afternoonSlot.tasks.length > 0 &&
          !day.afternoonSlot.leave &&
          !day.isHoliday) {
        filledSlots++;
      }
    });
    return filledSlots;
  };

  const getTotalSlots = () => {
    let totalSlots = 0;
    employee.dayAssignments.forEach((day) => {
      // Count available slots (not blocked by leave or holidays)
      if (day.isHoliday) {
        // Holiday blocks both AM and PM slots for this employee - count 0
        return;
      }

      // Check if employee has full-day leave
      if (day.leave && day.leave.duration === 1) { // LeaveDuration.FullDay = 1
        // Full day leave blocks both slots - count 0
        return;
      }

      // Count individual slots that are not blocked
      let daySlots = 0;

      // Check AM slot
      if (!day.morningSlot?.leave) {
        daySlots++;
      }

      // Check PM slot
      if (!day.afternoonSlot?.leave) {
        daySlots++;
      }

      totalSlots += daySlots;
    });

    return totalSlots;
  };

  const filledSlots = getFilledSlots();
  const totalSlots = getTotalSlots();
  const progressPercentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage < 40) return '#ef4444'; // Red for low %
    if (percentage < 70) return '#f59e0b'; // Yellow/Orange for medium %
    return '#10b981'; // Green for high %
  };

  const getEmployeeRowStyle = (): React.CSSProperties => ({
    width: '120px',
    minWidth: '120px',
    maxWidth: '120px',
    padding: '8px 6px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '130px',
    textAlign: 'center',
  });

  const getFirstNameStyle = (): React.CSSProperties => ({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: '1.1',
    margin: 0,
  });

  const getLastNameStyle = (): React.CSSProperties => ({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: '1.1',
    margin: 0,
  });

  const getRoleStyle = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    fontWeight: '400',
    color: '#6b7280',
    lineHeight: '1.1',
    margin: 0,
  });

  const getTeamStyle = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#3b82f6',
    lineHeight: '1.1',
    margin: 0,
    marginTop: '4px',
  });

  const getProgressContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  });

  const getProgressBarStyle = (): React.CSSProperties => ({
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  });

  const getProgressFillStyle = (): React.CSSProperties => ({
    width: `${progressPercentage}%`,
    height: '100%',
    backgroundColor: getProgressColor(progressPercentage),
    borderRadius: '3px',
    transition: 'width 0.3s ease-in-out',
  });

  const getProgressTextStyle = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  });

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

  const handleEmployeeViewEdit = () => {
    onEmployeeView?.(employee);
    handleCloseContextMenu();
  };

  const handleEmployeeDelete = () => {
    const confirmMessage = `Are you sure you want to delete ${employee.employeeName}?\n\n` +
      `Role: ${employee.role}\n` +
      `Team: ${employee.teamType ? TEAM_TYPE_LABELS[employee.teamType] : 'Unassigned'}\n` +
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

  // Split employee name into first and last name
  const nameParts = employee.employeeName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div style={getEmployeeRowStyle()}>
      {/* Employee Info - Grouped at Top - Clickable */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          cursor: onEmployeeView ? 'pointer' : 'default',
          padding: '4px',
          borderRadius: '6px',
          transition: 'background-color 0.2s ease'
        }}
        onClick={() => onEmployeeView?.(employee)}
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
        onContextMenu={handleEmployeeContextMenu}
        title={onEmployeeView ? "Click to view details, right-click for options" : ""}
      >
        {/* First Name */}
        <div style={getFirstNameStyle()}>
          {firstName}
        </div>

        {/* Last Name */}
        <div style={getLastNameStyle()}>
          {lastName}
        </div>

        {/* Role */}
        <div style={getRoleStyle()}>
          {employee.role || 'Design Engineer'}
        </div>

        {/* Team */}
        <div style={getTeamStyle()}>
          {employee.teamType ? TEAM_TYPE_LABELS[employee.teamType] : 'Unassigned'}
        </div>
      </div>
      
      {/* Progress Info - Grouped at Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {/* Progress Bar */}
        <div style={getProgressContainerStyle()}>
          <div style={getProgressBarStyle()}>
            <div style={getProgressFillStyle()} />
          </div>
        </div>
        
        {/* Progress Text Under Bar */}
        <div style={getProgressTextStyle()}>
          {filledSlots}/{totalSlots} ({Math.round(progressPercentage)}%)
        </div>
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
              onClick={handleEmployeeViewEdit}
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
              View / Edit Member
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

export default SimplifiedEmployeeRow;