import { CalendarViewDto, ScheduleRequestDto, TeamDto } from '../types/schedule';
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
      console.log('🔍 TeamService: Before API call - checking tokens:', {
        accessToken: localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING',
        refreshToken: localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING',
        expiresAt: localStorage.getItem('expiresAt'),
        allKeys: Object.keys(localStorage)
      });

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
      // CRITICAL INTERCEPTION: Check if user is Admin and redirect to global view
      const userRole = this.getCurrentUserRole();
      console.log('🚨🚨🚨 SERVICE INTERCEPT: getTeamCalendarView called with teamId:', teamId, 'role:', userRole);
      console.log('🚨 SERVICE INTERCEPT: Token exists:', !!localStorage.getItem('accessToken'));
      console.log('🚨 SERVICE INTERCEPT: Full token payload:', this.decodeTokenPayload());

      if (userRole === 'Admin') {
        console.log('🚨 ✅ SERVICE INTERCEPT: Admin user detected, redirecting to GLOBAL endpoint!');
        console.log('🚨 PREVENTING TeamId', teamId, 'from reaching backend - using global instead');
        const globalView = await this.getGlobalCalendarView(request);
        return this.transformGlobalViewToCalendarData(globalView);
      }

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
    // Check if this is already a CalendarViewDto (for TeamMembers)
    // TeamMembers get a CalendarViewDto directly, not a GlobalCalendarView
    if ('employees' in globalView && !('teams' in globalView)) {
      return globalView as CalendarViewDto;
    }

    // For Admins/Managers, flatten all employees from all managed teams
    // This now properly supports multiple teams per manager
    const allEmployees = globalView.teams?.flatMap(team =>
      team.employees.map(employee => ({
        ...employee,
        teamId: team.id,
        teamColor: team.color,
        isTeamManaged: team.isManaged
      }))
    ) || [];

    return {
      startDate: globalView.startDate,
      endDate: globalView.endDate,
      viewType: globalView.viewType,
      days: globalView.days,
      employees: allEmployees
    };
  }

  /**
   * Get a summary of managed teams for display
   */
  getManagedTeamsSummary(teams: TeamInfo[]): string {
    const managedTeams = this.getUserManagedTeams(teams);
    if (managedTeams.length === 0) return 'No teams managed';
    if (managedTeams.length === 1) return managedTeams[0].name;
    if (managedTeams.length <= 3) return managedTeams.map(t => t.name).join(', ');
    return `${managedTeams.slice(0, 2).map(t => t.name).join(', ')} and ${managedTeams.length - 2} more`;
  }

  /**
   * Get total employee count across all managed teams
   */
  getTotalManagedEmployeeCount(teams: TeamInfo[]): number {
    const managedTeams = this.getUserManagedTeams(teams);
    return managedTeams.reduce((total, team) => total + team.memberCount, 0);
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
  canViewTeam(_team: TeamInfo, userRole: string): boolean {
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
   * Get user's managed teams (supports multiple teams per manager)
   */
  getUserManagedTeams(teams: TeamInfo[]): TeamInfo[] {
    return teams.filter(team => team.isManaged);
  }

  /**
   * Get user's primary managed team (backward compatibility)
   * @deprecated Use getUserManagedTeams() for multiple team support
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

  /**
   * Get available teams for member creation/editing
   */
  async getAvailableTeams(): Promise<TeamDto[]> {
    try {
      const response = await apiService.get<TeamDto[]>('/employee/teams');
      return response;
    } catch (error) {
      console.error('Failed to fetch available teams:', error);
      throw new Error('Failed to fetch available teams');
    }
  }

  /**
   * Get current user role from JWT token
   */
  private getCurrentUserRole(): string | null {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      // Decode JWT token (basic decoding without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
    } catch (error) {
      console.error('Failed to decode user role from token:', error);
      return null;
    }
  }

  /**
   * Helper method to decode token payload for debugging
   */
  private decodeTokenPayload(): any {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode token payload:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const teamService = new TeamService();
export default teamService;