import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto } from '../types/schedule';
import { TaskType } from '../types/database';

export interface TaskTypeTaskCount {
  taskTypeId: number;
  taskTypeName: string;
  taskCount: number;
  projectCount: number;
}

class TaskTypeTaskCountService {
  private taskCountCache: Map<number, { taskCount: number; projectCount: number }> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache

  /**
   * Get task and project counts for all task types based on live calendar assignments
   */
  async getTaskTypeTaskCounts(): Promise<TaskTypeTaskCount[]> {
    try {
      // Get current calendar assignments for a reasonable date range
      const today = new Date();
      const startDate = this.formatDate(this.getDateMinusDays(today, 30)); // 30 days ago
      const endDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      console.log('📊 TASK TYPE TASK COUNT - Date range being used:');
      console.log(`   📅 Start: ${startDate} (30 days ago)`);
      console.log(`   📅 End: ${endDate} (90 days ahead)`);
      console.log(`   📅 Today: ${this.formatDate(today)}`);

      const dateRange: DateRangeDto = {
        startDate,
        endDate
      };

      // Fetch all assignments in this range
      const assignments = await scheduleService.getAssignmentsByDateRange(dateRange);

      // Fetch all task types to map task type names to IDs
      const taskTypes = await databaseService.getTaskTypes();

      // Create a map of task type name to task type for faster lookup
      const taskTypeMap = new Map<string, TaskType>();
      taskTypes.forEach(taskType => {
        taskTypeMap.set(taskType.name.toLowerCase(), taskType);
      });

      // Count tasks and projects by task type
      const taskTypeCounts = new Map<number, { taskCount: number; projectSet: Set<string> }>();
      const taskTypeAssignments = new Map<string, AssignmentTaskDto[]>();

      assignments.forEach((assignment: AssignmentTaskDto) => {
        const taskTypeNameLower = assignment.taskTypeName?.toLowerCase() || '';
        const taskType = taskTypeMap.get(taskTypeNameLower);

        // Track assignments by task type name for debugging
        if (!taskTypeAssignments.has(taskTypeNameLower)) {
          taskTypeAssignments.set(taskTypeNameLower, []);
        }
        taskTypeAssignments.get(taskTypeNameLower)!.push(assignment);

        if (taskType && taskType.id) {
          if (!taskTypeCounts.has(taskType.id)) {
            taskTypeCounts.set(taskType.id, { taskCount: 0, projectSet: new Set<string>() });
          }

          const counts = taskTypeCounts.get(taskType.id)!;
          counts.taskCount++;
          counts.projectSet.add(assignment.projectName.toLowerCase());
        }
      });

      // Detailed logging for debugging
      console.log('🔍 TASK TYPE TASK COUNT DEBUG:');
      console.log('📊 Total assignments found:', assignments.length);
      console.log('📝 Task types found:', taskTypes.length);
      console.log('🗂️ Task type assignments breakdown:');

      taskTypeAssignments.forEach((assignments, taskTypeName) => {
        const taskType = taskTypeMap.get(taskTypeName);
        console.log(`  ${taskTypeName}: ${assignments.length} tasks`, taskType ? `(ID: ${taskType.id})` : '(NOT FOUND)');

        // Show DETAILED assignments for frequently used task types
        if (assignments.length > 2) {
          console.log(`    🔍 DETAILED ASSIGNMENTS for ${taskTypeName.toUpperCase()}:`);;
          assignments.slice(0, 5).forEach((a, index) => {
            console.log(`      ${index + 1}. Assignment ID: ${a.assignmentId}`);
            console.log(`         📋 Task: "${a.taskTitle}"`);
            console.log(`         📅 Date: ${a.assignedDate}`);
            console.log(`         👤 Employee: ${a.employeeName}`);
            console.log(`         🏢 Project: ${a.projectName}`);
            console.log(`         ⏰ Hours: ${a.hours || 'N/A'}`);
            console.log(`         ---`);
          });
          if (assignments.length > 5) {
            console.log(`      ... and ${assignments.length - 5} more`);
          }
          console.log(`    💯 TOTAL COUNT for ${taskTypeName.toUpperCase()}: ${assignments.length}`);
          console.log('');
        }
      });

      // Update cache
      const cacheMap = new Map<number, { taskCount: number; projectCount: number }>();
      taskTypeCounts.forEach((counts, taskTypeId) => {
        cacheMap.set(taskTypeId, {
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        });
      });
      this.taskCountCache = cacheMap;
      this.lastCacheUpdate = new Date();

      // Convert to result format
      const result: TaskTypeTaskCount[] = taskTypes.map(taskType => {
        const counts = taskTypeCounts.get(taskType.id!) || { taskCount: 0, projectSet: new Set() };
        return {
          taskTypeId: taskType.id!,
          taskTypeName: taskType.name,
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        };
      });

      console.log('🔢 FINAL TASK TYPE COUNTS:');
      result.forEach(r => {
        if (r.taskCount > 0 || r.projectCount > 0) {
          console.log(`  ${r.taskTypeName}: ${r.taskCount} tasks, ${r.projectCount} projects`);
        }
      });

      return result;

    } catch (error) {
      console.error('❌ TASK TYPE TASK COUNT SERVICE - Error calculating task type counts:', error);
      // Return empty counts on error
      const taskTypes = await databaseService.getTaskTypes();
      return taskTypes.map(taskType => ({
        taskTypeId: taskType.id!,
        taskTypeName: taskType.name,
        taskCount: 0,
        projectCount: 0
      }));
    }
  }

  /**
   * Get task and project count for a specific task type
   */
  async getTaskTypeTaskCount(taskTypeId: number): Promise<{ taskCount: number; projectCount: number }> {
    // Check if we have fresh cached data
    if (this.isCacheValid() && this.taskCountCache.has(taskTypeId)) {
      return this.taskCountCache.get(taskTypeId)!;
    }

    // Refresh cache and get all counts
    const allCounts = await this.getTaskTypeTaskCounts();
    const taskTypeCount = allCounts.find(t => t.taskTypeId === taskTypeId);
    return {
      taskCount: taskTypeCount?.taskCount || 0,
      projectCount: taskTypeCount?.projectCount || 0
    };
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.taskCountCache.clear();
    this.lastCacheUpdate = null;
    console.log('🔄 TASK TYPE TASK COUNT SERVICE - Cache invalidated');
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
export const taskTypeTaskCountService = new TaskTypeTaskCountService();
export default taskTypeTaskCountService;