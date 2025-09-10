export interface CreateEmployeeRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: number;
  teamId?: number;
  employeeId?: string;
  position?: string;
  phoneNumber?: string;
  hireDate?: string;
}

export interface UpdateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: number;
  teamId?: number;
  employeeId?: string;
  position?: string;
  phoneNumber?: string;
  hireDate?: string;
  isActive: boolean;
}

export interface EmployeeListItem {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  employeeId?: string;
  position?: string;
  phoneNumber?: string;
  hireDate?: string;
  teamName?: string;
}

export interface EmployeeListResponse {
  employees: EmployeeListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: number;
  teamId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface ToggleStatusRequest {
  isActive: boolean;
}