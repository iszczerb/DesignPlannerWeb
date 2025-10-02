import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Divider
} from '@mui/material';
import { EmployeeCalendarDto, LeaveType, LeaveDuration, Slot } from '../../types/schedule';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAppSelector } from '../../store/hooks';
import { UserRole } from '../../types/auth';

interface EmployeeLeaveInfo {
  employeeId: number;
  employeeName: string;
  leaves: {
    leaveType: LeaveType;
    duration: LeaveDuration;
    slot?: Slot;
  }[];
}

interface ClearBlockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  employees: EmployeeCalendarDto[];
  onSubmit: (clearData: {
    employeeIds: number[];
    leaveTypes: LeaveType[];
    date: Date;
  }) => void;
}

const ClearBlockingModal: React.FC<ClearBlockingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  employees,
  onSubmit
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const isTeamMember = user?.role === UserRole.TeamMember;

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<LeaveType[]>([]);
  const [error, setError] = useState<string>('');

  // Get employees with leaves on this date
  const employeesWithLeaves = useMemo((): EmployeeLeaveInfo[] => {
    if (!employees || employees.length === 0) return [];

    const targetDateStr = selectedDate.toDateString();
    const result: EmployeeLeaveInfo[] = [];

    employees.forEach(employee => {
      const dayAssignment = employee.dayAssignments.find(
        assignment => new Date(assignment.date).toDateString() === targetDateStr
      );

      if (!dayAssignment) return;

      // Skip if this day is a bank holiday (check both isHoliday flag and leaveType)
      const isBankHoliday = dayAssignment.isHoliday === true || dayAssignment.leave?.leaveType === LeaveType.BankHoliday;
      if (isBankHoliday) return;

      const leaves: { leaveType: LeaveType; duration: LeaveDuration; slot?: Slot }[] = [];

      // Check for full-day leave (not bank holiday)
      if (dayAssignment.leave && dayAssignment.leave.leaveType !== LeaveType.BankHoliday) {
        leaves.push({
          leaveType: dayAssignment.leave.leaveType,
          duration: dayAssignment.leave.duration,
          slot: dayAssignment.leave.slot
        });
      }

      // Check for morning slot leave
      if (dayAssignment.morningSlot?.leave && dayAssignment.morningSlot.leave.leaveType !== LeaveType.BankHoliday) {
        leaves.push({
          leaveType: dayAssignment.morningSlot.leave.leaveType,
          duration: dayAssignment.morningSlot.leave.duration,
          slot: Slot.Morning
        });
      }

      // Check for afternoon slot leave
      if (dayAssignment.afternoonSlot?.leave && dayAssignment.afternoonSlot.leave.leaveType !== LeaveType.BankHoliday) {
        leaves.push({
          leaveType: dayAssignment.afternoonSlot.leave.leaveType,
          duration: dayAssignment.afternoonSlot.leave.duration,
          slot: Slot.Afternoon
        });
      }

      if (leaves.length > 0) {
        result.push({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          leaves
        });
      }
    });

    return result;
  }, [employees, selectedDate]);

  // Get available leave types based on selected employees
  const availableLeaveTypes = useMemo((): LeaveType[] => {
    if (selectedEmployeeIds.length === 0) return [];

    const leaveTypesSet = new Set<LeaveType>();

    selectedEmployeeIds.forEach(empId => {
      const empInfo = employeesWithLeaves.find(e => e.employeeId === empId);
      if (empInfo) {
        empInfo.leaves.forEach(leave => {
          leaveTypesSet.add(leave.leaveType);
        });
      }
    });

    return Array.from(leaveTypesSet);
  }, [selectedEmployeeIds, employeesWithLeaves]);

  useEffect(() => {
    if (isOpen) {
      // For team members, auto-select their own employee if they have leaves
      if (isTeamMember && user?.employee?.id) {
        const hasLeaves = employeesWithLeaves.some(emp => emp.employeeId === user.employee.id);
        if (hasLeaves) {
          console.log('🔍 Auto-selecting employee for team member:', user.employee.id);
          setSelectedEmployeeIds([user.employee.id]);
        } else {
          setSelectedEmployeeIds([]);
        }
      } else {
        // For managers/admins, reset selection
        setSelectedEmployeeIds([]);
      }

      // Reset selections
      setSelectedLeaveTypes([]);
      setError('');
    }
  }, [isOpen, isTeamMember, user?.employee?.id, employeesWithLeaves]);

  // Auto-clear invalid leave type selections when available types change
  useEffect(() => {
    if (selectedLeaveTypes.length > 0) {
      const validTypes = selectedLeaveTypes.filter(type => availableLeaveTypes.includes(type));
      if (validTypes.length !== selectedLeaveTypes.length) {
        setSelectedLeaveTypes(validTypes);
      }
    }
  }, [availableLeaveTypes, selectedLeaveTypes]);

  if (!isOpen) return null;

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
    setError('');
  };

  const handleLeaveTypeToggle = (leaveType: LeaveType) => {
    setSelectedLeaveTypes(prev =>
      prev.includes(leaveType)
        ? prev.filter(type => type !== leaveType)
        : [...prev, leaveType]
    );
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployeeIds.length === 0) {
      setError('Please select at least one employee.');
      return;
    }

    if (selectedLeaveTypes.length === 0) {
      setError('Please select at least one leave type to clear.');
      return;
    }

    onSubmit({
      employeeIds: selectedEmployeeIds,
      leaveTypes: selectedLeaveTypes,
      date: selectedDate
    });
  };

  const formatDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getLeaveTypeColor = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.AnnualLeave: return '--dp-success';
      case LeaveType.SickDay: return '--dp-error';
      case LeaveType.OtherLeave: return '--dp-neutral';
      default: return '--dp-neutral';
    }
  };

  const getLeaveTypeIcon = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.AnnualLeave: return '✈️';
      case LeaveType.SickDay: return '🤒';
      case LeaveType.OtherLeave: return '📋';
      default: return '✈️';
    }
  };

  const getLeaveTypeLabel = (type: LeaveType): string => {
    switch (type) {
      case LeaveType.AnnualLeave: return 'Annual Leave';
      case LeaveType.SickDay: return 'Sick Day';
      case LeaveType.OtherLeave: return 'Other Leave';
      default: return 'Leave';
    }
  };

  const leaveTypeOptions = [
    { value: LeaveType.AnnualLeave, label: 'Annual Leave', icon: '✈️' },
    { value: LeaveType.SickDay, label: 'Sick Day', icon: '🤒' },
    { value: LeaveType.OtherLeave, label: 'Other Leave', icon: '📋' }
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
        },
      }}
    >
      <ModalHeader
        title="Clear Blocking"
        subtitle={formatDate}
        onClose={onClose}
        variant="error"
      />

      <DialogContent sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {employeesWithLeaves.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No leaves found on this date.
            </Alert>
          )}

          {/* Employees Section */}
          {employeesWithLeaves.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-label-large)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-800)',
                  marginBottom: 'var(--dp-space-2)',
                }}
              >
                Select Team Members
              </Typography>
              <Box
                sx={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: 'var(--dp-space-2)',
                  backgroundColor: 'var(--dp-neutral-50)',
                  borderRadius: 'var(--dp-radius-lg)',
                  border: '1px solid var(--dp-neutral-200)',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'var(--dp-neutral-100)',
                    borderRadius: 'var(--dp-radius-lg)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'var(--dp-neutral-400)',
                    borderRadius: 'var(--dp-radius-lg)',
                    '&:hover': {
                      backgroundColor: 'var(--dp-neutral-500)',
                    },
                  },
                }}
              >
                {employeesWithLeaves.map((empInfo) => (
                  <FormControlLabel
                    key={empInfo.employeeId}
                    control={
                      <Checkbox
                        checked={selectedEmployeeIds.includes(empInfo.employeeId)}
                        onChange={() => handleEmployeeToggle(empInfo.employeeId)}
                        sx={{
                          color: 'var(--dp-neutral-400)',
                          '&.Mui-checked': {
                            color: 'var(--dp-primary-600)',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: 'var(--dp-font-family-primary)',
                            fontSize: 'var(--dp-text-body-small)',
                            color: 'var(--dp-neutral-800)',
                          }}
                        >
                          {empInfo.employeeName}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'var(--dp-font-family-primary)',
                            fontSize: 'var(--dp-text-caption)',
                            color: 'var(--dp-neutral-600)',
                            display: 'flex',
                            gap: 'var(--dp-space-1)',
                            flexWrap: 'wrap',
                          }}
                        >
                          {empInfo.leaves.map((leave, idx) => (
                            <span key={idx}>
                              {getLeaveTypeIcon(leave.leaveType)} {getLeaveTypeLabel(leave.leaveType)}
                              {leave.duration === LeaveDuration.HalfDay && ` (${leave.slot === Slot.Morning ? 'AM' : 'PM'})`}
                              {idx < empInfo.leaves.length - 1 && ', '}
                            </span>
                          ))}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      width: '100%',
                      margin: 0,
                      padding: 'var(--dp-space-2)',
                      borderRadius: 'var(--dp-radius-sm)',
                      '&:hover': {
                        backgroundColor: 'var(--dp-neutral-100)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Leave Types Section - Only show if employees are selected */}
          {selectedEmployeeIds.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-label-large)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-800)',
                  marginBottom: 'var(--dp-space-2)',
                }}
              >
                Select Leave Types to Clear
              </Typography>
              <Box sx={{ display: 'flex', gap: 'var(--dp-space-3)', flexWrap: 'wrap' }}>
                {leaveTypeOptions.map(option => {
                  const isAvailable = availableLeaveTypes.includes(option.value);
                  const isSelected = selectedLeaveTypes.includes(option.value);
                  const tokenColor = getLeaveTypeColor(option.value);

                  if (!isAvailable) return null; // Only show available leave types

                  return (
                    <Box
                      key={option.value}
                      onClick={() => handleLeaveTypeToggle(option.value)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--dp-space-3) var(--dp-space-4)',
                        border: isSelected
                          ? `2px solid var(${tokenColor}-600)`
                          : '2px solid var(--dp-neutral-300)',
                        borderRadius: 'var(--dp-radius-lg)',
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? `var(${tokenColor}-50)`
                          : 'var(--dp-neutral-0)',
                        minWidth: '130px',
                        transition: 'var(--dp-transition-fast)',
                        '&:hover': {
                          borderColor: `var(${tokenColor}-400)`,
                          backgroundColor: `var(${tokenColor}-50)`,
                          transform: 'translateY(-1px)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 'var(--dp-text-title-medium)', marginRight: 'var(--dp-space-2)' }}>
                        {option.icon}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontSize: 'var(--dp-text-body-small)',
                          fontWeight: isSelected ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-medium)',
                          color: isSelected ? `var(${tokenColor}-700)` : 'var(--dp-neutral-700)',
                        }}
                      >
                        {option.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </form>
      </DialogContent>

      <ModalFooter
        primaryAction={
          <StandardButton
            onClick={handleSubmit}
            variant="error"
            startIcon={<DeleteIcon />}
            disabled={selectedEmployeeIds.length === 0 || selectedLeaveTypes.length === 0}
          >
            Clear Selected
          </StandardButton>
        }
        secondaryActions={[
          <StandardButton
            key="cancel"
            onClick={onClose}
            variant="neutral"
            startIcon={<CancelIcon />}
          >
            Cancel
          </StandardButton>
        ]}
      />
    </Dialog>
  );
};

export default ClearBlockingModal;
