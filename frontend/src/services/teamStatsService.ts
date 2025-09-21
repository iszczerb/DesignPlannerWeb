import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { teamMemberStatsService, TeamMemberStats, WeeklyStats, MonthlyStats } from './teamMemberStatsService';
import { DateRangeDto, EmployeeCalendarDto } from '../types/schedule';

export interface TeamStats {
  teamId: number;
  teamName: string;
  memberCount: number;
  activeMemberCount: number;
  totalHours: number;
  totalTasks: number;
  totalProjects: number;
  totalClients: number;
  totalCategories: number;
  totalSkills: number;
  weeklyBreakdown: WeeklyStats[];
  monthlyBreakdown: MonthlyStats[];
  members: TeamMemberStats[];
}

class TeamStatsService {
  private statsCache: Map<number, TeamStats> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 60000; // 1 minute cache

  /**
   * Get comprehensive statistics for a team
   */
  async getTeamStats(
    teamId: number,
    teamMembers: EmployeeCalendarDto[],
    dateRange?: { startDate: string; endDate: string }
  ): Promise<TeamStats> {
    try {
      // Get team information
      const teams = await databaseService.getTeams();
      const team = teams.find(t => t.id === teamId);
      const teamName = team ? team.name : `Team ${teamId}`;

      // Get stats for each team member
      const memberStatsPromises = teamMembers.map(member =>
        teamMemberStatsService.getTeamMemberStats(member.employeeId, dateRange)
      );

      const memberStats = await Promise.all(memberStatsPromises);

      // Override the team names with the correct structural team names from EmployeeCalendarDto
      memberStats.forEach((stats, index) => {
        stats.team = teamMembers[index].team; // Use the structural team name from the calendar data
      });

      // Aggregate team-level statistics
      const uniqueProjects = new Set<string>();
      const uniqueClients = new Set<string>();
      const uniqueCategories = new Set<string>();
      const uniqueSkills = new Set<number>();

      let totalHours = 0;
      let totalTasks = 0;

      // Aggregate all member statistics
      memberStats.forEach(member => {
        totalHours += member.totalHours;
        totalTasks += member.totalTasks;

        // Note: Projects, clients, categories are already aggregated at member level
        // We need to aggregate them again at team level
        // For this, we would need access to the raw assignments again
        // For now, we'll use the individual member counts as approximations
      });

      // For proper team-level aggregation, we need to get all assignments for team members
      const today = new Date();
      const defaultStartDate = this.formatDate(this.getDateMinusDays(today, 90));
      const defaultEndDate = this.formatDate(this.getDatePlusDays(today, 90));

      const range: DateRangeDto = {
        startDate: dateRange?.startDate || defaultStartDate,
        endDate: dateRange?.endDate || defaultEndDate
      };

      // Get all assignments for team members
      const allAssignments = await scheduleService.getAssignmentsByDateRange(range);
      const teamAssignments = allAssignments.filter(assignment =>
        teamMembers.some(member => member.employeeId === assignment.employeeId)
      );

      // Get reference data for aggregation
      const [projects, clients, categories, taskTypes] = await Promise.all([
        databaseService.getProjects(),
        databaseService.getClients(),
        databaseService.getCategories(),
        databaseService.getTaskTypes()
      ]);

      // Create maps for efficient lookup
      const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p]));

      // Aggregate unique values across all team assignments
      teamAssignments.forEach(assignment => {
        uniqueProjects.add(assignment.projectName);

        // Find client through project
        const project = projectMap.get(assignment.projectName.toLowerCase());
        if (project && project.clientId) {
          const client = clients.find(c => c.id === project.clientId);
          if (client) {
            uniqueClients.add(client.name);
          }
        }

        // Find category through project
        if (project && project.categoryId) {
          const category = categories.find(c => c.id === project.categoryId);
          if (category) {
            uniqueCategories.add(category.name);
          }
        }

        // Add skills through task type
        if (assignment.taskTypeName) {
          const taskType = taskTypes.find(tt => tt.name === assignment.taskTypeName);
          if (taskType && taskType.skills && Array.isArray(taskType.skills)) {
            taskType.skills.forEach(skillId => {
              if (typeof skillId === 'number') {
                uniqueSkills.add(skillId);
              }
            });
          }
        }
      });

      // Generate aggregated weekly/monthly breakdowns
      const weeklyBreakdown = this.aggregateWeeklyBreakdowns(memberStats.map(m => m.weeklyBreakdown));
      const monthlyBreakdown = this.aggregateMonthlyBreakdowns(memberStats.map(m => m.monthlyBreakdown));

      const teamStats: TeamStats = {
        teamId,
        teamName,
        memberCount: teamMembers.length,
        activeMemberCount: teamMembers.length, // All team members are active
        totalHours,
        totalTasks,
        totalProjects: uniqueProjects.size,
        totalClients: uniqueClients.size,
        totalCategories: uniqueCategories.size,
        totalSkills: uniqueSkills.size,
        weeklyBreakdown,
        monthlyBreakdown,
        members: memberStats
      };

      // Cache the result
      this.statsCache.set(teamId, teamStats);
      this.lastCacheUpdate = new Date();

      return teamStats;

    } catch (error) {
      console.error('❌ TEAM STATS SERVICE - Error calculating team stats:', error);
      throw error;
    }
  }

  /**
   * Aggregate weekly breakdowns from multiple members
   */
  private aggregateWeeklyBreakdowns(memberWeeklyBreakdowns: WeeklyStats[][]): WeeklyStats[] {
    const weeklyMap = new Map<string, {
      weekStart: string;
      weekEnd: string;
      weekNumber: number;
      year: number;
      totalHours: number;
      totalTasks: number;
      projects: Set<string>;
      clients: Set<string>;
      categories: Set<string>;
    }>();

    // Aggregate all member weekly data
    memberWeeklyBreakdowns.forEach(memberWeeks => {
      memberWeeks.forEach(week => {
        const weekKey = `${week.year}-W${String(week.weekNumber).padStart(2, '0')}`;

        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, {
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            weekNumber: week.weekNumber,
            year: week.year,
            totalHours: 0,
            totalTasks: 0,
            projects: new Set(),
            clients: new Set(),
            categories: new Set()
          });
        }

        const weekData = weeklyMap.get(weekKey)!;
        weekData.totalHours += week.totalHours;
        weekData.totalTasks += week.totalTasks;
        week.projects.forEach(p => weekData.projects.add(p));
        week.clients.forEach(c => weekData.clients.add(c));
        week.categories.forEach(cat => weekData.categories.add(cat));
      });
    });

    // Convert to WeeklyStats array
    const weeklyStats: WeeklyStats[] = [];
    weeklyMap.forEach((data, weekKey) => {
      weeklyStats.push({
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        weekNumber: data.weekNumber,
        year: data.year,
        totalHours: data.totalHours,
        totalTasks: data.totalTasks,
        projects: Array.from(data.projects),
        clients: Array.from(data.clients),
        categories: Array.from(data.categories),
        dailyBreakdown: [] // For teams, we don't need daily breakdown
      });
    });

    return weeklyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  }

  /**
   * Aggregate monthly breakdowns from multiple members
   */
  private aggregateMonthlyBreakdowns(memberMonthlyBreakdowns: MonthlyStats[][]): MonthlyStats[] {
    const monthlyMap = new Map<string, {
      month: number;
      year: number;
      monthName: string;
      totalHours: number;
      totalTasks: number;
      projects: Set<string>;
      clients: Set<string>;
      categories: Set<string>;
      weeks: WeeklyStats[];
    }>();

    // Aggregate all member monthly data
    memberMonthlyBreakdowns.forEach(memberMonths => {
      memberMonths.forEach(month => {
        const monthKey = `${month.year}-${String(month.month).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: month.month,
            year: month.year,
            monthName: month.monthName,
            totalHours: 0,
            totalTasks: 0,
            projects: new Set(),
            clients: new Set(),
            categories: new Set(),
            weeks: []
          });
        }

        const monthData = monthlyMap.get(monthKey)!;
        monthData.totalHours += month.totalHours;
        monthData.totalTasks += month.totalTasks;
        month.projects.forEach(p => monthData.projects.add(p));
        month.clients.forEach(c => monthData.clients.add(c));
        month.categories.forEach(cat => monthData.categories.add(cat));
      });
    });

    // Convert to MonthlyStats array
    const monthlyStats: MonthlyStats[] = [];
    monthlyMap.forEach((data, monthKey) => {
      monthlyStats.push({
        month: data.month,
        year: data.year,
        monthName: data.monthName,
        totalHours: data.totalHours,
        totalTasks: data.totalTasks,
        projects: Array.from(data.projects),
        clients: Array.from(data.clients),
        categories: Array.from(data.categories),
        weeklyBreakdown: [] // For teams, we aggregate weekly data separately
      });
    });

    return monthlyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.statsCache.clear();
    this.lastCacheUpdate = null;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.lastCacheUpdate) return false;
    const now = new Date();
    const diff = now.getTime() - this.lastCacheUpdate.getTime();
    return diff < this.CACHE_DURATION_MS;
  }

  /**
   * Format date for API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date minus specified days
   */
  private getDateMinusDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Get date plus specified days
   */
  private getDatePlusDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

// Export singleton instance
export const teamStatsService = new TeamStatsService();
export default teamStatsService;