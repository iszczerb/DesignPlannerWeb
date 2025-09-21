import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto } from '../types/schedule';
import { Skill, TaskType } from '../types/database';

export interface SkillTaskCount {
  skillId: number;
  skillName: string;
  taskCount: number;
  projectCount: number;
  taskTypeCount: number; // Keep existing task type count
}

class SkillTaskCountService {
  private taskCountCache: Map<number, { taskCount: number; projectCount: number; taskTypeCount: number }> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache

  /**
   * Get task and project counts for all skills based on live calendar assignments
   */
  async getSkillTaskCounts(): Promise<SkillTaskCount[]> {
    try {
      // Get current calendar assignments for a reasonable date range
      const today = new Date();
      const startDate = this.formatDate(this.getDateMinusDays(today, 30)); // 30 days ago
      const endDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      console.log('🛠️ SKILL TASK COUNT - Date range being used:');
      console.log(`   📅 Start: ${startDate} (30 days ago)`);
      console.log(`   📅 End: ${endDate} (90 days ahead)`);
      console.log(`   📅 Today: ${this.formatDate(today)}`);

      const dateRange: DateRangeDto = {
        startDate,
        endDate
      };

      // Fetch all assignments in this range
      const assignments = await scheduleService.getAssignmentsByDateRange(dateRange);

      // Fetch all skills and task types to map relationships
      const skills = await databaseService.getSkills();
      const taskTypes = await databaseService.getTaskTypes();

      // Create maps for efficient lookup
      const skillMap = new Map<string, Skill>();
      skills.forEach(skill => {
        skillMap.set(skill.name.toLowerCase(), skill);
      });

      const taskTypeMap = new Map<string, TaskType>();
      taskTypes.forEach(taskType => {
        taskTypeMap.set(taskType.name.toLowerCase(), taskType);
      });

      // Count tasks and projects by skill through task types
      const skillCounts = new Map<number, { taskCount: number; projectSet: Set<string> }>();
      const skillAssignments = new Map<string, AssignmentTaskDto[]>();

      assignments.forEach((assignment: AssignmentTaskDto) => {
        const taskTypeNameLower = assignment.taskTypeName?.toLowerCase() || '';
        const taskType = taskTypeMap.get(taskTypeNameLower);

        if (taskType && taskType.skills && Array.isArray(taskType.skills)) {
          // For each skill in the task type
          taskType.skills.forEach(skillId => {
            // Find the skill by ID
            const skill = skills.find(s => s.id === skillId);
            if (skill) {
              const skillNameLower = skill.name.toLowerCase();

              // Track assignments by skill name for debugging
              if (!skillAssignments.has(skillNameLower)) {
                skillAssignments.set(skillNameLower, []);
              }
              skillAssignments.get(skillNameLower)!.push(assignment);

              if (!skillCounts.has(skill.id!)) {
                skillCounts.set(skill.id!, { taskCount: 0, projectSet: new Set<string>() });
              }

              const counts = skillCounts.get(skill.id!)!;
              counts.taskCount++;
              counts.projectSet.add(assignment.projectName.toLowerCase());
            }
          });
        }
      });

      // Detailed logging for debugging
      console.log('🔍 SKILL TASK COUNT DEBUG:');
      console.log('📊 Total assignments found:', assignments.length);
      console.log('🛠️ Skills found:', skills.length);
      console.log('📝 Task types found:', taskTypes.length);
      console.log('🗂️ Skill assignments breakdown:');

      skillAssignments.forEach((assignments, skillName) => {
        const skill = skillMap.get(skillName);
        console.log(`  ${skillName}: ${assignments.length} tasks`, skill ? `(ID: ${skill.id})` : '(NOT FOUND)');

        // Show DETAILED assignments for frequently used skills
        if (assignments.length > 2) {
          console.log(`    🔍 DETAILED ASSIGNMENTS for ${skillName.toUpperCase()}:`);
          assignments.slice(0, 5).forEach((a, index) => {
            console.log(`      ${index + 1}. Assignment ID: ${a.assignmentId}`);
            console.log(`         📋 Task: "${a.taskTitle}"`);
            console.log(`         📅 Date: ${a.assignedDate}`);
            console.log(`         👤 Employee: ${a.employeeName}`);
            console.log(`         🏢 Project: ${a.projectName}`);
            console.log(`         📝 Task Type: ${a.taskTypeName || 'N/A'}`);
            console.log(`         ⏰ Hours: ${a.hours || 'N/A'}`);
            console.log(`         ---`);
          });
          if (assignments.length > 5) {
            console.log(`      ... and ${assignments.length - 5} more`);
          }
          console.log(`    💯 TOTAL COUNT for ${skillName.toUpperCase()}: ${assignments.length}`);
          console.log('');
        }
      });

      // Update cache
      const cacheMap = new Map<number, { taskCount: number; projectCount: number; taskTypeCount: number }>();
      skillCounts.forEach((counts, skillId) => {
        const skill = skills.find(s => s.id === skillId);
        const taskTypeCount = skill?.taskTypesCount || 0; // Get existing task type count
        cacheMap.set(skillId, {
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size,
          taskTypeCount: taskTypeCount
        });
      });

      // Also add skills that have no live assignments but may have task type counts
      skills.forEach(skill => {
        if (!cacheMap.has(skill.id!)) {
          cacheMap.set(skill.id!, {
            taskCount: 0,
            projectCount: 0,
            taskTypeCount: skill.taskTypesCount || 0
          });
        }
      });

      this.taskCountCache = cacheMap;
      this.lastCacheUpdate = new Date();

      // Convert to result format
      const result: SkillTaskCount[] = skills.map(skill => {
        const counts = skillCounts.get(skill.id!) || { taskCount: 0, projectSet: new Set() };
        return {
          skillId: skill.id!,
          skillName: skill.name,
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size,
          taskTypeCount: skill.taskTypesCount || 0
        };
      });

      console.log('🔢 FINAL SKILL COUNTS:');
      result.forEach(r => {
        if (r.taskCount > 0 || r.projectCount > 0 || r.taskTypeCount > 0) {
          console.log(`  ${r.skillName}: ${r.taskCount} tasks, ${r.projectCount} projects, ${r.taskTypeCount} task types`);
        }
      });

      return result;

    } catch (error) {
      console.error('❌ SKILL TASK COUNT SERVICE - Error calculating skill counts:', error);
      // Return empty counts on error
      const skills = await databaseService.getSkills();
      return skills.map(skill => ({
        skillId: skill.id!,
        skillName: skill.name,
        taskCount: 0,
        projectCount: 0,
        taskTypeCount: skill.taskTypesCount || 0
      }));
    }
  }

  /**
   * Get task and project count for a specific skill
   */
  async getSkillTaskCount(skillId: number): Promise<{ taskCount: number; projectCount: number; taskTypeCount: number }> {
    // Check if we have fresh cached data
    if (this.isCacheValid() && this.taskCountCache.has(skillId)) {
      return this.taskCountCache.get(skillId)!;
    }

    // Refresh cache and get all counts
    const allCounts = await this.getSkillTaskCounts();
    const skillCount = allCounts.find(s => s.skillId === skillId);
    return {
      taskCount: skillCount?.taskCount || 0,
      projectCount: skillCount?.projectCount || 0,
      taskTypeCount: skillCount?.taskTypeCount || 0
    };
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.taskCountCache.clear();
    this.lastCacheUpdate = null;
    console.log('🔄 SKILL TASK COUNT SERVICE - Cache invalidated');
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
export const skillTaskCountService = new SkillTaskCountService();
export default skillTaskCountService;