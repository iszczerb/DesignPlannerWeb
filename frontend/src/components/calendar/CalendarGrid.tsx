import React from 'react';
import EmployeeRow from './EmployeeRow';
import TeamSection from './TeamSection';
import DragPreview from './DragPreview';
import {
  CalendarGridProps,
  CalendarViewType,
  AssignmentTaskDto,
  Slot
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';
import { TeamViewMode } from './TeamToggle';

interface TeamInfo {
  id: number;
  name: string;
  color: string;
  isManaged: boolean;
}

interface ExtendedCalendarGridProps extends CalendarGridProps {
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  onTaskPaste?: (date: Date, slot: Slot, employeeId: number) => void;
  hasCopiedTask?: boolean;
  teamViewMode?: TeamViewMode;
  teams?: TeamInfo[];
  managedTeamId?: number;
  collapsedTeams?: Set<number>;
  onToggleTeamCollapse?: (teamId: number) => void;
  // Team member management props
  onEmployeeEdit?: (employee: any) => void;
  onEmployeeDelete?: (employeeId: number) => void;
  onTeamViewAllMembers?: (teamId: number) => void;
  onTeamAddMember?: (teamId: number) => void;
  onTeamManage?: (teamId: number) => void;
}

const CalendarGrid: React.FC<ExtendedCalendarGridProps> = ({
  calendarData,
  viewType,
  isLoading = false,
  onTaskClick,
  onSlotClick,
  onRefresh,
  onTaskDrop,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  onTaskPaste,
  hasCopiedTask = false,
  teamViewMode = TeamViewMode.MyTeam,
  teams = [],
  managedTeamId,
  collapsedTeams = new Set(),
  onToggleTeamCollapse,
  onEmployeeEdit,
  onEmployeeDelete,
  onTeamViewAllMembers,
  onTeamAddMember,
  onTeamManage
}) => {
  const handleTaskClick = (task: AssignmentTaskDto) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleSlotClick = (date: Date, slot: Slot, employeeId: number) => {
    if (onSlotClick) {
      onSlotClick(date, slot, employeeId);
    }
  };

  const handleTaskDrop = (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => {
    if (onTaskDrop) {
      onTaskDrop(dragItem, targetDate, targetSlot, targetEmployeeId);
    }
  };

  const getContainerStyle = (): React.CSSProperties => ({
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    overflow: viewType === CalendarViewType.BiWeek ? 'auto' : 'hidden', // Enable horizontal scroll for biweekly
    position: 'relative',
  });

  const getHeaderRowStyle = (): React.CSSProperties => ({
    display: 'flex',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 3,
  });

  const getHeaderCellStyle = (isFirst: boolean = false): React.CSSProperties => ({
    width: isFirst ? '200px' : '160px',
    minWidth: isFirst ? '200px' : '160px',
    maxWidth: isFirst ? '200px' : '160px',
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    borderRight: isFirst ? '1px solid #e2e8f0' : 'none',
    backgroundColor: isFirst ? '#f1f5f9' : '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexShrink: 0,
    overflow: 'hidden',
  });

  const getScrollContainerStyle = (): React.CSSProperties => ({
    maxHeight: 'calc(100vh - 200px)', // Adjust based on header height
    overflowY: 'auto',
    overflowX: 'auto',
  });

  const getLoadingOverlayStyle = (): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  });

  const getEmptyStateStyle = (): React.CSSProperties => ({
    padding: '48px 24px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '1rem',
  });

  const renderDayHeader = (day: any, index: number) => {
    return (
      <div
        key={day.date}
        style={{
          ...getHeaderCellStyle(),
          backgroundColor: day.isToday ? '#dbeafe' : '#f8fafc',
          color: day.isToday ? '#1d4ed8' : '#374151',
          border: day.isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          borderBottom: '2px solid #e2e8f0',
          marginRight: '8px', // Match the gap in EmployeeRow
        }}
      >
        <div>{day.dayName}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
          {day.displayDate}
        </div>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: '400',
          color: day.isToday ? '#3b82f6' : '#9ca3af',
          marginTop: '2px',
        }}>
          AM / PM
        </div>
      </div>
    );
  };

  const renderHeader = () => {

    return (
      <div style={getHeaderRowStyle()}>
        {/* Employee column header */}
        <div style={getHeaderCellStyle(true)}>
          <div style={{ fontSize: '1rem', fontWeight: '700' }}>
            Team Members
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '400',
          }}>
            {calendarData.employees.length} {calendarData.employees.length === 1 ? 'person' : 'people'}
          </div>
        </div>

        {/* Day headers */}
        {calendarData.days.map(renderDayHeader)}
      </div>
    );
  };

  const getViewTypeLabel = () => {
    switch (viewType) {
      case CalendarViewType.Day: return 'day';
      case CalendarViewType.Week: return 'week';
      case CalendarViewType.BiWeek: return '2-week';
      case CalendarViewType.Month: return 'month';
      default: return 'view';
    }
  };

  // Group employees by teams
  const getEmployeesByTeam = () => {
    const employeesByTeam = new Map<number, typeof calendarData.employees>();
    const unassignedEmployees: typeof calendarData.employees = [];

    calendarData.employees.forEach(employee => {
      // Use the teamId property from EmployeeScheduleDto
      const teamId = employee.teamId;
      if (teamId && teams.find(t => t.id === teamId)) {
        if (!employeesByTeam.has(teamId)) {
          employeesByTeam.set(teamId, []);
        }
        employeesByTeam.get(teamId)!.push(employee);
      } else {
        unassignedEmployees.push(employee);
      }
    });

    return { employeesByTeam, unassignedEmployees };
  };

  const { employeesByTeam, unassignedEmployees } = getEmployeesByTeam();
  
  // Filter out inactive employees for cleaner view (optional)
  const activeEmployees = calendarData.employees.filter(emp => emp.isActive);
  const employeesToShow = activeEmployees.length > 0 ? activeEmployees : calendarData.employees;
  
  const isTeamViewMode = teamViewMode === TeamViewMode.AllTeams && teams.length > 0;

  if (!calendarData || calendarData.employees.length === 0) {
    return (
      <div style={getContainerStyle()}>
        <div style={getEmptyStateStyle()}>
          <div style={{ marginBottom: '12px', fontSize: '1.125rem', fontWeight: '600' }}>
            No team members found
          </div>
          <div>
            There are no employees to display for this {getViewTypeLabel()} view.
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={getContainerStyle()}>
      {/* Loading overlay */}
      {isLoading && (
        <div style={getLoadingOverlayStyle()}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500',
            }}>
              Loading schedule...
            </div>
          </div>
        </div>
      )}

      {/* Calendar header */}
      {renderHeader()}

      {/* Calendar body with employee rows or team sections */}
      <div style={getScrollContainerStyle()}>
        {isTeamViewMode ? (
          <>
            {/* Render teams */}
            {teams.map(team => {
              const teamEmployees = employeesByTeam.get(team.id) || [];
              const isCollapsed = collapsedTeams.has(team.id);
              
              if (teamEmployees.length === 0) return null;

              return (
                <TeamSection
                  key={team.id}
                  team={team}
                  employees={teamEmployees}
                  days={calendarData.days}
                  isCollapsed={isCollapsed}
                  isViewOnly={teamViewMode === TeamViewMode.AllTeams && !team.isManaged}
                  onToggleCollapse={onToggleTeamCollapse}
                  onTaskClick={handleTaskClick}
                  onSlotClick={handleSlotClick}
                  onTaskDrop={handleTaskDrop}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                  onTaskView={onTaskView}
                  onTaskCopy={onTaskCopy}
                  onTaskPaste={onTaskPaste}
                  hasCopiedTask={hasCopiedTask}
                                    onEmployeeEdit={onEmployeeEdit}
                  onEmployeeDelete={onEmployeeDelete}
                  onTeamViewAllMembers={onTeamViewAllMembers}
                  onTeamAddMember={onTeamAddMember}
                  onTeamManage={onTeamManage}
                />
              );
            })}
            
            {/* Render unassigned employees */}
            {unassignedEmployees.length > 0 && (
              <TeamSection
                key="unassigned"
                team={{
                  id: -1,
                  name: 'Unassigned',
                  color: '#6b7280',
                  isManaged: true
                }}
                employees={unassignedEmployees}
                days={calendarData.days}
                isCollapsed={collapsedTeams.has(-1)}
                isViewOnly={false}
                onToggleCollapse={onToggleTeamCollapse}
                onTaskClick={handleTaskClick}
                onSlotClick={handleSlotClick}
                onTaskDrop={handleTaskDrop}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
                onTaskView={onTaskView}
                onTaskCopy={onTaskCopy}
                onTaskPaste={onTaskPaste}
                hasCopiedTask={hasCopiedTask}
                                onEmployeeEdit={onEmployeeEdit}
                onEmployeeDelete={onEmployeeDelete}
                onTeamViewAllMembers={onTeamViewAllMembers}
                onTeamAddMember={onTeamAddMember}
                onTeamManage={onTeamManage}
              />
            )}
          </>
        ) : (
          <>
            {/* Traditional view - render employees directly */}
            {employeesToShow.map((employee) => {
              const team = teams.find(t => t.id === employee.teamId);
              return (
                <EmployeeRow
                  key={employee.employeeId}
                  employee={employee}
                  days={calendarData.days}
                  onTaskClick={handleTaskClick}
                  onSlotClick={handleSlotClick}
                  onTaskDrop={handleTaskDrop}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                  onTaskView={onTaskView}
                  onTaskCopy={onTaskCopy}
                  onTaskPaste={onTaskPaste}
                  hasCopiedTask={hasCopiedTask}
                  teamColor={team?.color}
                  isTeamManaged={team ? team.isManaged : true}
                  showTeamIndicator={true}
                                    onEmployeeEdit={onEmployeeEdit}
                  onEmployeeDelete={onEmployeeDelete}
                />
              );
            })}
          </>
        )}

        {/* Summary row */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}>
          <div>
            Showing {employeesToShow.length} team member{employeesToShow.length !== 1 ? 's' : ''} 
            {' '}for {calendarData.days.length} day{calendarData.days.length !== 1 ? 's' : ''}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '0.75rem',
          }}>
            <div>
              <span style={{ fontWeight: '600' }}>
                {calendarData.employees.reduce((sum, emp) => 
                  sum + emp.dayAssignments.reduce((daySum, day) => daySum + day.totalAssignments, 0), 0
                )}
              </span> total tasks
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#ef4444' }}>
                {calendarData.employees.reduce((sum, emp) => 
                  sum + emp.dayAssignments.filter(day => day.hasConflicts).length, 0
                )}
              </span> conflicts
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#10b981' }}>
                {calendarData.days.length * employeesToShow.length * 2}
              </span> available slots
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS keyframes for loading animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      
      {/* Drag preview */}
      <DragPreview />
    </div>
  );
};

export default CalendarGrid;