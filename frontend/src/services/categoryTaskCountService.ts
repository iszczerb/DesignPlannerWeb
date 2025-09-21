import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto } from '../types/schedule';
import { Category } from '../types/database';

export interface CategoryTaskCount {
  categoryId: number;
  categoryName: string;
  taskCount: number;
  projectCount: number;
}

class CategoryTaskCountService {
  private taskCountCache: Map<number, { taskCount: number; projectCount: number }> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache

  /**
   * Get task and project counts for all categories based on live calendar assignments
   */
  async getCategoryTaskCounts(): Promise<CategoryTaskCount[]> {
    try {
      // Get current calendar assignments for a reasonable date range
      const today = new Date();
      const startDate = this.formatDate(this.getDateMinusDays(today, 30)); // 30 days ago
      const endDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      console.log('📂 CATEGORY TASK COUNT - Date range being used:');
      console.log(`   📅 Start: ${startDate} (30 days ago)`);
      console.log(`   📅 End: ${endDate} (90 days ahead)`);
      console.log(`   📅 Today: ${this.formatDate(today)}`);

      const dateRange: DateRangeDto = {
        startDate,
        endDate
      };

      // Fetch all assignments in this range
      const assignments = await scheduleService.getAssignmentsByDateRange(dateRange);

      // Fetch all categories and projects to map relationships
      const categories = await databaseService.getCategories();
      const projects = await databaseService.getProjects();

      // Create maps for efficient lookup
      const categoryMap = new Map<string, Category>();
      categories.forEach(category => {
        categoryMap.set(category.name.toLowerCase(), category);
      });

      // Create a map of project name to category ID
      const projectToCategoryMap = new Map<string, number>();
      projects.forEach(project => {
        if (project.categoryId) {
          projectToCategoryMap.set(project.name.toLowerCase(), project.categoryId);
        }
      });

      // Count tasks and projects by category through project relationships
      const categoryCounts = new Map<number, { taskCount: number; projectSet: Set<string> }>();
      const categoryAssignments = new Map<string, AssignmentTaskDto[]>();

      assignments.forEach((assignment: AssignmentTaskDto) => {
        const projectNameLower = assignment.projectName.toLowerCase();
        const categoryId = projectToCategoryMap.get(projectNameLower);

        if (categoryId) {
          // Find the category by ID
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            const categoryNameLower = category.name.toLowerCase();

            // Track assignments by category name for debugging
            if (!categoryAssignments.has(categoryNameLower)) {
              categoryAssignments.set(categoryNameLower, []);
            }
            categoryAssignments.get(categoryNameLower)!.push(assignment);

            if (!categoryCounts.has(categoryId)) {
              categoryCounts.set(categoryId, { taskCount: 0, projectSet: new Set<string>() });
            }

            const counts = categoryCounts.get(categoryId)!;
            counts.taskCount++;
            counts.projectSet.add(assignment.projectName.toLowerCase());
          }
        }
      });

      // Detailed logging for debugging
      console.log('🔍 CATEGORY TASK COUNT DEBUG:');
      console.log('📊 Total assignments found:', assignments.length);
      console.log('📂 Categories found:', categories.length);
      console.log('📁 Projects found:', projects.length);
      console.log('🗂️ Category assignments breakdown:');

      categoryAssignments.forEach((assignments, categoryName) => {
        const category = categoryMap.get(categoryName);
        console.log(`  ${categoryName}: ${assignments.length} tasks`, category ? `(ID: ${category.id})` : '(NOT FOUND)');

        // Show DETAILED assignments for frequently used categories
        if (assignments.length > 2) {
          console.log(`    🔍 DETAILED ASSIGNMENTS for ${categoryName.toUpperCase()}:`);
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
          console.log(`    💯 TOTAL COUNT for ${categoryName.toUpperCase()}: ${assignments.length}`);
          console.log('');
        }
      });

      // Update cache
      const cacheMap = new Map<number, { taskCount: number; projectCount: number }>();
      categoryCounts.forEach((counts, categoryId) => {
        cacheMap.set(categoryId, {
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        });
      });

      // Also add categories that have no live assignments
      categories.forEach(category => {
        if (!cacheMap.has(category.id!)) {
          cacheMap.set(category.id!, {
            taskCount: 0,
            projectCount: 0
          });
        }
      });

      this.taskCountCache = cacheMap;
      this.lastCacheUpdate = new Date();

      // Convert to result format
      const result: CategoryTaskCount[] = categories.map(category => {
        const counts = categoryCounts.get(category.id!) || { taskCount: 0, projectSet: new Set() };
        return {
          categoryId: category.id!,
          categoryName: category.name,
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        };
      });

      console.log('🔢 FINAL CATEGORY COUNTS:');
      result.forEach(r => {
        if (r.taskCount > 0 || r.projectCount > 0) {
          console.log(`  ${r.categoryName}: ${r.taskCount} tasks, ${r.projectCount} projects`);
        }
      });

      return result;

    } catch (error) {
      console.error('❌ CATEGORY TASK COUNT SERVICE - Error calculating category counts:', error);
      // Return empty counts on error
      const categories = await databaseService.getCategories();
      return categories.map(category => ({
        categoryId: category.id!,
        categoryName: category.name,
        taskCount: 0,
        projectCount: 0
      }));
    }
  }

  /**
   * Get task and project count for a specific category
   */
  async getCategoryTaskCount(categoryId: number): Promise<{ taskCount: number; projectCount: number }> {
    // Check if we have fresh cached data
    if (this.isCacheValid() && this.taskCountCache.has(categoryId)) {
      return this.taskCountCache.get(categoryId)!;
    }

    // Refresh cache and get all counts
    const allCounts = await this.getCategoryTaskCounts();
    const categoryCount = allCounts.find(c => c.categoryId === categoryId);
    return {
      taskCount: categoryCount?.taskCount || 0,
      projectCount: categoryCount?.projectCount || 0
    };
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.taskCountCache.clear();
    this.lastCacheUpdate = null;
    console.log('🔄 CATEGORY TASK COUNT SERVICE - Cache invalidated');
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
export const categoryTaskCountService = new CategoryTaskCountService();
export default categoryTaskCountService;