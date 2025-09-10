import React, { useState } from 'react';
import EmployeeRow from './EmployeeRow';
import { EmployeeCalendarDto, CalendarDayDto, AssignmentTaskDto } from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';
import { Slot } from '../../types/schedule';

interface TeamInfo {
  id: number;
  name: string;
  color: string;
  isManaged: boolean; // Whether current user manages this team
}

interface TeamSectionProps {
  team: TeamInfo;
  employees: EmployeeCalendarDto[];
  days: CalendarDayDto[];
  isCollapsed?: boolean;
  isViewOnly?: boolean;
  onToggleCollapse?: (teamId: number) => void;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({
  team,
  employees,
  days,
  isCollapsed = false,
  isViewOnly = false,
  onToggleCollapse,
  onTaskClick,
  onSlotClick,
  onTaskDrop
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTeamHeaderStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: team.isManaged ? '#ffffff' : '#f8fafc',
    borderLeft: `4px solid ${team.color}`,
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    opacity: team.isManaged ? 1 : 0.85,
    position: 'sticky',
    top: 0,
    zIndex: 3,
  });

  const getTeamInfoStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  });

  const getTeamNameStyle = (): React.CSSProperties => ({
    fontSize: '1rem',
    fontWeight: '600',
    color: team.isManaged ? '#1f2937' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const getTeamMetaStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '0.75rem',
    color: '#6b7280',
  });

  const getBadgeStyle = (type: 'count' | 'status' | 'lock'): React.CSSProperties => {
    const baseStyle = {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.6875rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    };

    switch (type) {
      case 'count':
        return {
          ...baseStyle,
          backgroundColor: team.color + '20',
          color: team.color,
        };
      case 'status':
        return {
          ...baseStyle,
          backgroundColor: team.isManaged ? '#dbeafe' : '#f3f4f6',
          color: team.isManaged ? '#1d4ed8' : '#6b7280',
        };
      case 'lock':
        return {
          ...baseStyle,
          backgroundColor: '#fef3c7',
          color: '#92400e',
        };
    }
  };

  const getCollapseIconStyle = (): React.CSSProperties => ({
    fontSize: '1rem',
    color: '#6b7280',
    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease-in-out',
  });

  const getTeamContentStyle = (): React.CSSProperties => ({
    display: isCollapsed ? 'none' : 'block',
    opacity: team.isManaged ? 1 : 0.6,
    backgroundColor: team.isManaged ? '#ffffff' : '#fafbfc',
  });

  const getViewOnlyOverlayStyle = (): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: isViewOnly && !team.isManaged ? 'none' : 'auto',
    zIndex: isViewOnly && !team.isManaged ? 1 : -1,
  });

  const handleHeaderClick = () => {
    if (onToggleCollapse) {
      onToggleCollapse(team.id);
    }
  };

  const getWorkloadSummary = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.isActive).length;
    const totalTasks = employees.reduce((sum, emp) => 
      sum + emp.dayAssignments.reduce((daySum, day) => daySum + day.totalAssignments, 0), 0
    );
    const conflictEmployees = employees.filter(emp => 
      emp.dayAssignments.some(day => day.hasConflicts)
    ).length;

    return {
      totalEmployees,
      activeEmployees,
      totalTasks,
      conflictEmployees
    };
  };

  const workloadSummary = getWorkloadSummary();

  return (
    <div 
      style={{ 
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Team Header */}
      <div
        style={{
          ...getTeamHeaderStyle(),
          backgroundColor: isHovered ? (team.isManaged ? '#f9fafb' : '#f1f5f9') : (team.isManaged ? '#ffffff' : '#f8fafc'),
        }}
        onClick={handleHeaderClick}
      >
        <div style={getTeamInfoStyle()}>
          <div style={getTeamNameStyle()}>
            <span style={getCollapseIconStyle()}>▼</span>
            {team.name}
            {!team.isManaged && (
              <span style={getBadgeStyle('lock')}>
                🔒 View Only
              </span>
            )}
          </div>
        </div>

        <div style={getTeamMetaStyle()}>
          <span style={getBadgeStyle('count')}>
            {workloadSummary.activeEmployees}/{workloadSummary.totalEmployees} active
          </span>
          <span style={getBadgeStyle('count')}>
            {workloadSummary.totalTasks} tasks
          </span>
          {workloadSummary.conflictEmployees > 0 && (
            <span style={{
              ...getBadgeStyle('status'),
              backgroundColor: '#fef2f2',
              color: '#dc2626',
            }}>
              {workloadSummary.conflictEmployees} conflicts
            </span>
          )}
          <span style={getBadgeStyle('status')}>
            {team.isManaged ? 'Managed' : 'View Only'}
          </span>
        </div>
      </div>

      {/* Team Content */}
      <div style={getTeamContentStyle()}>
        {/* View Only Overlay */}
        <div style={getViewOnlyOverlayStyle()} />
        
        {employees.map(employee => (
          <EmployeeRow
            key={employee.employeeId}
            employee={employee}
            days={days}
            isReadOnly={isViewOnly || !team.isManaged}
            onTaskClick={onTaskClick}
            onSlotClick={onSlotClick}
            onTaskDrop={onTaskDrop}
          />
        ))}
        
        {employees.length === 0 && (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.875rem',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
          }}>
            No employees in this team
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;