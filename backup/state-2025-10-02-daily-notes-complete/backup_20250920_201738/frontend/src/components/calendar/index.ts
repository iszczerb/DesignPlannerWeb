// Main calendar components
export { default as CalendarGrid } from './CalendarGrid';
export { default as CalendarHeader } from './CalendarHeader';
export { default as EmployeeRow } from './EmployeeRow';
export { default as TimeSlot } from './TimeSlot';
export { default as ProjectTaskCard } from './ProjectTaskCard';

// View components
export { default as DayView } from './DayView';
export { default as WeeklyView } from './WeeklyView';
export { default as BiweeklyView } from './BiweeklyView';
export { default as MonthlyView } from './MonthlyView';

// Re-export types for convenience
export * from '../../types/schedule';

// Re-export service for convenience
export { default as scheduleService } from '../../services/scheduleService';