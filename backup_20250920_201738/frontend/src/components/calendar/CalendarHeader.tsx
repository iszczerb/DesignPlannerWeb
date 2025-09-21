import React from 'react';
import {
  CalendarViewType,
  VIEW_TYPE_LABELS
} from '../../types/schedule';
import scheduleService from '../../services/scheduleService';
import TeamToggle, { TeamViewMode } from './TeamToggle';
import TeamSelectDropdown, { TeamSelection } from './TeamSelectDropdown';
import ViewModeIndicator from './ViewModeIndicator';

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  title?: string;
  employeeFilter?: {
    selectedEmployeeId?: number;
    employees: Array<{ id: number; name: string }>;
    onEmployeeChange: (employeeId?: number) => void;
  };
  // Team management props
  teamViewMode?: TeamViewMode;
  onTeamViewModeChange?: (mode: TeamViewMode) => void;
  // Admin team selection props
  teamSelection?: TeamSelection;
  onTeamSelectionChange?: (selection: TeamSelection) => void;
  currentTeamName?: string;
  showTeamControls?: boolean;
  userRole?: string;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewType,
  onDateChange,
  onViewTypeChange,
  onRefresh,
  isLoading = false,
  title = 'Schedule',
  employeeFilter,
  teamViewMode = TeamViewMode.MyTeam,
  onTeamViewModeChange,
  teamSelection,
  onTeamSelectionChange,
  currentTeamName,
  showTeamControls = false,
  userRole
}) => {
  const getDateRangeText = () => {
    const startDate = scheduleService.getViewStartDate(currentDate, viewType);
    const endDate = scheduleService.getViewEndDate(startDate, viewType);

    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };

    if (viewType === CalendarViewType.Day) {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (viewType === CalendarViewType.Month) {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      const start = startDate.toLocaleDateString('en-US', formatOptions);
      const end = endDate.toLocaleDateString('en-US', formatOptions);
      
      // Add year if different or if we're showing a range that spans years
      const addYear = startDate.getFullYear() !== new Date().getFullYear() || 
                     startDate.getFullYear() !== endDate.getFullYear();
      
      if (addYear) {
        return `${start} - ${end}, ${endDate.getFullYear()}`;
      }
      
      return `${start} - ${end}`;
    }
  };

  const navigateToPrevious = () => {
    let newDate: Date;
    
    switch (viewType) {
      case CalendarViewType.Day:
        // Navigate to previous weekday
        newDate = scheduleService.getPreviousWeekday(currentDate);
        break;
      case CalendarViewType.Week:
        // Navigate back 7 days (1 calendar week), but start date will be adjusted to weekday
        newDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case CalendarViewType.BiWeek:
        // Navigate back 14 days (2 calendar weeks)
        newDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case CalendarViewType.Month:
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        break;
      default:
        newDate = currentDate;
    }
    
    onDateChange(newDate);
  };

  const navigateToNext = () => {
    let newDate: Date;
    
    switch (viewType) {
      case CalendarViewType.Day:
        // Navigate to next weekday
        newDate = scheduleService.getNextWeekday(currentDate);
        break;
      case CalendarViewType.Week:
        // Navigate forward 7 days (1 calendar week), but start date will be adjusted to weekday
        newDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case CalendarViewType.BiWeek:
        // Navigate forward 14 days (2 calendar weeks)
        newDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case CalendarViewType.Month:
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        break;
      default:
        newDate = currentDate;
    }
    
    onDateChange(newDate);
  };

  const navigateToToday = () => {
    onDateChange(new Date());
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderColor: '#3b82f6',
  };

  const iconButtonStyle: React.CSSProperties = {
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.875rem',
    cursor: 'pointer',
    minWidth: '120px',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      {/* Title and date range */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '200px',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#111827',
          margin: 0,
        }}>
          {title}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.875rem',
          color: '#6b7280',
          fontWeight: '500',
        }}>
          <span>{getDateRangeText()}</span>
          {showTeamControls && (
            <ViewModeIndicator 
              mode={teamViewMode} 
              teamName={currentTeamName}
              isVisible={userRole === 'Manager' || userRole === 'Admin'}
            />
          )}
        </div>
      </div>

      {/* Navigation controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {/* Team controls - Different for Admin vs Manager */}
        {showTeamControls && (
          <>
            {/* Admin users get dropdown for team selection */}
            {userRole === 'Admin' && onTeamSelectionChange && teamSelection && (
              <TeamSelectDropdown
                selectedTeam={teamSelection}
                onTeamChange={onTeamSelectionChange}
                userRole={userRole}
                disabled={isLoading}
              />
            )}

            {/* Manager users get toggle for My Team / All Teams */}
            {userRole === 'Manager' && onTeamViewModeChange && (
              <TeamToggle
                mode={teamViewMode}
                onModeChange={onTeamViewModeChange}
                disabled={isLoading}
              />
            )}
          </>
        )}

        {/* Employee filter (if provided) */}
        {employeeFilter && (
          <select
            style={selectStyle}
            value={employeeFilter.selectedEmployeeId || ''}
            onChange={(e) => {
              const employeeId = e.target.value ? parseInt(e.target.value) : undefined;
              employeeFilter.onEmployeeChange(employeeId);
            }}
          >
            <option value="">All Employees</option>
            {employeeFilter.employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        )}

        {/* View type buttons */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '4px',
        }}>
          {Object.entries(VIEW_TYPE_LABELS).map(([key, label]) => {
            const viewTypeKey = parseInt(key) as CalendarViewType;
            const isActive = viewType === viewTypeKey;
            
            return (
              <button
                key={key}
                style={isActive ? activeButtonStyle : buttonStyle}
                onClick={() => onViewTypeChange(viewTypeKey)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Date navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <button
            style={iconButtonStyle}
            onClick={navigateToPrevious}
            title="Previous"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            &#8249;
          </button>

          <button
            style={{
              ...buttonStyle,
              minWidth: '80px',
            }}
            onClick={navigateToToday}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Today
          </button>

          <button
            style={iconButtonStyle}
            onClick={navigateToNext}
            title="Next"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            &#8250;
          </button>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            style={{
              ...iconButtonStyle,
              backgroundColor: isLoading ? '#f3f4f6' : '#ffffff',
            }}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh"
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
            }}>
              ↻
            </span>
          </button>
        )}
      </div>

      {/* Add CSS keyframes for loading animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CalendarHeader;