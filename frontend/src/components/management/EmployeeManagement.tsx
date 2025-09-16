import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  PersonAdd,
  MoreVert,
  Edit,
  Delete,
  Lock,
  ToggleOff,
  ToggleOn,
  Refresh,
} from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { employeeService } from '../../services/employeeService';
import { EmployeeListItem, EmployeeQuery } from '../../types/employee';
import { UserRole } from '../../types/auth';
import Navbar from '../layout/Navbar';

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  // State
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null);
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query: EmployeeQuery = {
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        searchTerm: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter : undefined,
        sortBy: 'lastName',
        sortDirection: 'asc',
      };
      
      const response = await employeeService.getEmployees(query);
      setEmployees(response.employees);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Handle menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, employee: EmployeeListItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  // Handle actions
  const handleEdit = () => {
    if (selectedEmployee) {
      navigate(`/management/employees/edit/${selectedEmployee.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      await employeeService.deleteEmployee(selectedEmployee.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
      fetchEmployees(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee || !newPassword) return;
    
    try {
      await employeeService.resetPassword(selectedEmployee.id, { newPassword });
      setResetPasswordDialogOpen(false);
      setNewPassword('');
      handleMenuClose();
      // Show success message
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedEmployee) return;
    
    try {
      await employeeService.toggleStatus(selectedEmployee.id, { 
        isActive: !selectedEmployee.isActive 
      });
      handleMenuClose();
      fetchEmployees(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  // Utility functions
  const getRoleDisplayName = (role: number): string => {
    switch (role) {
      case UserRole.Admin:
        return 'Administrator';
      case UserRole.Manager:
        return 'Manager';
      case UserRole.TeamMember:
        return 'Team Member';
      default:
        return 'Unknown';
    }
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case UserRole.Admin:
        return 'error';
      case UserRole.Manager:
        return 'warning';
      case UserRole.TeamMember:
        return 'primary';
      default:
        return 'default';
    }
  };

  const canManageEmployee = (employee: EmployeeListItem): boolean => {
    if (!user) return false;
    
    // Admins can manage everyone
    if (user.role === UserRole.Admin) return true;
    
    // Managers can manage team members and other managers (but not admins)
    if (user.role === UserRole.Manager) {
      return employee.role !== UserRole.Admin;
    }
    
    return false;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => navigate('/register')}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          Add Employee
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => {
                setRoleFilter(e.target.value as number);
                setPage(0);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {Object.values(UserRole)
                .filter(value => typeof value === 'number')
                .map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleDisplayName(role as number)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value as boolean);
                setPage(0);
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Inactive</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton onClick={fetchEmployees} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Employee Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No employees found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {employee.fullName}
                    </Typography>
                    {employee.employeeId && (
                      <Typography variant="caption" color="text.secondary">
                        ID: {employee.employeeId}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleDisplayName(employee.role)}
                      color={getRoleColor(employee.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{employee.position || '-'}</TableCell>
                  <TableCell>{employee.teamName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.isActive ? 'Active' : 'Inactive'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {employee.lastLoginAt 
                      ? new Date(employee.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell align="right">
                    {canManageEmployee(employee) && (
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, employee)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => setResetPasswordDialogOpen(true)}>
          <Lock sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedEmployee?.isActive ? (
            <>
              <ToggleOff sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <ToggleOn sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedEmployee?.fullName}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a new password for {selectedEmployee?.fullName}:
          </DialogContentText>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResetPasswordDialogOpen(false);
            setNewPassword('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained"
            disabled={!newPassword || newPassword.length < 6}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default EmployeeManagement;