import React from 'react';
import { EmployeeCalendarDto } from '../../types/schedule';

interface SimplifiedEmployeeRowProps {
  employee: EmployeeCalendarDto;
}

const SimplifiedEmployeeRow: React.FC<SimplifiedEmployeeRowProps> = ({ employee }) => {
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

  // Split employee name into first and last name
  const nameParts = employee.employeeName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div style={getEmployeeRowStyle()}>
      {/* Employee Info - Grouped at Top */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
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
          Design Engineer
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
    </div>
  );
};

export default SimplifiedEmployeeRow;