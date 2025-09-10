import { CalendarViewDto, ScheduleRequestDto } from '../types/schedule';
import apiService from './api';

export interface TeamInfo {
  id: number;
  name: string;
  code: string;
  description?: string;
  color: string;
  memberCount: number;
  isManaged: boolean;
}

export interface GlobalCalendarView {
  startDate: string;
  endDate: string;
  viewType: number;
  days: any[];
  teams: Array<{
    id: number;
    name: string;
    code: string;
    color: string;
    isManaged: boolean;
    employees: any[];
  }>;
}

class TeamService {
  /**
   * Get teams that the current user manages
   */
  async getManagerTeams(): Promise<TeamInfo[]> {
    try {
      const response = await apiService.get<TeamInfo[]>('/schedule/teams');
      return response;
    } catch (error) {
      console.error('Failed to fetch manager teams:', error);
      throw new Error('Failed to fetch manager teams');
    }
  }

  /**
   * Get all teams with managed status for current user
   */
  async getAllTeamsWithManagedStatus(): Promise<TeamInfo[]> {
    try {
      const response = await apiService.get<TeamInfo[]>('/schedule/teams/all');
      return response;
    } catch (error) {
      console.error('Failed to fetch all teams:', error);
      throw new Error('Failed to fetch all teams');
    }
  }

  /**
   * Get calendar view for a specific team
   */
  async getTeamCalendarView(teamId: number, request: ScheduleRequestDto): Promise<CalendarViewDto> {
    try {
      const params = {
        startDate: typeof request.startDate === 'string' ? request.startDate : new Date(request.startDate).toISOString().split('T')[0],
        viewType: request.viewType.toString(),
        ...(request.includeInactive && { includeInactive: 'true' })
      };

      const response = await apiService.get<CalendarViewDto>(`/schedule/team/${teamId}/calendar`, { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch team calendar:', error);
      throw new Error('Failed to fetch team calendar');
    }
  }

  /**
   * Get global calendar view with all teams
   */
  async getGlobalCalendarView(request: ScheduleRequestDto): Promise<GlobalCalendarView> {
    try {
      const params = {
        startDate: typeof request.startDate === 'string' ? request.startDate : new Date(request.startDate).toISOString().split('T')[0],
        viewType: request.viewType.toString(),
        ...(request.includeInactive && { includeInactive: 'true' })
      };

      const response = await apiService.get<GlobalCalendarView>('/schedule/calendar/global', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch global calendar:', error);
      throw new Error('Failed to fetch global calendar');
    }
  }

  /**
   * Transform global calendar view to standard calendar format
   */
  transformGlobalViewToCalendarData(globalView: GlobalCalendarView): CalendarViewDto {
    // Flatten all employees from all teams
    const allEmployees = globalView.teams.flatMap(team => 
      team.employees.map(employee => ({
        ...employee,
        teamId: team.id,
        teamColor: team.color,
        isTeamManaged: team.isManaged
      }))
    );

    return {
      startDate: globalView.startDate,
      endDate: globalView.endDate,
      viewType: globalView.viewType,
      days: globalView.days,
      employees: allEmployees
    };
  }

  /**
   * Get team colors for styling
   */
  getTeamColors(): Record<string, string> {
    return {
      'DEV': '#10b981',      // Green
      'DESIGN': '#8b5cf6',   // Purple  
      'QA': '#f59e0b',       // Yellow
      'DEVOPS': '#ef4444',   // Red
      'PM': '#3b82f6',       // Blue
      'MARKETING': '#f97316', // Orange
      'DEFAULT': '#6b7280'    // Gray
    };
  }

  /**
   * Get team color by code
   */
  getTeamColor(teamCode: string): string {
    const colors = this.getTeamColors();
    return colors[teamCode.toUpperCase()] || colors.DEFAULT;
  }

  /**
   * Check if user has edit permissions for team
   */
  canEditTeam(team: TeamInfo, userRole: string): boolean {
    return team.isManaged && (userRole === 'Manager' || userRole === 'Admin');
  }

  /**
   * Check if user has view permissions for team
   */
  canViewTeam(team: TeamInfo, userRole: string): boolean {
    return userRole === 'Manager' || userRole === 'Admin';
  }


  /**
   * Transform team data for UI components
   */
  transformTeamsForUI(teams: TeamInfo[]): Array<{
    id: number;
    name: string;
    color: string;
    isManaged: boolean;
  }> {
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      color: team.color,
      isManaged: team.isManaged
    }));
  }

  /**
   * Get user's managed team (assuming user manages only one team)
   */
  getUserManagedTeam(teams: TeamInfo[]): TeamInfo | undefined {
    return teams.find(team => team.isManaged);
  }

  /**
   * Filter teams by management status
   */
  filterManagedTeams(teams: TeamInfo[]): TeamInfo[] {
    return teams.filter(team => team.isManaged);
  }

  /**
   * Filter teams by view-only status
   */
  filterViewOnlyTeams(teams: TeamInfo[]): TeamInfo[] {
    return teams.filter(team => !team.isManaged);
  }
}

// Create and export singleton instance
const teamService = new TeamService();
export default teamService;