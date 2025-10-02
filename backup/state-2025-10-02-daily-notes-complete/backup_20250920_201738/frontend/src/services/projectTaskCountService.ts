import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto } from '../types/schedule';
import { Project } from '../types/database';

export interface ProjectTaskCount {
  projectId: number;
  projectName: string;
  taskCount: number;
}

class ProjectTaskCountService {
  private taskCountCache: Map<number, number> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache

  /**
   * Get task counts for all projects based on live calendar assignments
   */
  async getProjectTaskCounts(): Promise<ProjectTaskCount[]> {
    try {
      // Get current calendar assignments for a reasonable date range
      const today = new Date();
      const startDate = this.formatDate(this.getDateMinusDays(today, 30)); // 30 days ago
      const endDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      console.log('📅 PROJECT TASK COUNT - Date range being used:');
      console.log(`   📅 Start: ${startDate} (30 days ago)`);
      console.log(`   📅 End: ${endDate} (90 days ahead)`);
      console.log(`   📅 Today: ${this.formatDate(today)}`);

      const dateRange: DateRangeDto = {
        startDate,
        endDate
      };

      // Fetch all assignments in this range
      const assignments = await scheduleService.getAssignmentsByDateRange(dateRange);

      // Fetch all projects to map project names to IDs
      const projects = await databaseService.getProjects();

      // Create a map of project name to project for faster lookup
      const projectMap = new Map<string, Project>();
      projects.forEach(project => {
        projectMap.set(project.name.toLowerCase(), project);
      });

      // Count tasks by project
      const taskCounts = new Map<number, number>();
      const projectAssignments = new Map<string, AssignmentTaskDto[]>();

      assignments.forEach((assignment: AssignmentTaskDto) => {
        const projectNameLower = assignment.projectName.toLowerCase();
        const project = projectMap.get(projectNameLower);

        // Track assignments by project name for debugging
        if (!projectAssignments.has(projectNameLower)) {
          projectAssignments.set(projectNameLower, []);
        }
        projectAssignments.get(projectNameLower)!.push(assignment);

        if (project && project.id) {
          const currentCount = taskCounts.get(project.id) || 0;
          taskCounts.set(project.id, currentCount + 1);
        }
      });

      // Detailed logging for debugging
      console.log('🔍 PROJECT TASK COUNT DEBUG:');
      console.log('📊 Total assignments found:', assignments.length);
      console.log('📁 Projects found:', projects.length);
      console.log('🗂️ Project assignments breakdown:');

      projectAssignments.forEach((assignments, projectName) => {
        const project = projectMap.get(projectName);
        console.log(`  ${projectName}: ${assignments.length} tasks`, project ? `(ID: ${project.id})` : '(NOT FOUND)');

        // Show DETAILED assignments for problematic projects
        if (projectName.includes('lhr05') || projectName.includes('lhr095') || projectName.includes('hel016')) {
          console.log(`    🔍 DETAILED ASSIGNMENTS for ${projectName.toUpperCase()}:`);
          assignments.forEach((a, index) => {
            console.log(`      ${index + 1}. Assignment ID: ${a.assignmentId}`);
            console.log(`         📋 Task: "${a.taskTitle}"`);
            console.log(`         📅 Date: ${a.assignedDate}`);
            console.log(`         👤 Employee: ${a.employeeName}`);
            console.log(`         🏢 Project: ${a.projectName}`);
            console.log(`         📝 Task Type: ${a.taskTypeName || 'N/A'}`);
            console.log(`         ⏰ Hours: ${a.hours || 'N/A'}`);
            console.log(`         🎰 Slot: ${a.slot || 'N/A'}`);
            console.log(`         ---`);
          });
          console.log(`    💯 TOTAL COUNT for ${projectName.toUpperCase()}: ${assignments.length}`);
          console.log('');
        }
      });

      // Update cache
      this.taskCountCache = taskCounts;
      this.lastCacheUpdate = new Date();

      // Convert to result format
      const result: ProjectTaskCount[] = projects.map(project => ({
        projectId: project.id!,
        projectName: project.name,
        taskCount: taskCounts.get(project.id!) || 0
      }));

      console.log('🔢 FINAL TASK COUNTS:');
      result.forEach(r => {
        if (r.taskCount > 0) {
          console.log(`  ${r.projectName}: ${r.taskCount} tasks`);
        }
      });

      return result;

    } catch (error) {
      console.error('❌ PROJECT TASK COUNT SERVICE - Error calculating task counts:', error);
      // Return empty counts on error
      const projects = await databaseService.getProjects();
      return projects.map(project => ({
        projectId: project.id!,
        projectName: project.name,
        taskCount: 0
      }));
    }
  }

  /**
   * Get task count for a specific project
   */
  async getProjectTaskCount(projectId: number): Promise<number> {
    // Check if we have fresh cached data
    if (this.isCacheValid() && this.taskCountCache.has(projectId)) {
      return this.taskCountCache.get(projectId)!;
    }

    // Refresh cache and get all counts
    const allCounts = await this.getProjectTaskCounts();
    const projectCount = allCounts.find(p => p.projectId === projectId);
    return projectCount?.taskCount || 0;
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.taskCountCache.clear();
    this.lastCacheUpdate = null;
    console.log('🔄 PROJECT TASK COUNT SERVICE - Cache invalidated');
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
export const projectTaskCountService = new ProjectTaskCountService();
export default projectTaskCountService;