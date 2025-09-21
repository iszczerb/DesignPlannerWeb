import axios, { AxiosResponse } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5105/api';

// Types for Leave System
export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeId_Display: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isStartDateAM: boolean;
  isEndDateAM: boolean;
  leaveDaysRequested: number;
  reason: string;
  status: LeaveStatus;
  approvedByUserId?: number;
  approvedByUserName?: string;
  approvalNotes?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isStartDateAM: boolean;
  isEndDateAM: boolean;
  reason: string;
}

export interface ApproveLeaveRequest {
  leaveRequestId: number;
  isApproved: boolean;
  approvalNotes?: string;
}

export interface LeaveBalance {
  employeeId: number;
  employeeName: string;
  totalAnnualLeaveDays: number;
  usedLeaveDays: number;
  remainingLeaveDays: number;
  pendingLeaveDays: number;
}

export interface TeamLeaveOverview {
  date: string;
  employeesOnLeave: EmployeeLeave[];
}

export interface EmployeeLeave {
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  isAM: boolean;
  isPM: boolean;
  status: LeaveStatus;
}

export interface UpdateLeaveBalance {
  employeeId: number;
  totalAnnualLeaveDays: number;
}

export interface CalculateLeaveDaysRequest {
  startDate: string;
  endDate: string;
  isStartDateAM: boolean;
  isEndDateAM: boolean;
}

export interface CheckLeaveConflictRequest {
  startDate: string;
  endDate: string;
}

export enum LeaveType {
  Annual = 1,
  Sick = 2,
  Training = 3
}

export enum LeaveStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

// Create axios instance with token interceptor
const leaveApi = axios.create({
  baseURL: `${API_BASE}/api/LeaveRequest`,
});

// Add request interceptor to include auth token
leaveApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Leave Service API calls
export const leaveService = {
  // Get current employee's leave balance
  getMyLeaveBalance: async (): Promise<LeaveBalance> => {
    const response: AxiosResponse<LeaveBalance> = await leaveApi.get('/balance');
    return response.data;
  },

  // Get specific employee's leave balance (managers only)
  getEmployeeLeaveBalance: async (employeeId: number): Promise<LeaveBalance> => {
    const response: AxiosResponse<LeaveBalance> = await leaveApi.get(`/balance/${employeeId}`);
    return response.data;
  },

  // Calculate leave days for a date range
  calculateLeaveDays: async (request: CalculateLeaveDaysRequest): Promise<number> => {
    const response: AxiosResponse<number> = await leaveApi.post('/calculate-days', request);
    return response.data;
  },

  // Create a new leave request
  createLeaveRequest: async (request: CreateLeaveRequest): Promise<LeaveRequest> => {
    const response: AxiosResponse<LeaveRequest> = await leaveApi.post('', request);
    return response.data;
  },

  // Get current employee's leave requests
  getMyLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const response: AxiosResponse<LeaveRequest[]> = await leaveApi.get('/my-requests');
    return response.data;
  },

  // Get specific leave request
  getLeaveRequest: async (id: number): Promise<LeaveRequest> => {
    const response: AxiosResponse<LeaveRequest> = await leaveApi.get(`/${id}`);
    return response.data;
  },

  // Get pending leave requests (managers only)
  getPendingLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const response: AxiosResponse<LeaveRequest[]> = await leaveApi.get('/pending');
    return response.data;
  },

  // Approve or reject leave request (managers only)
  approveLeaveRequest: async (id: number, approval: ApproveLeaveRequest): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await leaveApi.post(`/${id}/approve`, approval);
    return response.data;
  },

  // Get team leave overview for date range (managers only)
  getTeamLeaveOverview: async (startDate: string, endDate: string): Promise<TeamLeaveOverview[]> => {
    const response: AxiosResponse<TeamLeaveOverview[]> = await leaveApi.get('/team-overview', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Update employee leave balance (managers only)
  updateEmployeeLeaveBalance: async (employeeId: number, updateData: UpdateLeaveBalance): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await leaveApi.put(`/balance/${employeeId}`, updateData);
    return response.data;
  },

  // Get leave requests for date range (for calendar integration)
  getLeaveRequestsForDateRange: async (startDate: string, endDate: string): Promise<LeaveRequest[]> => {
    const response: AxiosResponse<LeaveRequest[]> = await leaveApi.get('/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Check if dates have leave conflicts
  checkLeaveConflict: async (request: CheckLeaveConflictRequest): Promise<boolean> => {
    const response: AxiosResponse<boolean> = await leaveApi.post('/check-conflict', request);
    return response.data;
  }
};

export default leaveService;