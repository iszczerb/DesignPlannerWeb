import React, { useMemo } from 'react';
import { Dialog, DialogContent, Box, Typography, Divider } from '@mui/material';
import {
  CalendarDayDto,
  EmployeeScheduleDto,
  AssignmentTaskDto,
  TaskStatus,
  TaskPriority,
  LeaveType,
  Slot
} from '../../types/schedule';
import { calculateActualHours } from '../../utils/taskLayoutHelpers';
import { ModalHeader, ModalFooter, StandardButton } from '../common/modal';
import CloseIcon from '@mui/icons-material/Close';

interface DayDetailsModalProps {
  isOpen: boolean;
  day: CalendarDayDto | null;
  employees: EmployeeScheduleDto[];
  onClose: () => void;
}

interface DayStats {
  totalTasks: number;
  totalHours: number;
  totalActiveEmployees: number;
  totalCapacity: number;
  usedCapacity: number;
  onLeave: number;
  overbooked: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByType: Record<string, number>;
  tasksByClient: Record<string, { count: number; color: string }>;
  leaveDetails: Array<{
    employeeName: string;
    leaveType: LeaveType;
    slot?: Slot;
  }>;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  day,
  employees,
  onClose
}) => {
  const dayStats = useMemo((): DayStats | null => {
    if (!day || !employees) return null;

    const stats: DayStats = {
      totalTasks: 0,
      totalHours: 0,
      totalActiveEmployees: 0,
      totalCapacity: 0,
      usedCapacity: 0,
      onLeave: 0,
      overbooked: 0,
      tasksByStatus: {} as Record<TaskStatus, number>,
      tasksByPriority: {} as Record<TaskPriority, number>,
      tasksByType: {},
      tasksByClient: {},
      leaveDetails: []
    };

    // Initialize counters
    Object.values(TaskStatus).forEach(status => {
      if (typeof status === 'number') {
        stats.tasksByStatus[status] = 0;
      }
    });
    Object.values(TaskPriority).forEach(priority => {
      if (typeof priority === 'number') {
        stats.tasksByPriority[priority] = 0;
      }
    });

    employees.forEach(employee => {
      const dayAssignment = employee.dayAssignments.find(
        assignment => assignment.date === day.date
      );

      if (!dayAssignment) return;

      // Count active employees for this day
      const hasAnyActivity = dayAssignment.morningSlot?.tasks.length ||
                            dayAssignment.afternoonSlot?.tasks.length ||
                            dayAssignment.leave;

      if (hasAnyActivity) {
        stats.totalActiveEmployees++;
      }


      // Check for leave
      if (dayAssignment.leave) {
        stats.onLeave++;
        stats.leaveDetails.push({
          employeeName: employee.employeeName,
          leaveType: dayAssignment.leave.leaveType,
          slot: dayAssignment.leave.slot
        });
      }

      // Calculate capacity using ACTUAL HOURS (same as team member row progress bars)
      const morningTasks = dayAssignment.morningSlot?.tasks || [];
      const afternoonTasks = dayAssignment.afternoonSlot?.tasks || [];
      const allTasks: AssignmentTaskDto[] = [...morningTasks, ...afternoonTasks];

      // Each employee has 2 slots per day (Morning + Afternoon) = 2.0 total capacity
      const capacity = 2;
      stats.totalCapacity += capacity;

      // Calculate actual hours for morning slot
      let morningHours = 0;
      morningTasks.forEach((task, index) => {
        morningHours += calculateActualHours(task, index, morningTasks.length);
      });
      // Convert hours to capacity (4 hours = 1.0 capacity)
      const morningFilling = Math.min(morningHours / 4, 1.0);

      // Calculate actual hours for afternoon slot
      let afternoonHours = 0;
      afternoonTasks.forEach((task, index) => {
        afternoonHours += calculateActualHours(task, index, afternoonTasks.length);
      });
      // Convert hours to capacity (4 hours = 1.0 capacity)
      const afternoonFilling = Math.min(afternoonHours / 4, 1.0);

      const totalUsedCapacity = morningFilling + afternoonFilling;
      stats.usedCapacity += totalUsedCapacity;

      stats.totalTasks += allTasks.length;

      // Add the actual hours to total (already calculated above)
      stats.totalHours += morningHours + afternoonHours;

      // Check if overbooked
      if (dayAssignment.morningSlot?.isOverbooked || dayAssignment.afternoonSlot?.isOverbooked) {
        stats.overbooked++;
      }

      // Analyze tasks
      allTasks.forEach(task => {
        // By status
        stats.tasksByStatus[task.taskStatus]++;

        // By priority
        stats.tasksByPriority[task.priority]++;

        // By type
        const taskType = task.taskTypeName || 'Unknown';
        stats.tasksByType[taskType] = (stats.tasksByType[taskType] || 0) + 1;

        // By client
        const clientKey = `${task.clientCode} - ${task.clientName}`;
        if (!stats.tasksByClient[clientKey]) {
          stats.tasksByClient[clientKey] = {
            count: 0,
            color: task.clientColor || '#6b7280'
          };
        }
        stats.tasksByClient[clientKey].count++;
      });
    });

    return stats;
  }, [day, employees]);

  if (!isOpen || !day || !dayStats) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NotStarted: return 'Not Started';
      case TaskStatus.InProgress: return 'In Progress';
      case TaskStatus.Done: return 'Done';
      case TaskStatus.OnHold: return 'On Hold';
      case TaskStatus.Blocked: return 'Blocked';
      default: return 'Unknown';
    }
  };

  const getPriorityLabel = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.Low: return 'Low';
      case TaskPriority.Medium: return 'Medium';
      case TaskPriority.High: return 'High';
      case TaskPriority.Critical: return 'Critical';
      default: return 'Unknown';
    }
  };

  const getLeaveTypeLabel = (leaveType: LeaveType): string => {
    switch (leaveType) {
      case LeaveType.AnnualLeave: return 'Annual Leave';
      case LeaveType.SickDay: return 'Sick Day';
      case LeaveType.OtherLeave: return 'Other Leave';
      default: return 'Unknown';
    }
  };

  const capacityPercentage = dayStats.totalCapacity > 0
    ? Math.round((dayStats.usedCapacity / dayStats.totalCapacity) * 100)
    : 0;

  const renderStatCard = (title: string, value: string | number, icon: string, tokenColor: string, isAlert?: boolean) => (
    <Box
      sx={{
        backgroundColor: isAlert ? 'var(--dp-error-50)' : 'var(--dp-neutral-0)',
        padding: 'var(--dp-space-4)',
        borderRadius: 'var(--dp-radius-lg)',
        border: isAlert ? '1px solid var(--dp-error-300)' : `1px solid var(${tokenColor}-100)`,
        borderLeft: isAlert ? '3px solid var(--dp-error-600)' : `3px solid var(${tokenColor}-500)`,
        boxShadow: 'var(--dp-shadow-sm)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--dp-space-2)',
      }}
    >
      <Typography
        sx={{
          fontSize: 'var(--dp-text-title-large)',
          color: isAlert ? 'var(--dp-error-600)' : `var(${tokenColor}-500)`,
        }}
      >
        {icon}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'var(--dp-font-family-primary)',
          fontSize: 'var(--dp-text-title-large)',
          fontWeight: 'var(--dp-font-weight-bold)',
          color: isAlert ? 'var(--dp-error-700)' : 'var(--dp-neutral-900)',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'var(--dp-font-family-primary)',
          fontSize: 'var(--dp-text-label-small)',
          color: isAlert ? 'var(--dp-error-600)' : 'var(--dp-neutral-600)',
          fontWeight: 'var(--dp-font-weight-medium)',
        }}
      >
        {title}
      </Typography>
    </Box>
  );

  const renderBreakdownCard = (title: string, icon: string, children: React.ReactNode) => (
    <Box>
      <Typography
        sx={{
          fontFamily: 'var(--dp-font-family-primary)',
          fontSize: 'var(--dp-text-body-large)',
          fontWeight: 'var(--dp-font-weight-semibold)',
          color: 'var(--dp-neutral-900)',
          marginBottom: 'var(--dp-space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--dp-space-2)',
        }}
      >
        <span>{icon}</span>
        {title}
      </Typography>
      <Box
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-4)',
          borderRadius: 'var(--dp-radius-md)',
          border: '1px solid var(--dp-neutral-200)',
        }}
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
          maxWidth: '900px',
        },
      }}
    >
      <ModalHeader
        title="Day Overview"
        subtitle={formatDate(day.date)}
        onClose={onClose}
        variant="primary"
      />

      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 'var(--dp-space-6)',
        }}
      >
        {/* Summary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--dp-space-4)',
            marginBottom: 'var(--dp-space-6)',
          }}
        >
          {renderStatCard('Total Tasks', dayStats.totalTasks, '📋', '--dp-primary')}
          {renderStatCard('Total Hours', `${dayStats.totalHours}h`, '⏰', '--dp-success')}
          {renderStatCard('Active Employees', dayStats.totalActiveEmployees, '👥', '--dp-info')}
          {renderStatCard('Capacity Used', `${capacityPercentage}%`, '📊', '--dp-warning')}
          {renderStatCard('On Leave', dayStats.onLeave, '🏖️', '--dp-neutral')}
          {dayStats.overbooked > 0 && renderStatCard('Overbooked', dayStats.overbooked, '⚠️', '--dp-error', true)}
        </Box>

        <Divider sx={{ marginY: 'var(--dp-space-5)', borderColor: 'var(--dp-neutral-200)' }} />

        {/* Breakdown Sections */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--dp-space-5)',
          }}
        >
          {/* Task Status */}
          {renderBreakdownCard('Task Status', '📊', (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-2)' }}>
              {Object.entries(dayStats.tasksByStatus).map(([status, count]) => {
                if (count === 0) return null;
                return (
                  <Box
                    key={status}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-small)',
                        color: 'var(--dp-neutral-700)',
                      }}
                    >
                      {getStatusLabel(Number(status) as TaskStatus)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-small)',
                        fontWeight: 'var(--dp-font-weight-semibold)',
                        color: 'var(--dp-neutral-900)',
                      }}
                    >
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}

          {/* Task Priority */}
          {renderBreakdownCard('Task Priority', '🎯', (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-2)' }}>
              {Object.entries(dayStats.tasksByPriority).map(([priority, count]) => {
                if (count === 0) return null;
                return (
                  <Box
                    key={priority}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-small)',
                        color: 'var(--dp-neutral-700)',
                      }}
                    >
                      {getPriorityLabel(Number(priority) as TaskPriority)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-small)',
                        fontWeight: 'var(--dp-font-weight-semibold)',
                        color: 'var(--dp-neutral-900)',
                      }}
                    >
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}

          {/* Client Breakdown */}
          {renderBreakdownCard('Client Breakdown', '🏢', (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-2)' }}>
              {Object.entries(dayStats.tasksByClient).map(([client, data]) => (
                <Box
                  key={client}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--dp-space-2)', flex: 1 }}>
                    <Box
                      sx={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: data.color,
                        borderRadius: 'var(--dp-radius-xs)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-body-small)',
                        color: 'var(--dp-neutral-700)',
                      }}
                    >
                      {client}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {data.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}

          {/* Task Types */}
          {renderBreakdownCard('Task Types', '🔧', (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-2)' }}>
              {Object.entries(dayStats.tasksByType).map(([type, count]) => (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-700)',
                    }}
                  >
                    {type}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}

          {/* Leave Details */}
          {dayStats.leaveDetails.length > 0 && renderBreakdownCard('Leave Details', '🏖️', (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--dp-space-2)' }}>
              {dayStats.leaveDetails.map((leave, index) => (
                <Box
                  key={index}
                  sx={{
                    padding: 'var(--dp-space-3)',
                    backgroundColor: 'var(--dp-neutral-0)',
                    borderRadius: 'var(--dp-radius-md)',
                    border: '1px solid var(--dp-neutral-200)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                      marginBottom: 'var(--dp-space-1)',
                    }}
                  >
                    {leave.employeeName}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-600)',
                    }}
                  >
                    {getLeaveTypeLabel(leave.leaveType)}
                    {leave.slot && ` (${leave.slot === Slot.Morning ? 'Morning' : 'Afternoon'} only)`}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </DialogContent>

      <ModalFooter
        primaryAction={
          <StandardButton
            variant="contained"
            colorScheme="neutral"
            leftIcon={<CloseIcon />}
            onClick={onClose}
          >
            Close
          </StandardButton>
        }
      />
    </Dialog>
  );
};

export default DayDetailsModal;
