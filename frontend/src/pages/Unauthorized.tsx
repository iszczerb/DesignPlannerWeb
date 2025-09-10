import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material';
import { Error, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
          }}
        >
          <Error
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          
          <Typography variant="h3" component="h1" gutterBottom>
            403
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            Access Denied
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={handleGoHome}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;