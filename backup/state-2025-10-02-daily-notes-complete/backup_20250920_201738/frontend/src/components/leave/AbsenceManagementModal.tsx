import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  Badge,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  IconButton,
  Collapse,
  Grid,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  PendingActions as PendingIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { 
  leaveService,
  LeaveRequest,
  LeaveBalance,
  TeamLeaveOverview,
  LeaveType,
  LeaveStatus,
  ApproveLeaveRequest,
  UpdateLeaveBalance
} from '../../services/leaveService';

interface AbsenceManagementModalProps {
  open: boolean;
  onClose: () => void;
  onRequestProcessed: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

const AbsenceManagementModal: React.FC<AbsenceManagementModalProps> = ({
  open,
  onClose,
  onRequestProcessed
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pending Requests State
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);

  // Employee Leave Summary State
  const [employeeBalances, setEmployeeBalances] = useState<LeaveBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [editingBalance, setEditingBalance] = useState<number | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState<number>(0);

  // Team Calendar State
  const [teamOverview, setTeamOverview] = useState<TeamLeaveOverview[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [calendarWeek, setCalendarWeek] = useState(new Date());

  // Load data when modal opens or tab changes
  useEffect(() => {
    if (open) {
      if (activeTab === 0) {
        loadPendingRequests();
      } else if (activeTab === 1) {
        loadEmployeeBalances();
      } else if (activeTab === 2) {
        loadTeamOverview();
      }
    }
  }, [open, activeTab, calendarWeek]);

  const loadPendingRequests = async () => {
    setLoadingPending(true);
    setError(null);
    try {
      const requests = await leaveService.getPendingLeaveRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setError('Failed to load pending requests');
    } finally {
      setLoadingPending(false);
    }
  };

  const loadEmployeeBalances = async () => {
    setLoadingBalances(true);
    setError(null);
    try {
      // This would need to be implemented on the backend to get all employee balances
      // For now, we'll show a placeholder
      setEmployeeBalances([]);
    } catch (error) {
      console.error('Error loading employee balances:', error);
      setError('Failed to load employee balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const loadTeamOverview = async () => {
    setLoadingOverview(true);
    setError(null);
    try {
      const startDate = startOfWeek(calendarWeek, { weekStartsOn: 1 });
      const endDate = endOfWeek(calendarWeek, { weekStartsOn: 1 });
      
      const overview = await leaveService.getTeamLeaveOverview(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setTeamOverview(overview);
    } catch (error) {
      console.error('Error loading team overview:', error);
      setError('Failed to load team calendar');
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleApproveReject = async (requestId: number, isApproved: boolean, notes?: string) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    setError(null);
    
    try {
      const approval: ApproveLeaveRequest = {
        leaveRequestId: requestId,
        isApproved,
        approvalNotes: notes
      };
      
      await leaveService.approveLeaveRequest(requestId, approval);
      
      setSuccess(`Leave request ${isApproved ? 'approved' : 'rejected'} successfully`);
      onRequestProcessed();
      
      // Reload pending requests
      await loadPendingRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} request:`, error);
      setError(error.response?.data?.message || `Failed to ${isApproved ? 'approve' : 'reject'} request`);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleUpdateBalance = async (employeeId: number, newBalance: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData: UpdateLeaveBalance = {
        employeeId,
        totalAnnualLeaveDays: newBalance
      };
      
      await leaveService.updateEmployeeLeaveBalance(employeeId, updateData);
      
      setSuccess('Leave balance updated successfully');
      setEditingBalance(null);
      
      // Reload balances
      await loadEmployeeBalances();
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error updating balance:', error);
      setError(error.response?.data?.message || 'Failed to update leave balance');
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.Annual:
        return 'Annual Leave';
      case LeaveType.Sick:
        return 'Sick Leave';
      case LeaveType.Training:
        return 'Training Leave';
      default:
        return 'Leave';
    }
  };

  const getLeaveTypeColor = (type: LeaveType): 'primary' | 'warning' | 'info' => {
    switch (type) {
      case LeaveType.Annual:
        return 'primary';
      case LeaveType.Sick:
        return 'warning';
      case LeaveType.Training:
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PendingIcon />
          Absence Management
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab 
            label={
              <Badge badgeContent={pendingRequests.length} color="error" max={99}>
                Pending Requests
              </Badge>
            } 
            icon={<PendingIcon />} 
          />
          <Tab label="Employee Leave Summary" icon={<PeopleIcon />} />
          <Tab label="Team Calendar" icon={<CalendarIcon />} />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Pending Requests Tab */}
        <TabPanel value={activeTab} index={0}>
          {loadingPending ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : pendingRequests.length === 0 ? (
            <Alert severity="info">
              No pending leave requests at this time.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingRequests.map((request) => (
                <Card key={request.id} sx={{ border: 1, borderColor: 'divider' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {request.employeeName} ({request.employeeId_Display})
                        </Typography>
                        <Chip 
                          label={getLeaveTypeLabel(request.leaveType)}
                          color={getLeaveTypeColor(request.leaveType)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={`${request.leaveDaysRequested} day${request.leaveDaysRequested !== 1 ? 's' : ''}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <IconButton
                        onClick={() => setExpandedRequest(
                          expandedRequest === request.id ? null : request.id
                        )}
                      >
                        {expandedRequest === request.id ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Dates:</strong> {format(new Date(request.startDate), 'MMM dd, yyyy')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Reason:</strong> {request.reason}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Requested: {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>

                    <Collapse in={expandedRequest === request.id}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Manager Notes (Optional)"
                          placeholder="Add notes about this approval/rejection..."
                          id={`notes-${request.id}`}
                          sx={{ mb: 2 }}
                        />
                      </Box>
                    </Collapse>
                  </CardContent>

                  <CardActions>
                    <LoadingButton
                      onClick={() => {
                        const notesField = document.getElementById(`notes-${request.id}`) as HTMLTextAreaElement;
                        const notes = notesField?.value || undefined;
                        handleApproveReject(request.id, true, notes);
                      }}
                      loading={processingRequests.has(request.id)}
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      size="small"
                    >
                      Approve
                    </LoadingButton>
                    
                    <LoadingButton
                      onClick={() => {
                        const notesField = document.getElementById(`notes-${request.id}`) as HTMLTextAreaElement;
                        const notes = notesField?.value || undefined;
                        handleApproveReject(request.id, false, notes);
                      }}
                      loading={processingRequests.has(request.id)}
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      size="small"
                    >
                      Reject
                    </LoadingButton>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Employee Leave Summary Tab */}
        <TabPanel value={activeTab} index={1}>
          {loadingBalances ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Alert severity="info">
              Employee leave summary functionality is not yet implemented. 
              This would show all employees' leave balances with the ability to edit them.
            </Alert>
          )}
        </TabPanel>

        {/* Team Calendar Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Week of {format(startOfWeek(calendarWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
              </Typography>
              <Box>
                <Button 
                  onClick={() => setCalendarWeek(subWeeks(calendarWeek, 1))}
                  size="small"
                >
                  Previous Week
                </Button>
                <Button 
                  onClick={() => setCalendarWeek(new Date())}
                  size="small"
                  variant="outlined"
                  sx={{ mx: 1 }}
                >
                  This Week
                </Button>
                <Button 
                  onClick={() => setCalendarWeek(addWeeks(calendarWeek, 1))}
                  size="small"
                >
                  Next Week
                </Button>
              </Box>
            </Box>

            {loadingOverview ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : teamOverview.length === 0 ? (
              <Alert severity="info">
                No team members are on leave during this week.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Employees on Leave</TableCell>
                      <TableCell>Leave Types</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamOverview.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(day.date), 'EEE, MMM dd')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {day.employeesOnLeave.map((employee, index) => (
                              <Box key={index} display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {employee.employeeName}
                                </Typography>
                                {!employee.isAM && (
                                  <Chip label="PM Only" size="small" variant="outlined" />
                                )}
                                {!employee.isPM && (
                                  <Chip label="AM Only" size="small" variant="outlined" />
                                )}
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Array.from(new Set(day.employeesOnLeave.map(emp => emp.leaveType)))
                              .map((type, index) => (
                                <Chip 
                                  key={index}
                                  label={getLeaveTypeLabel(type)}
                                  color={getLeaveTypeColor(type)}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AbsenceManagementModal;