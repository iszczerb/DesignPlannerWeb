import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  Skill,
  CreateSkillDto,
  UpdateSkillDto,
  TaskType,
  CreateTaskTypeDto,
  UpdateTaskTypeDto,
  Category,
  CreateCategory,
  UpdateCategory,
  Holiday,
  CreateHolidayDto,
  UpdateHolidayDto,
  BulkActionResult
} from '../types/database';
import { apiService } from './api';

class DatabaseService {

  // Client CRUD Operations
  async getClients(): Promise<Client[]> {
    const response = await apiService.get<{clients: Client[]}>('/client');
    return response.clients;
  }

  async getClient(id: number): Promise<Client> {
    return apiService.get<Client>(`/client/${id}`);
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    return apiService.post<Client>('/client', data);
  }

  async updateClient(data: UpdateClientDto): Promise<Client> {
    return apiService.put<Client>(`/client/${data.id}`, data);
  }

  async deleteClient(id: number): Promise<void> {
    return apiService.delete<void>(`/client/${id}`);
  }

  async bulkUpdateClients(clients: UpdateClientDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/client/bulk-update', clients);
  }

  async bulkDeleteClients(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/client/bulk-delete', { data: ids });
  }

  async exportClients(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/client/export'
      : '/client/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Project CRUD Operations
  async getProjects(): Promise<Project[]> {
    const response = await apiService.get<{Projects: Project[]}>('/project');
    return response.Projects;
  }

  async getProject(id: number): Promise<Project> {
    return apiService.get<Project>(`/project/${id}`);
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    return apiService.post<Project>('/project', data);
  }

  async updateProject(data: UpdateProjectDto): Promise<Project> {
    return apiService.put<Project>(`/project/${data.id}`, data);
  }

  async deleteProject(id: number): Promise<void> {
    return apiService.delete<void>(`/project/${id}`);
  }

  async bulkUpdateProjects(projects: UpdateProjectDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/project/bulk-update', projects);
  }

  async bulkDeleteProjects(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/project/bulk-delete', { data: ids });
  }

  async exportProjects(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/project/export'
      : '/project/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Team CRUD Operations
  async getTeams(): Promise<Team[]> {
    const response = await apiService.get<{Teams: Team[]}>('/team');
    return response.Teams;
  }

  async getTeam(id: number): Promise<Team> {
    return apiService.get<Team>(`/team/${id}`);
  }

  async createTeam(data: CreateTeamDto): Promise<Team> {
    return apiService.post<Team>('/team', data);
  }

  async updateTeam(data: UpdateTeamDto): Promise<Team> {
    return apiService.put<Team>(`/team/${data.id}`, data);
  }

  async deleteTeam(id: number): Promise<void> {
    return apiService.delete<void>(`/team/${id}`);
  }

  async bulkUpdateTeams(teams: UpdateTeamDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/team/bulk-update', teams);
  }

  async bulkDeleteTeams(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/team/bulk-delete', { data: ids });
  }

  async exportTeams(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/team/export'
      : '/team/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Skill CRUD Operations
  async getSkills(): Promise<Skill[]> {
    const response = await apiService.get<{Skills: Skill[]}>('/skill');
    return response.Skills;
  }

  async getSkill(id: number): Promise<Skill> {
    return apiService.get<Skill>(`/skill/${id}`);
  }

  async createSkill(data: CreateSkillDto): Promise<Skill> {
    return apiService.post<Skill>('/skill', data);
  }

  async updateSkill(data: UpdateSkillDto): Promise<Skill> {
    return apiService.put<Skill>(`/skill/${data.id}`, data);
  }

  async deleteSkill(id: number): Promise<void> {
    return apiService.delete<void>(`/skill/${id}`);
  }

  async bulkUpdateSkills(skills: UpdateSkillDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/skill/bulk-update', skills);
  }

  async bulkDeleteSkills(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/skill/bulk-delete', { data: ids });
  }

  async exportSkills(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/skill/export'
      : '/skill/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Task Type CRUD Operations
  async getTaskTypes(): Promise<TaskType[]> {
    const response = await apiService.get<{TaskTypes: TaskType[]}>('/tasktype');
    return response.TaskTypes;
  }

  async getTaskType(id: number): Promise<TaskType> {
    return apiService.get<TaskType>(`/tasktype/${id}`);
  }

  async createTaskType(data: CreateTaskTypeDto): Promise<TaskType> {
    return apiService.post<TaskType>('/tasktype', data);
  }

  async updateTaskType(data: UpdateTaskTypeDto): Promise<TaskType> {
    return apiService.put<TaskType>(`/tasktype/${data.id}`, data);
  }

  async deleteTaskType(id: number): Promise<void> {
    return apiService.delete<void>(`/tasktype/${id}`);
  }

  async bulkUpdateTaskTypes(taskTypes: UpdateTaskTypeDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/tasktype/bulk-update', taskTypes);
  }

  async bulkDeleteTaskTypes(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/tasktype/bulk-delete', { data: ids });
  }

  async exportTaskTypes(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/tasktype/export'
      : '/tasktype/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Category CRUD Operations
  async getCategories(): Promise<Category[]> {
    return apiService.get<Category[]>('/category');
  }

  async getCategory(id: number): Promise<Category> {
    return apiService.get<Category>(`/category/${id}`);
  }

  async createCategory(data: CreateCategory): Promise<Category> {
    return apiService.post<Category>('/category', data);
  }

  async updateCategory(data: UpdateCategory): Promise<Category> {
    return apiService.put<Category>(`/category/${data.id}`, data);
  }

  async deleteCategory(id: number): Promise<void> {
    return apiService.delete<void>(`/category/${id}`);
  }

  async bulkUpdateCategories(categories: UpdateCategory[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/category/bulk-update', categories);
  }

  async bulkDeleteCategories(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/category/bulk-delete', { data: ids });
  }

  async exportCategories(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/category/export'
      : '/category/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Holiday CRUD Operations
  async getHolidays(): Promise<Holiday[]> {
    const response = await apiService.get<{Holidays: Holiday[]}>('/holiday');
    return response.Holidays;
  }

  async getHoliday(id: number): Promise<Holiday> {
    return apiService.get<Holiday>(`/holiday/${id}`);
  }

  async createHoliday(data: CreateHolidayDto): Promise<Holiday> {
    return apiService.post<Holiday>('/holiday', data);
  }

  async updateHoliday(data: UpdateHolidayDto): Promise<Holiday> {
    return apiService.put<Holiday>(`/holiday/${data.id}`, data);
  }

  async deleteHoliday(id: number): Promise<void> {
    return apiService.delete<void>(`/holiday/${id}`);
  }

  async bulkUpdateHolidays(holidays: UpdateHolidayDto[]): Promise<BulkActionResult> {
    return apiService.put<BulkActionResult>('/holiday/bulk-update', holidays);
  }

  async bulkDeleteHolidays(ids: number[]): Promise<BulkActionResult> {
    return apiService.delete<BulkActionResult>('/holiday/bulk-delete', { data: ids });
  }

  async exportHolidays(ids?: number[]): Promise<BulkActionResult> {
    const endpoint = ids?.length
      ? '/holiday/export'
      : '/holiday/export-all';

    return apiService.post<BulkActionResult>(endpoint, ids || undefined);
  }

  // Analytics and Reports
  async getEntityCounts(): Promise<{
    clients: number;
    projects: number;
    teams: number;
    skills: number;
    taskTypes: number;
    holidays: number;
  }> {
    return apiService.get<any>('/analytics/entity-counts');
  }

  async getDatabaseHealth(): Promise<{
    totalEntities: number;
    activeEntities: number;
    recentActivity: Array<{
      entityType: string;
      action: string;
      timestamp: string;
      count: number;
    }>;
  }> {
    return apiService.get<any>('/analytics/health');
  }

  // Backup and Restore
  async createBackup(): Promise<{ filename: string; size: number; timestamp: string }> {
    return apiService.post<any>('/backup/create');
  }

  async restoreBackup(filename: string): Promise<{ success: boolean; message: string }> {
    return apiService.post<any>('/backup/restore', { filename });
  }

  async getBackupHistory(): Promise<Array<{
    filename: string;
    size: number;
    timestamp: string;
  }>> {
    return apiService.get<any>('/backup/history');
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;