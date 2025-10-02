import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto, EmployeeScheduleDto } from '../types/schedule';

export interface TeamMemberStats {
  employeeId: number;
  employeeName: string;
  team: string;
  totalHours: number;
  totalTasks: number;
  totalProjects: number;
  totalClients: number;
  totalCategories: number;
  totalSkills: number;
  weeklyBreakdown: WeeklyStats[];
  monthlyBreakdown: MonthlyStats[];
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  totalHours: number;
  totalTasks: number;
  projects: string[];
  clients: string[];
  categories: string[];
  dailyBreakdown: DailyStats[];
}

export interface MonthlyStats {
  month: number;
  year: number;
  monthName: string;
  totalHours: number;
  totalTasks: number;
  projects: string[];
  clients: string[];
  categories: string[];
  weeklyBreakdown: WeeklyStats[];
}

export interface DailyStats {
  date: string;
  dayOfWeek: string;
  hours: number;
  tasks: number;
  projects: string[];
}

class TeamMemberStatsService {
  private statsCache: Map<number, TeamMemberStats> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 60000; // 1 minute cache

  /**
   * Get comprehensive statistics for a team member
   */
  async getTeamMemberStats(employeeId: number, dateRange?: { startDate: string; endDate: string }): Promise<TeamMemberStats> {
    try {
      // Use provided date range or default to wider range
      const today = new Date();
      const defaultStartDate = this.formatDate(this.getDateMinusDays(today, 90)); // 90 days ago
      const defaultEndDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      const range: DateRangeDto = {
        startDate: dateRange?.startDate || defaultStartDate,
        endDate: dateRange?.endDate || defaultEndDate
      };


      // Fetch all assignments for this employee in the date range
      const assignments = await scheduleService.getAssignmentsByDateRange(range);
      const employeeAssignments = assignments.filter(a => a.employeeId === employeeId);


      // Get employee info
      const usersResponse = await databaseService.getUsers();
      const employees = usersResponse.users || [];
      const employee = employees.find(e => e.id === employeeId);

      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      // Get projects, clients, categories, and task types for mapping
      const [projects, clients, categories, taskTypes] = await Promise.all([
        databaseService.getProjects(),
        databaseService.getClients(),
        databaseService.getCategories(),
        databaseService.getTaskTypes()
      ]);

      // Create maps for efficient lookup
      const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p]));
      const clientMap = new Map(clients.map(c => [c.name.toLowerCase(), c]));
      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));

      // Calculate overall statistics
      const uniqueProjects = new Set<string>();
      const uniqueClients = new Set<string>();
      const uniqueCategories = new Set<string>();
      const uniqueSkills = new Set<number>();
      let totalHours = 0;

      // Process each assignment to extract statistics
      employeeAssignments.forEach(assignment => {
        // Add hours (assuming 4 hours per assignment if not specified)
        totalHours += assignment.hours || 4;

        // Track unique projects
        uniqueProjects.add(assignment.projectName);

        // Find client and category through project
        const project = projectMap.get(assignment.projectName.toLowerCase());
        if (project) {
          // Add client
          if (project.clientId) {
            const client = clients.find(c => c.id === project.clientId);
            if (client) {
              uniqueClients.add(client.name);
            }
          }

          // Add category
          if (project.categoryId) {
            const category = categories.find(c => c.id === project.categoryId);
            if (category) {
              uniqueCategories.add(category.name);
            }
          }
        }

        // Add skills through task type (assignments have taskTypeName, not taskTypeId)
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

      // Generate weekly breakdown
      const weeklyBreakdown = this.generateWeeklyBreakdown(employeeAssignments, projectMap, clients, categories);

      // Generate monthly breakdown
      const monthlyBreakdown = this.generateMonthlyBreakdown(weeklyBreakdown);

      // Get the team name if available
      let teamName = 'No Team';
      if (employee.teamId) {
        try {
          const teams = await databaseService.getTeams();
          const team = teams.find(t => t.id === employee.teamId);
          teamName = team ? team.name : `Team ${employee.teamId}`;
        } catch (error) {
          console.log('Could not fetch team info:', error);
          teamName = `Team ${employee.teamId}`;
        }
      }

      const stats: TeamMemberStats = {
        employeeId,
        employeeName: employee.firstName && employee.lastName
          ? `${employee.firstName} ${employee.lastName}`
          : employee.username,
        team: teamName,
        totalHours,
        totalTasks: employeeAssignments.length,
        totalProjects: uniqueProjects.size,
        totalClients: uniqueClients.size,
        totalCategories: uniqueCategories.size,
        totalSkills: uniqueSkills.size,
        weeklyBreakdown,
        monthlyBreakdown
      };

      // Cache the result
      this.statsCache.set(employeeId, stats);
      this.lastCacheUpdate = new Date();

      return stats;

    } catch (error) {
      console.error('❌ TEAM MEMBER STATS SERVICE - Error calculating stats:', error);
      throw error;
    }
  }

  /**
   * Generate weekly breakdown of statistics
   */
  private generateWeeklyBreakdown(
    assignments: AssignmentTaskDto[],
    projectMap: Map<string, any>,
    clients: any[],
    categories: any[]
  ): WeeklyStats[] {

    const weeklyMap = new Map<string, {
      assignments: AssignmentTaskDto[];
      projects: Set<string>;
      clients: Set<string>;
      categories: Set<string>;
    }>();

    // Group assignments by week
    assignments.forEach(assignment => {
      const date = new Date(assignment.assignedDate);
      const weekKey = this.getWeekKey(date);

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          assignments: [],
          projects: new Set(),
          clients: new Set(),
          categories: new Set()
        });
      }

      const weekData = weeklyMap.get(weekKey)!;
      weekData.assignments.push(assignment);
      weekData.projects.add(assignment.projectName);

      // Add client and category through project lookup
      const project = projectMap.get(assignment.projectName.toLowerCase());
      if (project) {
        if (project.clientId) {
          const client = clients.find(c => c.id === project.clientId);
          if (client) weekData.clients.add(client.name);
        }
        if (project.categoryId) {
          const category = categories.find(c => c.id === project.categoryId);
          if (category) weekData.categories.add(category.name);
        }
      }
    });

    // Convert to WeeklyStats array
    const weeklyStats: WeeklyStats[] = [];

    weeklyMap.forEach((data, weekKey) => {
      const [year, week] = weekKey.split('-W').map(Number);
      const { weekStart, weekEnd } = this.getWeekDateRange(year, week);

      // Generate daily breakdown for this week
      const dailyBreakdown = this.generateDailyBreakdown(data.assignments, weekStart, weekEnd);

      weeklyStats.push({
        weekStart: this.formatDate(weekStart),
        weekEnd: this.formatDate(weekEnd),
        weekNumber: week,
        year,
        totalHours: data.assignments.reduce((sum, a) => sum + (a.hours || 4), 0),
        totalTasks: data.assignments.length,
        projects: Array.from(data.projects),
        clients: Array.from(data.clients),
        categories: Array.from(data.categories),
        dailyBreakdown
      });
    });

    return weeklyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  }

  /**
   * Generate monthly breakdown from weekly data
   */
  private generateMonthlyBreakdown(weeklyBreakdown: WeeklyStats[]): MonthlyStats[] {
    const monthlyMap = new Map<string, {
      weeks: WeeklyStats[];
      projects: Set<string>;
      clients: Set<string>;
      categories: Set<string>;
    }>();

    weeklyBreakdown.forEach(week => {
      const monthKey = `${week.year}-${String(new Date(week.weekStart).getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          weeks: [],
          projects: new Set(),
          clients: new Set(),
          categories: new Set()
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.weeks.push(week);
      week.projects.forEach(p => monthData.projects.add(p));
      week.clients.forEach(c => monthData.clients.add(c));
      week.categories.forEach(cat => monthData.categories.add(cat));
    });

    const monthlyStats: MonthlyStats[] = [];

    monthlyMap.forEach((data, monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      monthlyStats.push({
        month,
        year,
        monthName: monthNames[month - 1],
        totalHours: data.weeks.reduce((sum, w) => sum + w.totalHours, 0),
        totalTasks: data.weeks.reduce((sum, w) => sum + w.totalTasks, 0),
        projects: Array.from(data.projects),
        clients: Array.from(data.clients),
        categories: Array.from(data.categories),
        weeklyBreakdown: data.weeks.sort((a, b) => a.weekNumber - b.weekNumber)
      });
    });

    return monthlyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  /**
   * Generate daily breakdown for a week
   */
  private generateDailyBreakdown(assignments: AssignmentTaskDto[], weekStart: Date, weekEnd: Date): DailyStats[] {

    const dailyMap = new Map<string, { assignments: AssignmentTaskDto[]; projects: Set<string> }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize all days of the week
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = this.formatDate(d);
      dailyMap.set(dateKey, { assignments: [], projects: new Set() });
    }

    // Group assignments by day
    assignments.forEach(assignment => {
      // Extract date part directly from ISO string to avoid timezone issues
      const dateKey = assignment.assignedDate.split('T')[0]; // Get YYYY-MM-DD part

      if (dailyMap.has(dateKey)) {
        const dayData = dailyMap.get(dateKey)!;
        dayData.assignments.push(assignment);
        dayData.projects.add(assignment.projectName);
      }
    });

    // Convert to DailyStats array
    const dailyStats: DailyStats[] = [];
    dailyMap.forEach((data, dateKey) => {
      const date = new Date(dateKey);
      dailyStats.push({
        date: dateKey,
        dayOfWeek: dayNames[date.getDay()],
        hours: data.assignments.reduce((sum, a) => sum + (a.hours || 4), 0),
        tasks: data.assignments.length,
        projects: Array.from(data.projects)
      });
    });

    return dailyStats.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get week key for grouping (ISO week format)
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get week date range from year and week number
   */
  private getWeekDateRange(year: number, week: number): { weekStart: Date; weekEnd: Date } {
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    weekStart.setDate(weekStart.getDate() - jan4.getDay() + 1);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return { weekStart, weekEnd };
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
export const teamMemberStatsService = new TeamMemberStatsService();
export default teamMemberStatsService;