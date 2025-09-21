import React, { useState } from 'react';
import { EmployeeCalendarDto, TEAM_TYPE_LABELS } from '../../types/schedule';
import TeamMemberDetailsModal from './TeamMemberDetailsModal';
import { calculateActualHours } from '../../utils/taskLayoutHelpers';

interface SimplifiedEmployeeRowProps {
  employee: EmployeeCalendarDto;
}

const SimplifiedEmployeeRow: React.FC<SimplifiedEmployeeRowProps> = ({
  employee
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

  // Team member details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Calculate percentage-based capacity utilization
  const getCapacityUtilization = () => {
    let usedCapacity = 0;
    let totalCapacity = 0;

    employee.dayAssignments.forEach((day) => {
      // Skip holidays completely
      if (day.isHoliday) {
        return;
      }

      // Check if employee has full-day leave
      if (day.leave && day.leave.duration === 1) { // LeaveDuration.FullDay = 1
        return;
      }

      // Count available slots and calculate their filling percentage
      let dayCapacity = 0;
      let dayUsed = 0;

      // Check AM slot
      if (!day.morningSlot?.leave) {
        dayCapacity += 1; // Available slot = 1.0 capacity
        const morningTasks = day.morningSlot?.tasks || [];
        // Calculate actual hours used in morning slot
        let morningHours = 0;
        morningTasks.forEach((task, index) => {
          morningHours += calculateActualHours(task, index, morningTasks.length);
        });
        // Convert hours to capacity (4 hours = 1.0 capacity)
        const morningFilling = Math.min(morningHours / 4, 1.0);
        dayUsed += morningFilling;
      }

      // Check PM slot
      if (!day.afternoonSlot?.leave) {
        dayCapacity += 1; // Available slot = 1.0 capacity
        const afternoonTasks = day.afternoonSlot?.tasks || [];
        // Calculate actual hours used in afternoon slot
        let afternoonHours = 0;
        afternoonTasks.forEach((task, index) => {
          afternoonHours += calculateActualHours(task, index, afternoonTasks.length);
        });
        // Convert hours to capacity (4 hours = 1.0 capacity)
        const afternoonFilling = Math.min(afternoonHours / 4, 1.0);
        dayUsed += afternoonFilling;
      }

      totalCapacity += dayCapacity;
      usedCapacity += dayUsed;
    });

    return {
      usedCapacity,
      totalCapacity,
      percentage: totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0
    };
  };

  const capacityUtilization = getCapacityUtilization();
  const progressPercentage = capacityUtilization.percentage;

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

  const handleEmployeeViewDetails = () => {
    console.log('🚀 Opening details modal for employee:', employee.employeeName);
    setShowDetailsModal(true);
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
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          transition: 'background-color 0.2s ease'
        }}
        onClick={() => setShowDetailsModal(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onContextMenu={handleEmployeeContextMenu}
        title="Click to view details, right-click for options"
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
          {employee.team}
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
          {capacityUtilization.usedCapacity.toFixed(1)}/{capacityUtilization.totalCapacity} ({Math.round(progressPercentage)}%)
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
              onClick={handleEmployeeViewDetails}
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

export default SimplifiedEmployeeRow;