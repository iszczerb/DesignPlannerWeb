import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5177/api';

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshTokenPromise = this.performTokenRefresh(refreshToken);

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresAt } = response.data;
    // Store tokens directly here since this is called from interceptor
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('expiresAt', expiresAt);

    return accessToken;
  }

  private handleAuthFailure() {
    this.clearTokens();
    // Let Redux handle the logout and navigation
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    // Let Redux handle token storage
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/register', userData);
    // Let Redux handle token storage
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Even if the API call fails, we should clear local tokens
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await this.api.put('/auth/change-password', passwordData);
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/refresh', { refreshToken });
    // Let Redux handle token storage
    return response.data;
  }

  // Token management utilities
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) return true;

    return new Date(expiresAt) <= new Date();
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }

  // Generic API methods for other endpoints
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('ApiService: Making DELETE request to:', url);
    console.log('ApiService: Config:', config);
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    console.log('ApiService: DELETE response status:', response.status);
    console.log('ApiService: DELETE response data:', response.data);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;