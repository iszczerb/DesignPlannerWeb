import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { Stack } from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Email,
  Work,
  Phone,
  Business,
  CalendarToday,
} from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { employeeService } from '../../services/employeeService';
import { UpdateEmployeeRequest } from '../../types/employee';
import { UserRole, User, Team } from '../../types/auth';
import Navbar from '../layout/Navbar';

const EditEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // State
  const [employee, setEmployee] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    firstName: '',
    lastName: '',
    role: UserRole.TeamMember,
    teamId: undefined,
    employeeId: '',
    position: '',
    phoneNumber: '',
    hireDate: '',
    isActive: true,
  });

  // Load employee data
  useEffect(() => {
    if (!id) return;
    
    const loadEmployee = async () => {
      setLoading(true);
      try {
        const [employeeData, teamsData] = await Promise.all([
          employeeService.getEmployee(parseInt(id)),
          employeeService.getAvailableTeams(),
        ]);
        
        setEmployee(employeeData);
        setTeams(teamsData);
        
        // Populate form
        setFormData({
            firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          role: employeeData.role,
          teamId: employeeData.employee?.team?.id,
          employeeId: employeeData.employee?.employeeId || '',
          position: employeeData.employee?.position || '',
          phoneNumber: employeeData.employee?.phoneNumber || '',
          hireDate: employeeData.employee?.hireDate 
            ? new Date(employeeData.employee.hireDate).toISOString().split('T')[0]
            : '',
          isActive: employeeData.isActive,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployee();
  }, [id]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};


    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) return;

    setSaving(true);
    setError(null);
    
    try {
      await employeeService.updateEmployee(parseInt(id), formData);
      navigate('/management/employees');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'role' || name === 'teamId' ? 
              (value === '' ? undefined : parseInt(value)) : value,
    }));

    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Utility functions
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.Admin:
        return 'Administrator';
      case UserRole.Manager:
        return 'Manager';
      case UserRole.TeamMember:
        return 'Team Member';
      default:
        return 'Team Member';
    }
  };

  const canEditRole = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    
    // Only admins can edit admin roles
    if (targetRole === UserRole.Admin && currentUser.role !== UserRole.Admin) {
      return false;
    }
    
    // Only admins can create/edit managers
    if (targetRole === UserRole.Manager && currentUser.role !== UserRole.Admin) {
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Employee not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/management/employees')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Edit Employee: {employee.fullName}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Personal Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box flex={1}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={!!validationErrors.firstName}
                  helperText={validationErrors.firstName}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Box>

              <Box flex={1}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
              />
            </Box>
            </Stack>


            {/* Role and Status */}
            <Box >
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Role and Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>

            <Box >
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                {Object.values(UserRole)
                  .filter(value => typeof value === 'number')
                  .filter(role => canEditRole(role as UserRole))
                  .map((role) => (
                    <MenuItem key={role} value={role}>
                      {getRoleDisplayName(role as UserRole)}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            <Box >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    name="isActive"
                  />
                }
                label={formData.isActive ? "Active" : "Inactive"}
              />
            </Box>

            {/* Employee Details */}
            <Box >
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Employee Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>

            <Box >
              <TextField
                fullWidth
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
              />
            </Box>

            <Box >
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Work sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Box>

            <Box >
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Box>

            <Box >
              <TextField
                fullWidth
                select
                label="Team"
                name="teamId"
                value={formData.teamId || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Business sx={{ mr: 1, color: 'action.active' }} />,
                }}
              >
                <MenuItem value="">No Team</MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box >
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Box>

            {/* Actions */}
            <Box >
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/management/employees')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Stack>
        </form>
      </Paper>
      </Box>
    </Box>
  );
};

export default EditEmployee;