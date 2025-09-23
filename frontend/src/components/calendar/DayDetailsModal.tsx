import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }} onClick={onClose}>
        <motion.div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '90vh',
            width: '90%',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                color: '#1f2937'
              }}>
                📅 Day Overview
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                {formatDate(day.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px'
              }}
            >
              ×
            </button>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {dayStats.totalTasks}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Tasks</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {dayStats.totalHours}h
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Hours</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {dayStats.totalActiveEmployees}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Employees</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {capacityPercentage}%
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Capacity Used</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {dayStats.onLeave}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>On Leave</div>
            </div>

            {dayStats.overbooked > 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                textAlign: 'center',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {dayStats.overbooked}
                </div>
                <div style={{ fontSize: '12px', color: '#dc2626' }}>Overbooked</div>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Task Status Breakdown */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                📊 Task Status
              </h3>
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                {Object.entries(dayStats.tasksByStatus).map(([status, count]) => {
                  if (count === 0) return null;
                  return (
                    <div key={status} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#6b7280' }}>
                        {getStatusLabel(Number(status) as TaskStatus)}
                      </span>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Priority Breakdown */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                🎯 Task Priority
              </h3>
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                {Object.entries(dayStats.tasksByPriority).map(([priority, count]) => {
                  if (count === 0) return null;
                  return (
                    <div key={priority} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#6b7280' }}>
                        {getPriorityLabel(Number(priority) as TaskPriority)}
                      </span>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Client Breakdown */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                🏢 Client Breakdown
              </h3>
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                {Object.entries(dayStats.tasksByClient).map(([client, data]) => (
                  <div key={client} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: data.color,
                        borderRadius: '2px',
                        marginRight: '8px'
                      }} />
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>{client}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{data.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Types */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                🔧 Task Types
              </h3>
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                {Object.entries(dayStats.tasksByType).map(([type, count]) => (
                  <div key={type} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#6b7280' }}>{type}</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Details */}
            {dayStats.leaveDetails.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                  🏖️ Leave Details
                </h3>
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                  {dayStats.leaveDetails.map((leave, index) => (
                    <div key={index} style={{
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#ffffff',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {leave.employeeName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {getLeaveTypeLabel(leave.leaveType)}
                        {leave.slot && ` (${leave.slot === Slot.Morning ? 'Morning' : 'Afternoon'} only)`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'right'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DayDetailsModal;