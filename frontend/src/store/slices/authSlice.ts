import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest, RegisterRequest, ChangePasswordRequest, User, ApiError } from '../../types/auth';
import apiService from '../../services/api';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  expiresAt: localStorage.getItem('expiresAt'),
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
    } catch (error: any) {
      // Even if logout fails on the server, we should clear local state
      console.error('Logout error:', error);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiService.getCurrentUser();
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get user information';
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await apiService.changePassword(passwordData);
      return { message: 'Password changed successfully' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.refreshToken();
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Token refresh failed';
      return rejectWithValue({ message, errors: error.response?.data?.errors });
    }
  }
);

// Initialize authentication state on app load
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    console.log('🔄 initializeAuth started');
    const token = localStorage.getItem('accessToken');
    const expiresAt = localStorage.getItem('expiresAt');
    
    console.log('🔍 Auth tokens check:', { 
      hasToken: !!token, 
      expiresAt,
      tokenLength: token?.length 
    });
    
    if (token && expiresAt) {
      const isExpired = new Date(expiresAt) <= new Date();
      console.log('⏰ Token expiry check:', { 
        expiresAt, 
        isExpired,
        currentTime: new Date().toISOString()
      });
      
      if (isExpired) {
        console.log('🔄 Token expired, trying to refresh...');
        // Try to refresh token
        try {
          await dispatch(refreshToken()).unwrap();
          console.log('✅ Token refreshed, getting current user...');
          // If refresh succeeds, get current user
          await dispatch(getCurrentUser()).unwrap();
          console.log('✅ Current user obtained after refresh');
        } catch (error) {
          console.log('❌ Refresh failed, logging out:', error);
          // If refresh fails, clear tokens and redirect to login
          dispatch(logout());
        }
      } else {
        console.log('✅ Token still valid, getting current user...');
        // Token is still valid, get current user
        try {
          await dispatch(getCurrentUser()).unwrap();
          console.log('✅ Current user obtained');
        } catch (error) {
          console.log('❌ Getting user failed, logging out:', error);
          // If getting user fails, logout
          dispatch(logout());
        }
      }
    } else {
      console.log('❌ No token or expiresAt found');
    }
    console.log('🏁 initializeAuth finished');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.expiresAt = action.payload.expiresAt;
        state.error = null;
        
        // Save tokens to localStorage
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        localStorage.setItem('expiresAt', action.payload.expiresAt);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.error = (action.payload as ApiError)?.message || 'Login failed';
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.expiresAt = action.payload.expiresAt;
        state.error = null;
        
        // Save tokens to localStorage
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        localStorage.setItem('expiresAt', action.payload.expiresAt);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.error = (action.payload as ApiError)?.message || 'Registration failed';
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.error = null;
        state.isLoading = false;
        
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('expiresAt');
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.error = (action.payload as ApiError)?.message || 'Failed to get user information';
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || 'Failed to change password';
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.expiresAt = action.payload.expiresAt;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
      });
  },
});

export const { clearError, setError, setLoading } = authSlice.actions;
export default authSlice.reducer;