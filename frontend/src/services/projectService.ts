import apiService from './api';

export interface ClientOption {
  id: number;
  code: string;
  name: string;
}

export interface ProjectOption {
  id: number;
  code: string;
  name: string;
  clientName: string;
  clientId: number;
}

export interface TaskTypeOption {
  id: number;
  name: string;
}

export interface ProjectTaskOption {
  id: number;
  title: string;
  taskTypeId: number;
  taskTypeName: string;
  priority: number;
  status: number;
}

class ProjectService {
  private readonly baseUrl = '/project';

  // Get all active clients
  async getClients(): Promise<ClientOption[]> {
    return apiService.get<ClientOption[]>(`${this.baseUrl}/clients`);
  }

  // Get projects for a specific client
  async getProjectsByClient(clientId: number): Promise<ProjectOption[]> {
    return apiService.get<ProjectOption[]>(`${this.baseUrl}/clients/${clientId}/projects`);
  }

  // Get all active task types
  async getTaskTypes(): Promise<TaskTypeOption[]> {
    return apiService.get<TaskTypeOption[]>(`${this.baseUrl}/task-types`);
  }

  // Get tasks for a specific project
  async getProjectTasks(projectId: number): Promise<ProjectTaskOption[]> {
    return apiService.get<ProjectTaskOption[]>(`${this.baseUrl}/${projectId}/tasks`);
  }
}

export const projectService = new ProjectService();
export default projectService;