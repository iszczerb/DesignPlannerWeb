// Enums - Updated for weekdays-only (Monday-Friday)
export enum CalendarViewType {
  Day = 1,        // 1 weekday
  Week = 5,       // 5 weekdays (Mon-Fri)
  BiWeek = 10,    // 10 weekdays (2 work weeks)
  Month = 23      // ~20-23 weekdays (average weekdays in a month)
}

export enum Slot {
  Morning = 1,
  Afternoon = 2
}

export enum TaskStatus {
  NotStarted = 1,
  InProgress = 2,
  Done = 3,
  OnHold = 4,
  Blocked = 5
}

export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

// Calendar DTOs
export interface CalendarViewDto {
  startDate: string;
  endDate: string;
  viewType: CalendarViewType;
  days: CalendarDayDto[];
  employees: EmployeeScheduleDto[];
}

export interface CalendarDayDto {
  date: string;
  isToday: boolean;
  displayDate: string;
  dayName: string;
  // Note: isWeekend property removed as we only support weekdays (Monday-Friday)
}

export interface EmployeeScheduleDto {
  employeeId: number;
  employeeName: string;
  role: string;
  team: string;
  isActive: boolean;
  dayAssignments: DayAssignmentDto[];
}

export interface DayAssignmentDto {
  date: string;
  morningSlot?: TimeSlotAssignmentDto;
  afternoonSlot?: TimeSlotAssignmentDto;
  totalAssignments: number;
  hasConflicts: boolean;
}

export interface TimeSlotAssignmentDto {
  slot: Slot;
  tasks: AssignmentTaskDto[];
  availableCapacity: number;
  isOverbooked: boolean;
}

export interface AssignmentTaskDto {
  assignmentId: number;
  taskId: number;
  taskTitle: string;
  taskTypeName: string;
  projectCode: string;
  projectName: string;
  clientCode: string;
  clientName: string;
  clientColor: string;
  assignedDate: string;
  slot: Slot;
  taskStatus: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  notes?: string;
  isActive: boolean;
  employeeId: number;
  employeeName: string;
  hours?: number; // Custom hours for this task (if not set, will be calculated automatically)
}

// Request DTOs
export interface ScheduleRequestDto {
  startDate: string;
  viewType: CalendarViewType;
  employeeId?: number;
  includeInactive?: boolean;
}

export interface CreateAssignmentDto {
  taskId: number;
  employeeId: number;
  assignedDate: string;
  slot: Slot;
  notes?: string;
}

export interface UpdateAssignmentDto {
  assignmentId: number;
  taskId?: number;
  employeeId?: number;
  assignedDate?: string;
  slot?: Slot;
  notes?: string;
  hours?: number;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface BulkAssignmentDto {
  assignments: CreateAssignmentDto[];
  validateConflicts?: boolean;
  allowOverbooking?: boolean;
}

export interface CapacityCheckDto {
  employeeId: number;
  date: string;
  slot: Slot;
}

export interface CapacityResponseDto {
  employeeId: number;
  date: string;
  slot: Slot;
  currentAssignments: number;
  maxCapacity: number;
  isAvailable: boolean;
  isOverbooked: boolean;
  existingTasks: AssignmentTaskDto[];
}

export interface DateRangeDto {
  startDate: string;
  endDate: string;
  employeeId?: number;
}

// UI-specific interfaces
export interface CalendarViewProps {
  viewType: CalendarViewType;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
}

export interface TaskCardProps {
  task: AssignmentTaskDto;
  size?: 'small' | 'medium' | 'large';
  onClick?: (task: AssignmentTaskDto) => void;
  onEdit?: (task: AssignmentTaskDto) => void;
  onDelete?: (assignmentId: number) => void;
}

export interface TimeSlotProps {
  slot: Slot;
  slotData?: TimeSlotAssignmentDto;
  date: Date;
  employeeId: number;
  isReadOnly?: boolean;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
}

export interface EmployeeRowProps {
  employee: EmployeeScheduleDto;
  days: CalendarDayDto[];
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  isReadOnly?: boolean;
}

export interface CalendarGridProps {
  calendarData: CalendarViewDto;
  viewType: CalendarViewType;
  isLoading?: boolean;
  onTaskClick?: (task: AssignmentTaskDto) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onRefresh?: () => void;
}

// Utility types
export type ViewTypeLabel = {
  [key in CalendarViewType]: string;
};

export type SlotLabel = {
  [key in Slot]: string;
};

export type StatusLabel = {
  [key in TaskStatus]: string;
};

export type PriorityLabel = {
  [key in TaskPriority]: string;
};

// Constants
export const VIEW_TYPE_LABELS: ViewTypeLabel = {
  [CalendarViewType.Day]: 'Day',
  [CalendarViewType.Week]: 'Work Week',
  [CalendarViewType.BiWeek]: '2 Work Weeks',
  [CalendarViewType.Month]: 'Month',
};

export const SLOT_LABELS: SlotLabel = {
  [Slot.Morning]: 'AM',
  [Slot.Afternoon]: 'PM',
};

export const STATUS_LABELS: StatusLabel = {
  [TaskStatus.NotStarted]: 'Not Started',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Done]: 'Done',
  [TaskStatus.OnHold]: 'On Hold',
  [TaskStatus.Blocked]: 'Blocked',
};

export const PRIORITY_LABELS: PriorityLabel = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.High]: 'High',
  [TaskPriority.Critical]: 'Critical',
};

export const MAX_TASKS_PER_SLOT = 4;