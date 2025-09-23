import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Send as SendIcon, History as HistoryIcon, AccountBalance as BalanceIcon } from '@mui/icons-material';
import { addDays } from 'date-fns';
import DateRangePicker from './DateRangePicker';
import { 
  leaveService, 
  LeaveType, 
  LeaveStatus,
  CreateLeaveRequest,
  LeaveBalance,
  LeaveRequest 
} from '../../services/leaveService';

interface LeaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
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
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  open,
  onClose,
  onRequestSubmitted
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Leave Request Form State
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.Annual);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartDateAM, setIsStartDateAM] = useState(true);
  const [isEndDateAM, setIsEndDateAM] = useState(true);
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Data State
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadLeaveBalance();
      loadMyLeaveRequests();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setLeaveType(LeaveType.Annual);
    setStartDate(null);
    setEndDate(null);
    setIsStartDateAM(true);
    setIsEndDateAM(true);
    setReason('');
    setCalculatedDays(0);
    setError(null);
    setSuccess(null);
  };

  const loadLeaveBalance = async () => {
    setLoadingBalance(true);
    try {
      const balance = await leaveService.getMyLeaveBalance();
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Error loading leave balance:', error);
      setError('Failed to load leave balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadMyLeaveRequests = async () => {
    setLoadingRequests(true);
    try {
      const requests = await leaveService.getMyLeaveRequests();
      setMyLeaveRequests(requests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (leaveType === LeaveType.Annual && leaveBalance) {
      const availableDays = leaveBalance.remainingLeaveDays - leaveBalance.pendingLeaveDays;
      if (calculatedDays > availableDays) {
        setError(`You don't have enough leave days available. You have ${availableDays} days remaining.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateLeaveRequest = {
        leaveType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isStartDateAM,
        isEndDateAM,
        reason: reason.trim()
      };

      await leaveService.createLeaveRequest(request);
      
      const successMessage = leaveType === LeaveType.Annual 
        ? 'Leave request submitted successfully! It is now pending approval.'
        : `${getLeaveTypeLabel(leaveType)} request submitted and automatically approved.`;
      
      setSuccess(successMessage);
      onRequestSubmitted();
      
      // Reload data to show updated status
      await Promise.all([loadLeaveBalance(), loadMyLeaveRequests()]);
      
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
        setActiveTab(1); // Switch to history tab to show the new request
      }, 2000);

    } catch (error: any) {
      console.error('Error creating leave request:', error);
      setError(error.response?.data?.message || 'Failed to submit leave request');
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
      case LeaveType.OtherLeave:
        return 'Other Leave';
      default:
        return 'Leave';
    }
  };

  const getStatusColor = (status: LeaveStatus): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case LeaveStatus.Pending:
        return 'warning';
      case LeaveStatus.Approved:
        return 'success';
      case LeaveStatus.Rejected:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: LeaveStatus): string => {
    switch (status) {
      case LeaveStatus.Pending:
        return 'Pending';
      case LeaveStatus.Approved:
        return 'Approved';
      case LeaveStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon />
          Leave Request System
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="New Request" icon={<SendIcon />} />
          <Tab label="My Requests" icon={<HistoryIcon />} />
          <Tab label="Leave Balance" icon={<BalanceIcon />} />
        </Tabs>

        {/* New Request Tab */}
        <TabPanel value={activeTab} index={0}>
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

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Leave Type Selection */}
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={leaveType}
                label="Leave Type"
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                disabled={loading}
              >
                <MenuItem value={LeaveType.Annual}>Annual Leave (Requires Approval)</MenuItem>
                <MenuItem value={LeaveType.Sick}>Sick Leave (Auto-Approved)</MenuItem>
                <MenuItem value={LeaveType.OtherLeave}>Other Leave (Auto-Approved)</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              isStartDateAM={isStartDateAM}
              isEndDateAM={isEndDateAM}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onStartAMPMChange={setIsStartDateAM}
              onEndAMPMChange={setIsEndDateAM}
              onLeaveDaysChange={setCalculatedDays}
              disabled={loading}
              minDate={new Date()}
              maxDate={addDays(new Date(), 365)} // Can request up to 1 year in advance
            />

            {/* Leave Balance Warning */}
            {leaveType === LeaveType.Annual && leaveBalance && calculatedDays > 0 && (
              <Alert 
                severity={
                  calculatedDays > (leaveBalance.remainingLeaveDays - leaveBalance.pendingLeaveDays)
                    ? 'error' 
                    : 'info'
                }
              >
                <Typography variant="body2">
                  <strong>Leave Balance Check:</strong><br />
                  Days Requested: {calculatedDays}<br />
                  Available Days: {leaveBalance.remainingLeaveDays - leaveBalance.pendingLeaveDays} 
                  (Total: {leaveBalance.totalAnnualLeaveDays}, Used: {leaveBalance.usedLeaveDays}, Pending: {leaveBalance.pendingLeaveDays})
                </Typography>
              </Alert>
            )}

            {/* Reason Text Field */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason / Notes"
              placeholder="Please provide a reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              inputProps={{ maxLength: 1000 }}
              helperText={`${reason.length}/1000 characters`}
            />
          </Box>
        </TabPanel>

        {/* My Requests Tab */}
        <TabPanel value={activeTab} index={1}>
          {loadingRequests ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : myLeaveRequests.length === 0 ? (
            <Alert severity="info">
              You haven't submitted any leave requests yet.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {myLeaveRequests.map((request) => (
                <Box
                  key={request.id}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Box display="flex" justifyContent="between" alignItems="start" mb={1}>
                    <Typography variant="h6" component="div">
                      {getLeaveTypeLabel(request.leaveType)}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    {' '}({request.leaveDaysRequested} day{request.leaveDaysRequested !== 1 ? 's' : ''})
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Reason:</strong> {request.reason}
                  </Typography>
                  
                  {request.approvalNotes && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Manager Notes:</strong> {request.approvalNotes}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Requested: {new Date(request.createdAt).toLocaleDateString()}
                    {request.approvedAt && ` | Processed: ${new Date(request.approvedAt).toLocaleDateString()}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Leave Balance Tab */}
        <TabPanel value={activeTab} index={2}>
          {loadingBalance ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : leaveBalance ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>
                Annual Leave Balance for {leaveBalance.employeeName}
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h4" component="div" color="primary.contrastText">
                    {leaveBalance.totalAnnualLeaveDays}
                  </Typography>
                  <Typography variant="body2" color="primary.contrastText">
                    Total Annual Days
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h4" component="div" color="success.contrastText">
                    {leaveBalance.remainingLeaveDays}
                  </Typography>
                  <Typography variant="body2" color="success.contrastText">
                    Remaining Days
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h4" component="div" color="warning.contrastText">
                    {leaveBalance.usedLeaveDays}
                  </Typography>
                  <Typography variant="body2" color="warning.contrastText">
                    Used Days
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="h4" component="div" color="error.contrastText">
                    {leaveBalance.pendingLeaveDays}
                  </Typography>
                  <Typography variant="body2" color="error.contrastText">
                    Pending Approval
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Available for New Requests:</strong> {leaveBalance.remainingLeaveDays - leaveBalance.pendingLeaveDays} days
                  <br />
                  <strong>Note:</strong> Sick leave and other leave don't count against your annual leave balance.
                </Typography>
              </Alert>
            </Box>
          ) : (
            <Alert severity="error">
              Failed to load leave balance information.
            </Alert>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        {activeTab === 0 && (
          <LoadingButton
            onClick={handleSubmit}
            loading={loading}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!startDate || !endDate || !reason.trim() || calculatedDays === 0}
          >
            Submit Request
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LeaveRequestModal;