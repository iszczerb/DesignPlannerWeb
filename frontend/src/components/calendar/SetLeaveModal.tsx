import React, { useState, useEffect } from 'react';
import { EmployeeCalendarDto, CalendarDayDto } from '../../types/schedule';

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

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedEmployeeIds([]);
      setLeaveType(LeaveType.AnnualLeave);
      setDuration(LeaveDuration.FullDay);
      setSlot(Slot.Morning);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee.');
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
      case LeaveType.AnnualLeave: return '#10b981'; // Green
      case LeaveType.SickDay: return '#ef4444'; // Red
      case LeaveType.OtherLeave: return '#6b7280'; // Gray
      default: return '#10b981';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              Set Leave
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>
          <p style={{
            margin: '8px 0 0 0',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {formatDate}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Employee Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Select Employees
            </label>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px'
            }}>
              {employees.map(employee => (
                <label
                  key={employee.employeeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.includes(employee.employeeId)}
                    onChange={() => handleEmployeeToggle(employee.employeeId)}
                    style={{
                      marginRight: '12px',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    {employee.employeeName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Leave Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Leave Type
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.values(LeaveType).filter(v => typeof v === 'number').map(type => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    border: `2px solid ${leaveType === type ? getLeaveTypeColor(type as LeaveType) : '#d1d5db'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: leaveType === type ? `${getLeaveTypeColor(type as LeaveType)}10` : 'white',
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={type}
                    checked={leaveType === type}
                    onChange={(e) => setLeaveType(Number(e.target.value) as LeaveType)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>
                    {getLeaveTypeIcon(type as LeaveType)}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: leaveType === type ? getLeaveTypeColor(type as LeaveType) : '#374151'
                  }}>
                    {type === LeaveType.AnnualLeave ? 'Annual Leave' :
                     type === LeaveType.SickDay ? 'Sick Day' :
                     'Other Leave'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Duration
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                border: `2px solid ${duration === LeaveDuration.FullDay ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: duration === LeaveDuration.FullDay ? '#eff6ff' : 'white',
                flex: 1
              }}>
                <input
                  type="radio"
                  name="duration"
                  value={LeaveDuration.FullDay}
                  checked={duration === LeaveDuration.FullDay}
                  onChange={(e) => setDuration(Number(e.target.value) as LeaveDuration)}
                  style={{ display: 'none' }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: duration === LeaveDuration.FullDay ? '#3b82f6' : '#374151'
                }}>
                  Full Day
                </span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                border: `2px solid ${duration === LeaveDuration.HalfDay ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: duration === LeaveDuration.HalfDay ? '#eff6ff' : 'white',
                flex: 1
              }}>
                <input
                  type="radio"
                  name="duration"
                  value={LeaveDuration.HalfDay}
                  checked={duration === LeaveDuration.HalfDay}
                  onChange={(e) => setDuration(Number(e.target.value) as LeaveDuration)}
                  style={{ display: 'none' }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: duration === LeaveDuration.HalfDay ? '#3b82f6' : '#374151'
                }}>
                  Half Day
                </span>
              </label>
            </div>
          </div>

          {/* Half Day Slot Selection */}
          {duration === LeaveDuration.HalfDay && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Time Slot
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: `2px solid ${slot === Slot.Morning ? '#f59e0b' : '#d1d5db'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: slot === Slot.Morning ? '#fffbeb' : 'white',
                  flex: 1
                }}>
                  <input
                    type="radio"
                    name="slot"
                    value={Slot.Morning}
                    checked={slot === Slot.Morning}
                    onChange={(e) => setSlot(Number(e.target.value) as Slot)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: slot === Slot.Morning ? '#f59e0b' : '#374151'
                  }}>
                    🌅 Morning (AM)
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: `2px solid ${slot === Slot.Afternoon ? '#8b5cf6' : '#d1d5db'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: slot === Slot.Afternoon ? '#faf5ff' : 'white',
                  flex: 1
                }}>
                  <input
                    type="radio"
                    name="slot"
                    value={Slot.Afternoon}
                    checked={slot === Slot.Afternoon}
                    onChange={(e) => setSlot(Number(e.target.value) as Slot)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: slot === Slot.Afternoon ? '#8b5cf6' : '#374151'
                  }}>
                    🌆 Afternoon (PM)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '32px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Set Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetLeaveModal;