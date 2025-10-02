import { scheduleService } from './scheduleService';
import { databaseService } from './databaseService';
import { AssignmentTaskDto, DateRangeDto } from '../types/schedule';
import { Client } from '../types/database';

export interface ClientTaskCount {
  clientId: number;
  clientName: string;
  taskCount: number;
  projectCount: number;
}

class ClientTaskCountService {
  private taskCountCache: Map<number, { taskCount: number; projectCount: number }> = new Map();
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds cache

  /**
   * Get task and project counts for all clients based on live calendar assignments
   */
  async getClientTaskCounts(): Promise<ClientTaskCount[]> {
    try {
      // Get current calendar assignments for a reasonable date range
      const today = new Date();
      const startDate = this.formatDate(this.getDateMinusDays(today, 30)); // 30 days ago
      const endDate = this.formatDate(this.getDatePlusDays(today, 90)); // 90 days ahead

      console.log('🏢 CLIENT TASK COUNT - Date range being used:');
      console.log(`   📅 Start: ${startDate} (30 days ago)`);
      console.log(`   📅 End: ${endDate} (90 days ahead)`);
      console.log(`   📅 Today: ${this.formatDate(today)}`);

      const dateRange: DateRangeDto = {
        startDate,
        endDate
      };

      // Fetch all assignments in this range
      const assignments = await scheduleService.getAssignmentsByDateRange(dateRange);

      // Fetch all clients and projects to map relationships
      const clients = await databaseService.getClients();
      const projects = await databaseService.getProjects();

      // Create maps for efficient lookup
      const clientMap = new Map<string, Client>();
      clients.forEach(client => {
        clientMap.set(client.name.toLowerCase(), client);
      });

      // Create a map of project name to client ID
      const projectToClientMap = new Map<string, number>();
      projects.forEach(project => {
        if (project.clientId) {
          projectToClientMap.set(project.name.toLowerCase(), project.clientId);
        }
      });

      // Count tasks and projects by client through project relationships
      const clientCounts = new Map<number, { taskCount: number; projectSet: Set<string> }>();
      const clientAssignments = new Map<string, AssignmentTaskDto[]>();

      assignments.forEach((assignment: AssignmentTaskDto) => {
        const projectNameLower = assignment.projectName.toLowerCase();
        const clientId = projectToClientMap.get(projectNameLower);

        if (clientId) {
          // Find the client by ID
          const client = clients.find(c => c.id === clientId);
          if (client) {
            const clientNameLower = client.name.toLowerCase();

            // Track assignments by client name for debugging
            if (!clientAssignments.has(clientNameLower)) {
              clientAssignments.set(clientNameLower, []);
            }
            clientAssignments.get(clientNameLower)!.push(assignment);

            if (!clientCounts.has(clientId)) {
              clientCounts.set(clientId, { taskCount: 0, projectSet: new Set<string>() });
            }

            const counts = clientCounts.get(clientId)!;
            counts.taskCount++;
            counts.projectSet.add(assignment.projectName.toLowerCase());
          }
        }
      });

      // Detailed logging for debugging
      console.log('🔍 CLIENT TASK COUNT DEBUG:');
      console.log('📊 Total assignments found:', assignments.length);
      console.log('🏢 Clients found:', clients.length);
      console.log('📁 Projects found:', projects.length);
      console.log('🗂️ Client assignments breakdown:');

      clientAssignments.forEach((assignments, clientName) => {
        const client = clientMap.get(clientName);
        console.log(`  ${clientName}: ${assignments.length} tasks`, client ? `(ID: ${client.id})` : '(NOT FOUND)');

        // Show DETAILED assignments for frequently used clients
        if (assignments.length > 2) {
          console.log(`    🔍 DETAILED ASSIGNMENTS for ${clientName.toUpperCase()}:`);
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
          console.log(`    💯 TOTAL COUNT for ${clientName.toUpperCase()}: ${assignments.length}`);
          console.log('');
        }
      });

      // Update cache
      const cacheMap = new Map<number, { taskCount: number; projectCount: number }>();
      clientCounts.forEach((counts, clientId) => {
        cacheMap.set(clientId, {
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        });
      });

      // Also add clients that have no live assignments
      clients.forEach(client => {
        if (!cacheMap.has(client.id!)) {
          cacheMap.set(client.id!, {
            taskCount: 0,
            projectCount: 0
          });
        }
      });

      this.taskCountCache = cacheMap;
      this.lastCacheUpdate = new Date();

      // Convert to result format
      const result: ClientTaskCount[] = clients.map(client => {
        const counts = clientCounts.get(client.id!) || { taskCount: 0, projectSet: new Set() };
        return {
          clientId: client.id!,
          clientName: client.name,
          taskCount: counts.taskCount,
          projectCount: counts.projectSet.size
        };
      });

      console.log('🔢 FINAL CLIENT COUNTS:');
      result.forEach(r => {
        if (r.taskCount > 0 || r.projectCount > 0) {
          console.log(`  ${r.clientName}: ${r.taskCount} tasks, ${r.projectCount} projects`);
        }
      });

      return result;

    } catch (error) {
      console.error('❌ CLIENT TASK COUNT SERVICE - Error calculating client counts:', error);
      // Return empty counts on error
      const clients = await databaseService.getClients();
      return clients.map(client => ({
        clientId: client.id!,
        clientName: client.name,
        taskCount: 0,
        projectCount: 0
      }));
    }
  }

  /**
   * Get task and project count for a specific client
   */
  async getClientTaskCount(clientId: number): Promise<{ taskCount: number; projectCount: number }> {
    // Check if we have fresh cached data
    if (this.isCacheValid() && this.taskCountCache.has(clientId)) {
      return this.taskCountCache.get(clientId)!;
    }

    // Refresh cache and get all counts
    const allCounts = await this.getClientTaskCounts();
    const clientCount = allCounts.find(c => c.clientId === clientId);
    return {
      taskCount: clientCount?.taskCount || 0,
      projectCount: clientCount?.projectCount || 0
    };
  }

  /**
   * Clear the cache to force fresh data on next request
   */
  invalidateCache(): void {
    this.taskCountCache.clear();
    this.lastCacheUpdate = null;
    console.log('🔄 CLIENT TASK COUNT SERVICE - Cache invalidated');
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
export const clientTaskCountService = new ClientTaskCountService();
export default clientTaskCountService;