import React, { useState, useEffect, useCallback } from 'react';
import TeamCalendarView from '../components/calendar/TeamCalendarView';
import { TeamViewMode } from '../components/calendar/TeamToggle';
import { 
  CalendarViewType, 
  CalendarViewDto,
  AssignmentTaskDto,
  Slot,
  ScheduleRequestDto
} from '../types/schedule';
import { DragItem } from '../types/dragDrop';
import teamService, { TeamInfo } from '../services/teamService';
import scheduleService from '../services/scheduleService';

// Mock user context (in real app, this would come from auth context)
interface UserContext {
  id: number;
  role: string;
  name: string;
}

const TeamSchedule: React.FC = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState(CalendarViewType.Week);
  const [teamViewMode, setTeamViewMode] = useState(TeamViewMode.MyTeam);
  const [calendarData, setCalendarData] = useState<CalendarViewDto | undefined>();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user context
  const [userContext] = useState<UserContext>({
    id: 1,
    role: 'Manager', // or 'Admin', 'TeamMember'
    name: 'John Manager'
  });

  // Derived state
  const managedTeam = teams.find(team => team.isManaged);
  const managedTeamId = managedTeam?.id;
  const currentTeamName = managedTeam?.name;

  /**
   * Load teams based on user role and permissions
   */
  const loadTeams = useCallback(async () => {
    try {
      setError(null);
      
      if (userContext.role === 'Manager' || userContext.role === 'Admin') {
        const allTeams = await teamService.getAllTeamsWithManagedStatus();
        setTeams(allTeams);
      } else {
        // For regular team members, we might load just their team
        setTeams([]);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError('Failed to load team information');
      setTeams([]);
    }
  }, [userContext.role]);

  /**
   * Load calendar data based on current view mode and parameters
   */
  const loadCalendarData = useCallback(async (teamId?: number, mode?: TeamViewMode) => {
    try {
      setIsLoading(true);
      setError(null);

      const request: ScheduleRequestDto = {
        startDate: currentDate,
        viewType: viewType,
        includeInactive: false
      };

      let data: CalendarViewDto;

      const currentMode = mode || teamViewMode;

      if (currentMode === TeamViewMode.MyTeam && teamId) {
        // Load specific team data
        request.teamId = teamId;
        data = await teamService.getTeamCalendarView(teamId, request);
      } else if (currentMode === TeamViewMode.AllTeams) {
        // Load global view with all teams
        const globalView = await teamService.getGlobalCalendarView(request);
        data = teamService.transformGlobalViewToCalendarData(globalView);
      } else {
        // Fallback to regular calendar view
        data = await scheduleService.getCalendarView(request);
      }

      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load schedule data');
      setCalendarData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, viewType, teamViewMode]);

  /**
   * Handle team view mode changes
   */
  const handleTeamViewChange = useCallback((mode: TeamViewMode) => {
    setTeamViewMode(mode);
    loadCalendarData(
      mode === TeamViewMode.MyTeam ? managedTeamId : undefined, 
      mode
    );
  }, [loadCalendarData, managedTeamId]);

  /**
   * Handle data fetching requests
   */
  const handleFetchTeamData = useCallback((teamId?: number, mode?: TeamViewMode) => {
    loadCalendarData(teamId, mode);
  }, [loadCalendarData]);

  /**
   * Handle task clicks - open task modal/details
   */
  const handleTaskClick = useCallback((task: AssignmentTaskDto) => {
    console.log('Task clicked:', task);
    // In a real app, this would open a task details modal
    alert(`Task: ${task.taskTitle}\nProject: ${task.projectName}\nClient: ${task.clientName}`);
  }, []);

  /**
   * Handle slot clicks - create new task
   */
  const handleSlotClick = useCallback((date: Date, slot: Slot, employeeId: number) => {
    console.log('Slot clicked:', { date, slot, employeeId });
    // In a real app, this would open a create task modal
    const slotName = slot === Slot.Morning ? 'Morning' : 'Afternoon';
    alert(`Create new task for ${date.toLocaleDateString()} ${slotName}`);
  }, []);

  /**
   * Handle task drag and drop
   */
  const handleTaskDrop = useCallback((
    dragItem: DragItem, 
    targetDate: Date, 
    targetSlot: Slot, 
    targetEmployeeId: number
  ) => {
    console.log('Task drop:', { dragItem, targetDate, targetSlot, targetEmployeeId });
    // In a real app, this would update the task assignment
    alert(`Move task to ${targetDate.toLocaleDateString()} ${targetSlot === Slot.Morning ? 'Morning' : 'Afternoon'}`);
  }, []);

  /**
   * Handle date changes
   */
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    // Calendar data will be reloaded by useEffect
  }, []);

  /**
   * Handle view type changes
   */
  const handleViewTypeChange = useCallback((newViewType: CalendarViewType) => {
    setViewType(newViewType);
    // Calendar data will be reloaded by useEffect
  }, []);

  /**
   * Handle refresh button
   */
  const handleRefresh = useCallback(() => {
    loadTeams();
    loadCalendarData(
      teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
      teamViewMode
    );
  }, [loadTeams, loadCalendarData, teamViewMode, managedTeamId]);

  // Load initial data
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Load calendar data when dependencies change
  useEffect(() => {
    if (teams.length > 0 || teamViewMode === TeamViewMode.AllTeams) {
      loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    }
  }, [loadCalendarData, teams.length, managedTeamId, teamViewMode, currentDate, viewType]);

  // Transform teams for UI components
  const teamsForUI = teamService.transformTeamsForUI(teams);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f9fafb',
    }}>
      {/* Page Header */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0,
          }}>
            Team Schedule Management
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '4px 0 0',
          }}>
            Welcome back, {userContext.name} ({userContext.role})
          </p>
        </div>
        
        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '0.875rem',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Team Calendar View */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TeamCalendarView
          currentDate={currentDate}
          viewType={viewType}
          onDateChange={handleDateChange}
          onViewTypeChange={handleViewTypeChange}
          calendarData={calendarData}
          teams={teamsForUI}
          isLoading={isLoading}
          userRole={userContext.role}
          managedTeamId={managedTeamId}
          currentTeamName={currentTeamName}
          onRefresh={handleRefresh}
          onTaskClick={handleTaskClick}
          onSlotClick={handleSlotClick}
          onTaskDrop={handleTaskDrop}
          onTeamViewChange={handleTeamViewChange}
          onFetchTeamData={handleFetchTeamData}
        />
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}>
          Debug: View Mode: {teamViewMode}, Teams: {teams.length}, 
          Managed Team: {currentTeamName || 'None'}, 
          Employees: {calendarData?.employees.length || 0}
        </div>
      )}
    </div>
  );
};

export default TeamSchedule;