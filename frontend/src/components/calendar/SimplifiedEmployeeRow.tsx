import React, { useState, useEffect } from 'react';
import { EmployeeCalendarDto, TEAM_TYPE_LABELS } from '../../types/schedule';
import TeamMemberDetailsModal from './TeamMemberDetailsModal';
import { calculateActualHours } from '../../utils/taskLayoutHelpers';

// Add keyframes for shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -100px 0; }
    100% { background-position: 100px 0; }
  }
`;

interface SimplifiedEmployeeRowProps {
  employee: EmployeeCalendarDto;
}

const SimplifiedEmployeeRow: React.FC<SimplifiedEmployeeRowProps> = ({
  employee
}) => {
  // Team member details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Inject keyframes styles
  useEffect(() => {
    const styleId = 'shimmer-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = shimmerKeyframes;
      document.head.appendChild(style);
    }
  }, []);
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
    padding: '4px var(--dp-space-2) 10px var(--dp-space-2)',
    backgroundColor: 'var(--dp-neutral-0)',
    borderRight: '2px solid var(--dp-neutral-200)',
    borderBottom: '1px solid var(--dp-neutral-200)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '130px',
    textAlign: 'center',
    fontFamily: 'var(--dp-font-family-primary)',
    position: 'relative',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '0',
    overflow: 'hidden',
  });

  const getFirstNameStyle = (): React.CSSProperties => ({
    fontSize: 'var(--dp-text-body-medium)',
    fontWeight: 'var(--dp-font-weight-bold)',
    fontFamily: 'var(--dp-font-family-primary)',
    color: 'var(--dp-neutral-900)',
    lineHeight: 'var(--dp-line-height-tight)',
    letterSpacing: '-0.01em',
    margin: 0,
  });

  const getLastNameStyle = (): React.CSSProperties => ({
    fontSize: 'var(--dp-text-body-medium)',
    fontWeight: 'var(--dp-font-weight-bold)',
    fontFamily: 'var(--dp-font-family-primary)',
    color: 'var(--dp-neutral-900)',
    lineHeight: 'var(--dp-line-height-tight)',
    letterSpacing: '-0.01em',
    margin: 0,
  });

  const getRoleStyle = (): React.CSSProperties => ({
    fontSize: 'var(--dp-text-body-small)',
    fontWeight: 'var(--dp-font-weight-regular)',
    fontFamily: 'var(--dp-font-family-primary)',
    color: 'var(--dp-neutral-500)',
    lineHeight: 'var(--dp-line-height-snug)',
    margin: 0,
  });

  const getTeamStyle = (): React.CSSProperties => ({
    fontSize: 'var(--dp-text-body-small)',
    fontWeight: 'var(--dp-font-weight-semibold)',
    fontFamily: 'var(--dp-font-family-primary)',
    color: 'var(--dp-primary-500)',
    lineHeight: 'var(--dp-line-height-snug)',
    margin: 0,
    marginTop: 'var(--dp-space-1)',
  });

  const getProgressContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  });

  const getProgressBarStyle = (): React.CSSProperties => ({
    flex: 1,
    height: '8px',
    backgroundColor: 'var(--dp-neutral-200)',
    borderRadius: 'var(--dp-radius-sm)',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  });

  const getProgressFillStyle = (): React.CSSProperties => ({
    width: `${progressPercentage}%`,
    height: '100%',
    backgroundColor: getProgressColor(progressPercentage),
    borderRadius: '3px',
    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)`,
    backgroundSize: '8px 8px',
    animation: progressPercentage > 0 ? 'shimmer 2s linear infinite' : 'none',
  });

  const getProgressTextStyle = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  });

  const handleEmployeeClick = () => {
    console.log('🚀 Opening details modal for employee:', employee.employeeName);
    setShowDetailsModal(true);
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
          gap: '1px',
          cursor: 'pointer',
          padding: '3px',
          borderRadius: 'var(--dp-radius-md)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateY(0)',
          boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
        }}
        onClick={() => setShowDetailsModal(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
        }}
        title="Click to view member details"
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: 'auto' }}>
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