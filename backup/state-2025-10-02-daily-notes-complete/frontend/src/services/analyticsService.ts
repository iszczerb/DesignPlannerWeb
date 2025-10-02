import { apiService } from './api';

export interface AnalyticsFilterDto {
  startDate?: string;
  endDate?: string;
  teamId?: number;
  teamIds?: number[];  // EMPLOYEE TEAM IDs (Structural Team, Non-Structural Team, BIM, R&D)
  employeeId?: number;  // For filtering by specific employee (used for TeamMember role)
  clientId?: number;
  projectId?: number;
  categoryIds?: number[];  // PROJECT CATEGORY IDs (Structural Category, Non-Structural Category, Manifold, Miscellaneous)
  viewType?: string;
}

export interface AnalyticsSummaryDto {
  totalProjects: number;
  totalHours: number;
  totalTasks: number;
  averageProjectClient: number;
  teamCount: number;
  activeEmployees: number;
  periodStart: string;
  periodEnd: string;
}

export interface ProjectHoursDto {
  projectCode: string;
  projectName: string;
  clientCode: string;
  clientName: string;
  clientColor: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  hours: number;
  taskCount: number;
  percentage: number;
}

export interface TaskTypeAnalyticsDto {
  taskTypeName: string;
  count: number;
  hours: number;
  percentage: number;
  category: string;
}

export interface ClientDistributionDto {
  clientCode: string;
  clientName: string;
  clientColor: string;
  hours: number;
  projectCount: number;
  taskCount: number;
  percentage: number;
}

export interface TeamPerformanceDto {
  teamId: number;
  teamName: string;
  employeeCount: number;
  totalHours: number;
  totalTasks: number;
  averageHoursPerEmployee: number;
  capacityUtilization: number;
}

export interface EmployeeAnalyticsDto {
  employeeId: number;
  employeeName: string;
  teamName: string;
  totalHours: number;
  taskCount: number;
  capacityUtilization: number;
  role: string;
}

export interface CategoryDistributionDto {
  categoryName: string;
  hours: number;
  taskCount: number;
  percentage: number;
  color: string;
}

class AnalyticsService {
  async getAnalyticsSummary(filter: AnalyticsFilterDto): Promise<AnalyticsSummaryDto> {
    return await apiService.post('/analytics/summary', filter);
  }

  async getProjectHours(filter: AnalyticsFilterDto): Promise<ProjectHoursDto[]> {
    return await apiService.post('/analytics/project-hours', filter);
  }

  async getTaskTypeAnalytics(filter: AnalyticsFilterDto): Promise<TaskTypeAnalyticsDto[]> {
    return await apiService.post('/analytics/task-type-analytics', filter);
  }

  async getClientDistribution(filter: AnalyticsFilterDto): Promise<ClientDistributionDto[]> {
    return await apiService.post('/analytics/client-distribution', filter);
  }

  async getTeamPerformance(filter: AnalyticsFilterDto): Promise<TeamPerformanceDto[]> {
    return await apiService.post('/analytics/team-performance', filter);
  }

  async getEmployeeAnalytics(filter: AnalyticsFilterDto): Promise<EmployeeAnalyticsDto[]> {
    return await apiService.post('/analytics/employee-analytics', filter);
  }

  async getCategoryDistribution(filter: AnalyticsFilterDto): Promise<CategoryDistributionDto[]> {
    return await apiService.post('/analytics/category-distribution', filter);
  }
}

export const analyticsService = new AnalyticsService();