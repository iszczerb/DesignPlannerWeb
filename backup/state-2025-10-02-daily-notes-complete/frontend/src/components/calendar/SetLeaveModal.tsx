import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert
} from '@mui/material';
import { EmployeeCalendarDto, CalendarDayDto } from '../../types/schedule';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

export enum LeaveType {
  AnnualLeave = 1,
  SickDay = 2,
  OtherLeave = 3
}

export enum LeaveDuration {
  FullDay = 1,
  HalfDay = 2
}

export enum Slot {
  Morning = 1,
  Afternoon = 2
}

interface SetLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  employees: EmployeeCalendarDto[];
  onSubmit: (leaveData: {
    employeeIds: number[];
    leaveType: LeaveType;
    duration: LeaveDuration;
    slot?: Slot;
    date: Date;
  }) => void;
}

const SetLeaveModal: React.FC<SetLeaveModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  employees,
  onSubmit
}) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.AnnualLeave);
  const [duration, setDuration] = useState<LeaveDuration>(LeaveDuration.FullDay);
  const [slot, setSlot] = useState<Slot>(Slot.Morning);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedEmployeeIds([]);
      setLeaveType(LeaveType.AnnualLeave);
      setDuration(LeaveDuration.FullDay);
      setSlot(Slot.Morning);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployeeIds.length === 0) {
      setError('Please select at least one employee.');
      return;
    }

    onSubmit({
      employeeIds: selectedEmployeeIds,
      leaveType,
      duration,
      slot: duration === LeaveDuration.HalfDay ? slot : undefined,
      date: selectedDate
    });
  };

  const formatDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getLeaveTypeIcon = (type: LeaveType) => {
    switch (type) {
      case LeaveType.AnnualLeave: return '✈️';
      case LeaveType.SickDay: return '🤒';
      case LeaveType.OtherLeave: return '📋';
      default: return '✈️';
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.AnnualLeave: return '--dp-success';
      case LeaveType.SickDay: return '--dp-error';
      case LeaveType.OtherLeave: return '--dp-neutral';
      default: return '--dp-success';
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
        title="Set Leave"
        subtitle={formatDate}
        onClose={onClose}
        variant="primary"
      />

      <form onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            backgroundColor: 'var(--dp-neutral-50)',
            padding: 'var(--dp-space-6)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-5)' }}>
            {/* Employee Selection */}
            <Box>
              <Typography
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-label-large)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-800)',
                  marginBottom: 'var(--dp-space-2)',
                }}
              >
                Select Employees
              </Typography>
              <Box
                sx={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--dp-neutral-300)',
                  borderRadius: 'var(--dp-radius-md)',
                  padding: 'var(--dp-space-2)',
                  backgroundColor: 'var(--dp-neutral-0)',
                }}
              >
                {employees.map(employee => (
                  <FormControlLabel
                    key={employee.employeeId}
                    control={
                      <Checkbox
                        checked={selectedEmployeeIds.includes(employee.employeeId)}
                        onChange={() => handleEmployeeToggle(employee.employeeId)}
                        sx={{
                          color: 'var(--dp-neutral-400)',
                          '&.Mui-checked': {
                            color: 'var(--dp-primary-600)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontSize: 'var(--dp-text-body-small)',
                          color: 'var(--dp-neutral-800)',
                        }}
                      >
                        {employee.employeeName}
                      </Typography>
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

            {/* Leave Type */}
            <Box>
              <Typography
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-label-large)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-800)',
                  marginBottom: 'var(--dp-space-2)',
                }}
              >
                Leave Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 'var(--dp-space-3)', flexWrap: 'wrap' }}>
                {leaveTypeOptions.map(option => {
                  const tokenColor = getLeaveTypeColor(option.value);
                  const isSelected = leaveType === option.value;
                  return (
                    <Box
                      key={option.value}
                      onClick={() => setLeaveType(option.value)}
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

            {/* Duration */}
            <Box>
              <Typography
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-label-large)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-800)',
                  marginBottom: 'var(--dp-space-2)',
                }}
              >
                Duration
              </Typography>
              <RadioGroup
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as LeaveDuration)}
                sx={{ display: 'flex', flexDirection: 'row', gap: 'var(--dp-space-3)' }}
              >
                <Box
                  sx={{
                    flex: 1,
                    border: duration === LeaveDuration.FullDay
                      ? '2px solid var(--dp-primary-600)'
                      : '2px solid var(--dp-neutral-300)',
                    borderRadius: 'var(--dp-radius-lg)',
                    backgroundColor: duration === LeaveDuration.FullDay
                      ? 'var(--dp-primary-50)'
                      : 'var(--dp-neutral-0)',
                    cursor: 'pointer',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      borderColor: 'var(--dp-primary-400)',
                      backgroundColor: 'var(--dp-primary-50)',
                    },
                  }}
                  onClick={() => setDuration(LeaveDuration.FullDay)}
                >
                  <FormControlLabel
                    value={LeaveDuration.FullDay}
                    control={
                      <Radio
                        sx={{
                          color: 'var(--dp-neutral-400)',
                          '&.Mui-checked': {
                            color: 'var(--dp-primary-600)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontSize: 'var(--dp-text-body-small)',
                          fontWeight: duration === LeaveDuration.FullDay ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-medium)',
                          color: duration === LeaveDuration.FullDay ? 'var(--dp-primary-700)' : 'var(--dp-neutral-700)',
                        }}
                      >
                        Full Day
                      </Typography>
                    }
                    sx={{ margin: 0, padding: 'var(--dp-space-3)', width: '100%' }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    border: duration === LeaveDuration.HalfDay
                      ? '2px solid var(--dp-primary-600)'
                      : '2px solid var(--dp-neutral-300)',
                    borderRadius: 'var(--dp-radius-lg)',
                    backgroundColor: duration === LeaveDuration.HalfDay
                      ? 'var(--dp-primary-50)'
                      : 'var(--dp-neutral-0)',
                    cursor: 'pointer',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      borderColor: 'var(--dp-primary-400)',
                      backgroundColor: 'var(--dp-primary-50)',
                    },
                  }}
                  onClick={() => setDuration(LeaveDuration.HalfDay)}
                >
                  <FormControlLabel
                    value={LeaveDuration.HalfDay}
                    control={
                      <Radio
                        sx={{
                          color: 'var(--dp-neutral-400)',
                          '&.Mui-checked': {
                            color: 'var(--dp-primary-600)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontSize: 'var(--dp-text-body-small)',
                          fontWeight: duration === LeaveDuration.HalfDay ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-medium)',
                          color: duration === LeaveDuration.HalfDay ? 'var(--dp-primary-700)' : 'var(--dp-neutral-700)',
                        }}
                      >
                        Half Day
                      </Typography>
                    }
                    sx={{ margin: 0, padding: 'var(--dp-space-3)', width: '100%' }}
                  />
                </Box>
              </RadioGroup>
            </Box>

            {/* Half Day Slot Selection */}
            {duration === LeaveDuration.HalfDay && (
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-label-large)',
                    fontWeight: 'var(--dp-font-weight-semibold)',
                    color: 'var(--dp-neutral-800)',
                    marginBottom: 'var(--dp-space-2)',
                  }}
                >
                  Time Slot
                </Typography>
                <RadioGroup
                  value={slot}
                  onChange={(e) => setSlot(Number(e.target.value) as Slot)}
                  sx={{ display: 'flex', flexDirection: 'row', gap: 'var(--dp-space-3)' }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      border: slot === Slot.Morning
                        ? '2px solid var(--dp-warning-600)'
                        : '2px solid var(--dp-neutral-300)',
                      borderRadius: 'var(--dp-radius-lg)',
                      backgroundColor: slot === Slot.Morning
                        ? 'var(--dp-warning-50)'
                        : 'var(--dp-neutral-0)',
                      cursor: 'pointer',
                      transition: 'var(--dp-transition-fast)',
                      '&:hover': {
                        borderColor: 'var(--dp-warning-400)',
                        backgroundColor: 'var(--dp-warning-50)',
                      },
                    }}
                    onClick={() => setSlot(Slot.Morning)}
                  >
                    <FormControlLabel
                      value={Slot.Morning}
                      control={
                        <Radio
                          sx={{
                            color: 'var(--dp-neutral-400)',
                            '&.Mui-checked': {
                              color: 'var(--dp-warning-600)',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontFamily: 'var(--dp-font-family-primary)',
                            fontSize: 'var(--dp-text-body-small)',
                            fontWeight: slot === Slot.Morning ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-medium)',
                            color: slot === Slot.Morning ? 'var(--dp-warning-700)' : 'var(--dp-neutral-700)',
                          }}
                        >
                          🌅 Morning (AM)
                        </Typography>
                      }
                      sx={{ margin: 0, padding: 'var(--dp-space-3)', width: '100%' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      border: slot === Slot.Afternoon
                        ? '2px solid var(--dp-info-600)'
                        : '2px solid var(--dp-neutral-300)',
                      borderRadius: 'var(--dp-radius-lg)',
                      backgroundColor: slot === Slot.Afternoon
                        ? 'var(--dp-info-50)'
                        : 'var(--dp-neutral-0)',
                      cursor: 'pointer',
                      transition: 'var(--dp-transition-fast)',
                      '&:hover': {
                        borderColor: 'var(--dp-info-400)',
                        backgroundColor: 'var(--dp-info-50)',
                      },
                    }}
                    onClick={() => setSlot(Slot.Afternoon)}
                  >
                    <FormControlLabel
                      value={Slot.Afternoon}
                      control={
                        <Radio
                          sx={{
                            color: 'var(--dp-neutral-400)',
                            '&.Mui-checked': {
                              color: 'var(--dp-info-600)',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontFamily: 'var(--dp-font-family-primary)',
                            fontSize: 'var(--dp-text-body-small)',
                            fontWeight: slot === Slot.Afternoon ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-medium)',
                            color: slot === Slot.Afternoon ? 'var(--dp-info-700)' : 'var(--dp-neutral-700)',
                          }}
                        >
                          🌆 Afternoon (PM)
                        </Typography>
                      }
                      sx={{ margin: 0, padding: 'var(--dp-space-3)', width: '100%' }}
                    />
                  </Box>
                </RadioGroup>
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  backgroundColor: 'var(--dp-error-50)',
                  color: 'var(--dp-error-900)',
                  borderColor: 'var(--dp-error-300)',
                  fontFamily: 'var(--dp-font-family-primary)',
                  '& .MuiAlert-icon': {
                    color: 'var(--dp-error-600)',
                  },
                }}
              >
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <ModalFooter
          primaryAction={
            <StandardButton
              type="submit"
              variant="contained"
              colorScheme="primary"
              leftIcon={<SaveIcon />}
            >
              Set Leave
            </StandardButton>
          }
          secondaryActions={[
            <StandardButton
              key="cancel"
              variant="outlined"
              colorScheme="neutral"
              leftIcon={<CancelIcon />}
              onClick={onClose}
            >
              Cancel
            </StandardButton>
          ]}
        />
      </form>
    </Dialog>
  );
};

export default SetLeaveModal;
