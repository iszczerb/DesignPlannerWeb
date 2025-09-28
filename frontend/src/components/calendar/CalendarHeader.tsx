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
        // Navigate back 1 business day for day-by-day scrolling
        newDate = scheduleService.getPreviousWeekday(currentDate);
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
        // Navigate forward 1 business day for day-by-day scrolling
        newDate = scheduleService.getNextWeekday(currentDate);
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
    padding: 'var(--dp-space-2p5) var(--dp-space-4)',
    border: '1px solid var(--dp-neutral-200)',
    borderRadius: 'var(--dp-radius-lg)',
    backgroundColor: 'var(--dp-neutral-0)',
    color: 'var(--dp-neutral-700)',
    fontSize: 'var(--dp-text-body-medium)',
    fontWeight: 'var(--dp-font-weight-semibold)',
    fontFamily: 'var(--dp-font-family-primary)',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dp-space-1)',
    letterSpacing: '-0.01em',
    minHeight: '40px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(8px)',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'var(--dp-primary-500)',
    color: 'var(--dp-neutral-0)',
    borderColor: 'var(--dp-primary-500)',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25), 0 1px 2px rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-1px)',
  };

  const iconButtonStyle: React.CSSProperties = {
    padding: 'var(--dp-space-2)',
    border: '1px solid var(--dp-neutral-200)',
    borderRadius: 'var(--dp-radius-lg)',
    backgroundColor: 'var(--dp-neutral-0)',
    color: 'var(--dp-neutral-700)',
    fontSize: 'var(--dp-text-title-small)',
    fontFamily: 'var(--dp-font-family-primary)',
    fontWeight: 'var(--dp-font-weight-semibold)',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    height: '44px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(8px)',
  };

  const selectStyle: React.CSSProperties = {
    padding: 'var(--dp-space-2) var(--dp-space-3)',
    border: '1px solid var(--dp-neutral-300)',
    borderRadius: 'var(--dp-radius-sm)',
    backgroundColor: 'var(--dp-neutral-0)',
    color: 'var(--dp-neutral-700)',
    fontSize: 'var(--dp-text-body-medium)',
    fontFamily: 'var(--dp-font-family-primary)',
    cursor: 'pointer',
    minWidth: '120px',
    transition: 'var(--dp-transition-fast)',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--dp-space-4) var(--dp-space-6)',
      backgroundColor: 'var(--dp-neutral-0)',
      borderBottom: '1px solid var(--dp-neutral-200)',
      boxShadow: 'var(--dp-shadow-sm)',
      flexWrap: 'wrap',
      gap: 'var(--dp-space-3)',
    }}>
      {/* Title and date range */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--dp-space-1)',
        minWidth: '200px',
      }}>
        <h1 style={{
          fontSize: 'var(--dp-text-headline-medium)',
          fontWeight: 'var(--dp-font-weight-bold)',
          fontFamily: 'var(--dp-font-family-primary)',
          color: 'var(--dp-neutral-900)',
          margin: 0,
          letterSpacing: '-0.025em',
          lineHeight: 'var(--dp-line-height-tight)',
        }}>
          {title}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--dp-space-2)',
          fontSize: 'var(--dp-text-body-large)',
          color: 'var(--dp-neutral-600)',
          fontWeight: 'var(--dp-font-weight-semibold)',
          fontFamily: 'var(--dp-font-family-primary)',
          letterSpacing: '-0.01em',
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
        gap: 'var(--dp-space-2)',
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
          gap: 'var(--dp-space-1)',
          backgroundColor: 'var(--dp-neutral-100)',
          borderRadius: 'var(--dp-radius-md)',
          padding: 'var(--dp-space-1)',
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
                    e.currentTarget.style.backgroundColor = 'var(--dp-neutral-50)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--dp-neutral-0)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
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
          gap: 'var(--dp-space-1)',
        }}>
          <button
            style={iconButtonStyle}
            onClick={navigateToPrevious}
            title="Previous"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-50)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-400)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-0)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-200)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
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
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-50)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-400)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-0)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-200)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
          >
            Today
          </button>

          <button
            style={iconButtonStyle}
            onClick={navigateToNext}
            title="Next"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-50)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-400)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dp-neutral-0)';
              e.currentTarget.style.borderColor = 'var(--dp-neutral-200)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
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
              backgroundColor: isLoading ? '#f3f4f6' : 'var(--dp-neutral-0)',
            }}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh"
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--dp-neutral-50)';
                e.currentTarget.style.borderColor = 'var(--dp-neutral-500)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--dp-neutral-0)';
                e.currentTarget.style.borderColor = 'var(--dp-neutral-300)';
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