import React, { useState, useEffect, useMemo } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import TeamToggle, { TeamViewMode } from './TeamToggle';
import { 
  CalendarViewType, 
  CalendarViewDto,
  AssignmentTaskDto,
  Slot
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';

interface TeamInfo {
  id: number;
  name: string;
  color: string;
  isManaged: boolean;
}

interface TeamCalendarViewProps {
  // Calendar props
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  
  // Data props
  calendarData?: CalendarViewDto;
  teams?: TeamInfo[];
  isLoading?: boolean;
  
  // User context
  userRole?: string;
  managedTeamId?: number;
  currentTeamName?: string;
  
  // Event handlers
  onRefresh?: () => void;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  
  // Team-specific handlers
  onTeamViewChange?: (mode: TeamViewMode) => void;
  onFetchTeamData?: (teamId?: number, mode?: TeamViewMode) => void;
}

const TeamCalendarView: React.FC<TeamCalendarViewProps> = ({
  currentDate,
  viewType,
  onDateChange,
  onViewTypeChange,
  calendarData,
  teams = [],
  isLoading = false,
  userRole,
  managedTeamId,
  currentTeamName,
  onRefresh,
  onTaskClick,
  onSlotClick,
  onTaskDrop,
  onTeamViewChange,
  onFetchTeamData
}) => {
  const [teamViewMode, setTeamViewMode] = useState<TeamViewMode>(TeamViewMode.MyTeam);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<number>>(new Set());

  // Determine if team controls should be shown
  const showTeamControls = useMemo(() => {
    return (userRole === 'Manager' || userRole === 'Admin') && teams.length > 0;
  }, [userRole, teams]);

  // Handle team view mode changes
  const handleTeamViewModeChange = (mode: TeamViewMode) => {
    setTeamViewMode(mode);
    if (onTeamViewChange) {
      onTeamViewChange(mode);
    }
    if (onFetchTeamData) {
      onFetchTeamData(
        mode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        mode
      );
    }
  };

  // Handle team collapse/expand
  const handleToggleTeamCollapse = (teamId: number) => {
    const newCollapsedTeams = new Set(collapsedTeams);
    if (newCollapsedTeams.has(teamId)) {
      newCollapsedTeams.delete(teamId);
    } else {
      newCollapsedTeams.add(teamId);
    }
    setCollapsedTeams(newCollapsedTeams);
  };

  // Enhanced task drop handler that respects team permissions
  const handleTaskDrop = (
    dragItem: DragItem, 
    targetDate: Date, 
    targetSlot: Slot, 
    targetEmployeeId: number
  ) => {
    if (!onTaskDrop) return;

    // In global view mode, prevent drops to non-managed teams
    if (teamViewMode === TeamViewMode.AllTeams && teams.length > 0) {
      const targetEmployee = calendarData?.employees.find(emp => emp.employeeId === targetEmployeeId);
      if (targetEmployee) {
        const targetTeam = teams.find(team => team.id === (targetEmployee as any).teamId);
        if (targetTeam && !targetTeam.isManaged) {
          // Could show a toast notification here
          console.warn('Cannot move tasks to non-managed team members');
          return;
        }
      }
    }

    onTaskDrop(dragItem, targetDate, targetSlot, targetEmployeeId);
  };

  // Enhanced slot click handler that respects team permissions
  const handleSlotClick = (date: Date, slot: Slot, employeeId: number) => {
    if (!onSlotClick) return;

    // In global view mode, prevent slot creation on non-managed teams
    if (teamViewMode === TeamViewMode.AllTeams && teams.length > 0) {
      const targetEmployee = calendarData?.employees.find(emp => emp.employeeId === employeeId);
      if (targetEmployee) {
        const targetTeam = teams.find(team => team.id === (targetEmployee as any).teamId);
        if (targetTeam && !targetTeam.isManaged) {
          // Could show a toast notification here
          console.warn('Cannot create tasks for non-managed team members');
          return;
        }
      }
    }

    onSlotClick(date, slot, employeeId);
  };

  // Auto-fetch data when view mode changes
  useEffect(() => {
    if (onFetchTeamData) {
      onFetchTeamData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    }
  }, [teamViewMode, managedTeamId, onFetchTeamData]);

  if (!calendarData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
        }}>
          {isLoading ? (
            <>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              Loading team schedule...
            </>
          ) : (
            'No schedule data available'
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
    }}>
      {/* Enhanced Calendar Header with Team Controls */}
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        onDateChange={onDateChange}
        onViewTypeChange={onViewTypeChange}
        onRefresh={onRefresh}
        isLoading={isLoading}
        title="Team Schedule"
        // Team management props
        teamViewMode={teamViewMode}
        onTeamViewModeChange={handleTeamViewModeChange}
        currentTeamName={currentTeamName}
        showTeamControls={showTeamControls}
        userRole={userRole}
      />

      {/* Enhanced Calendar Grid with Team Sections */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CalendarGrid
          calendarData={calendarData}
          viewType={viewType}
          isLoading={isLoading}
          onTaskClick={onTaskClick}
          onSlotClick={handleSlotClick}
          onRefresh={onRefresh}
          onTaskDrop={handleTaskDrop}
          // Team management props
          teamViewMode={teamViewMode}
          teams={teams}
          managedTeamId={managedTeamId}
          collapsedTeams={collapsedTeams}
          onToggleTeamCollapse={handleToggleTeamCollapse}
        />
      </div>

      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default TeamCalendarView;