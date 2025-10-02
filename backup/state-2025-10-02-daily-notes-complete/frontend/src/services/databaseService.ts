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
  User,
  CreateUserDto,
  UpdateUserDto,
  UserListResponse,
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
    console.log('DatabaseService: Calling apiService.delete with URL:', `/client/${id}`);
    const result = await apiService.delete<void>(`/client/${id}`);
    console.log('DatabaseService: API call completed with result:', result);
    return result;
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
    console.log('🔄 DATABASE SERVICE - getProjects called');
    console.log('🚀 DATABASE SERVICE - calling apiService.get(/project)...');
    const response = await apiService.get<{projects: Project[]}>('/project');
    console.log('📊 DATABASE SERVICE - apiService.get returned:', response);
    console.log('📊 DATABASE SERVICE - response.projects:', response.projects);
    console.log('📊 DATABASE SERVICE - projects is array:', Array.isArray(response.projects));
    console.log('📊 DATABASE SERVICE - projects length:', response.projects?.length);
    return response.projects;
  }

  async getProject(id: number): Promise<Project> {
    return apiService.get<Project>(`/project/${id}`);
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    console.log('🟢 DATABASE SERVICE - createProject called with data:', data);
    console.log('🚀 DATABASE SERVICE - calling apiService.post...');
    const result = await apiService.post<Project>('/project', data);
    console.log('✅ DATABASE SERVICE - apiService.post returned:', result);
    return result;
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
    const response = await apiService.get<{teams: Team[]}>('/team');
    return response.teams;
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
    const response = await apiService.get<{skills: Skill[]}>('/skill');
    return response.skills;
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

  // Employee Skill Operations
  async getEmployeeSkills(): Promise<any[]> {
    return apiService.get<any[]>('/skill/employee-skills');
  }

  async updateEmployeeSkill(employeeId: number, skillId: number, data: { proficiencyLevel: number; notes?: string }): Promise<void> {
    return apiService.put<void>(`/skill/employee/${employeeId}/skill/${skillId}`, data);
  }

  async deleteEmployeeSkill(employeeId: number, skillId: number): Promise<void> {
    return apiService.delete<void>(`/skill/employee/${employeeId}/skill/${skillId}`);
  }

  // Task Type CRUD Operations
  async getTaskTypes(): Promise<TaskType[]> {
    const response = await apiService.get<{taskTypes: TaskType[]}>('/tasktype');
    return response.taskTypes;
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
    const response = await apiService.get<{holidays: Holiday[]}>('/holiday');
    return response.holidays;
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

  // User CRUD Operations
  async getUsers(): Promise<UserListResponse> {
    return apiService.get<UserListResponse>('/user');
  }

  async getUser(id: number): Promise<User> {
    return apiService.get<User>(`/user/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return apiService.post<User>('/user', data);
  }

  async updateUser(data: UpdateUserDto): Promise<User> {
    return apiService.put<User>(`/user/${data.id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return apiService.delete<void>(`/user/${id}`);
  }

  async getActiveUsers(): Promise<User[]> {
    return apiService.get<User[]>('/user/active');
  }

  async getUsersByTeam(teamId: number): Promise<User[]> {
    return apiService.get<User[]>(`/user/team/${teamId}`);
  }

  async getUsersByRole(role: number): Promise<User[]> {
    return apiService.get<User[]>(`/user/role/${role}`);
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return apiService.get<User[]>(`/user/search?searchTerm=${encodeURIComponent(searchTerm)}`);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch<{ message: string }>(`/user/${id}/status`, isActive);
  }

  async changeUserPassword(id: number, newPassword: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/user/${id}/change-password`, { newPassword });
  }

  async checkUsernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    const params = new URLSearchParams({ username });
    if (excludeUserId) {
      params.append('excludeUserId', excludeUserId.toString());
    }
    return apiService.get<boolean>(`/user/check-username?${params.toString()}`);
  }

  // Analytics and Reports
  async getEntityCounts(): Promise<{
    clients: number;
    projects: number;
    teams: number;
    skills: number;
    taskTypes: number;
    holidays: number;
    users: number;
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