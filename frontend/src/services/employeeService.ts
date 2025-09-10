import axios from 'axios';
import { 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest, 
  EmployeeListResponse, 
  EmployeeQuery, 
  ResetPasswordRequest,
  ToggleStatusRequest 
} from '../types/employee';
import { User, Team } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5105/api';

// Create axios instance with token interceptor
const employeeApi = axios.create({
  baseURL: `${API_BASE}/Employee`,
});

// Add request interceptor to include auth token
employeeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const employeeService = {
  // Create new employee
  async createEmployee(request: CreateEmployeeRequest): Promise<User> {
    const response = await employeeApi.post('', request);
    return response.data;
  },

  // Get employee by ID
  async getEmployee(id: number): Promise<User> {
    const response = await employeeApi.get(`/${id}`);
    return response.data;
  },

  // Get employees list with pagination and filtering
  async getEmployees(query?: EmployeeQuery): Promise<EmployeeListResponse> {
    const response = await employeeApi.get('', { params: query });
    return response.data;
  },

  // Update employee
  async updateEmployee(id: number, request: UpdateEmployeeRequest): Promise<User> {
    const response = await employeeApi.put(`/${id}`, request);
    return response.data;
  },

  // Delete employee
  async deleteEmployee(id: number): Promise<void> {
    await employeeApi.delete(`/${id}`);
  },

  // Reset employee password
  async resetPassword(id: number, request: ResetPasswordRequest): Promise<void> {
    await employeeApi.post(`/${id}/reset-password`, request);
  },

  // Toggle employee status
  async toggleStatus(id: number, request: ToggleStatusRequest): Promise<void> {
    await employeeApi.patch(`/${id}/toggle-status`, request);
  },

  // Get available teams
  async getAvailableTeams(): Promise<Team[]> {
    const response = await employeeApi.get('/teams');
    return response.data;
  }
};