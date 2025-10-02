import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { initializeAuth } from '../../store/slices/authSlice';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 AuthProvider: Starting initialization...');
      try {
        await dispatch(initializeAuth());
        console.log('✅ AuthProvider: Initialization completed');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ AuthProvider: Initialization failed:', error);
        setIsInitialized(true); // Set to true anyway to avoid infinite loading
      }
    };

    initialize();
  }, [dispatch]);

  // Show loading screen while initializing authentication
  if (!isInitialized || isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Initializing application...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;