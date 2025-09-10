export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  employee?: Employee;
}

export interface Employee {
  id: number;
  employeeId: string;
  position?: string;
  phoneNumber?: string;
  hireDate: string;
  isActive: boolean;
  team?: Team;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
}

export enum UserRole {
  Admin = 1,
  Manager = 2,
  TeamMember = 3
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  teamId?: number;
  employeeId?: string;
  position?: string;
  phoneNumber?: string;
  hireDate?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}