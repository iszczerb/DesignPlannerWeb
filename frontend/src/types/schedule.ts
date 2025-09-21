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

export enum LeaveType {
  AnnualLeave = 1,
  SickDay = 2,
  Training = 3
}

export enum TeamType {
  Structural = 1,
  NonStructural = 2,
  BIM = 3,
  RD = 4
}

export enum SkillType {
  BOM = 1,
  BIM = 2,
  REVIT = 3,
  SOLIDWORKS = 4,
  NAVISWORKS = 5,
  MESH = 6,
  MANIFOLD = 7,
  FISHTANK = 8
}

export enum LeaveDuration {
  FullDay = 1,
  HalfDay = 2
}

// Calendar DTOs
export interface CalendarViewDto {
  startDate: string;
  endDate: string;
  viewType: CalendarViewType;
  days: CalendarDayDto[];
  employees: EmployeeScheduleDto[];
  taskTypes?: any[]; // Optional task types for UI components
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
  fullName?: string; // Alias for employeeName
  role: string;
  team: string;
  teamId?: number;
  isActive: boolean;
  dayAssignments: DayAssignmentDto[];
  // New fields for enhanced team member management
  firstName?: string;
  lastName?: string;
  teamType?: TeamType;
  skills?: SkillType[];
  startDate?: string;
  notes?: string;
}

export interface DayAssignmentDto {
  date: string;
  morningSlot?: TimeSlotAssignmentDto;
  afternoonSlot?: TimeSlotAssignmentDto;
  totalAssignments: number;
  hasConflicts: boolean;
  leave?: LeaveSlotDto;
  isHoliday?: boolean;
  holidayName?: string;
}

export interface TimeSlotAssignmentDto {
  slot: Slot;
  tasks: AssignmentTaskDto[];
  availableCapacity: number;
  isOverbooked: boolean;
  leave?: LeaveSlotDto;
}

export interface LeaveSlotDto {
  leaveType: LeaveType;
  duration: LeaveDuration;
  slot?: Slot; // Only for half-day leaves
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate?: string;
}

export interface AssignmentTaskDto {
  assignmentId: number;
  taskId: number;
  taskTitle: string;
  taskName?: string; // Alias for taskTitle for backward compatibility
  taskTypeName: string;
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
  columnStart?: number; // Which column task starts at (0-3), calculated automatically if not set
  slotOrder?: number; // Placement order within the slot (0 = leftmost, 1 = second from left, etc.)
}

// Request DTOs
export interface ScheduleRequestDto {
  startDate: string;
  viewType: CalendarViewType;
  employeeId?: number;
  teamId?: number;
  includeInactive?: boolean;
}

export interface CreateAssignmentDto {
  taskId: number;
  employeeId: number;
  assignedDate: string;
  slot: Slot;
  notes?: string;
  projectId?: number;
  taskTypeId?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  title?: string;
  description?: string;
  hours?: number; // Duration in hours (1-4)
  columnStart?: number; // Starting column position (0-3)
}

export interface UpdateAssignmentDto {
  assignmentId: number;
  taskId?: number;
  employeeId?: number;
  assignedDate?: string;
  slot?: Slot;
  notes?: string;
  hours?: number;
  columnStart?: number; // Starting column position (0-3)
  priority?: TaskPriority;
  dueDate?: string;
}

export interface BulkAssignmentDto {
  assignments: CreateAssignmentDto[];
  validateConflicts?: boolean;
  allowOverbooking?: boolean;
}

export interface BulkUpdateAssignmentDto {
  assignmentIds: number[];
  updates: {
    taskId?: number;
    taskTypeId?: number;
    priority?: TaskPriority;
    taskStatus?: TaskStatus;
    dueDate?: string | null; // null means clear the due date
    notes?: string | null; // null means clear the notes
  };
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

// Team DTOs
export interface TeamDto {
  id: number;
  name: string;
  description?: string;
}

// Team Member Management DTOs
export interface TeamMemberDto {
  employeeId: number;
  employeeName: string;
  firstName: string;
  lastName: string;
  role: string;
  team: string;
  teamType: TeamType;
  teamId: number;
  skills: SkillType[];
  startDate: string;
  isActive: boolean;
  notes?: string;
  managedTeamIds?: number[]; // For managers - teams they manage
}

export interface CreateTeamMemberDto {
  firstName: string;
  lastName: string;
  role: string;
  employeeId: string;
  teamId: number;
  skills: SkillType[];
  startDate: string;
  notes?: string;
}

export interface UpdateTeamMemberDto {
  employeeId: number;
  firstName?: string;
  lastName?: string;
  role?: string;
  teamId?: number;
  skills?: SkillType[];
  startDate?: string;
  isActive?: boolean;
  notes?: string;
  managedTeamIds?: number[]; // For managers - teams they manage
}

export interface TeamMemberListDto {
  members: TeamMemberDto[];
  totalCount: number;
  activeCount: number;
  teamCounts: { [key in TeamType]: number };
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

export interface TeamMemberViewModalProps {
  isOpen: boolean;
  member: TeamMemberDto | null;
  onClose: () => void;
  onEdit?: (member: TeamMemberDto) => void;
  onDelete?: (employeeId: number) => void;
}

export interface TeamMemberEditModalProps {
  isOpen: boolean;
  member: TeamMemberDto | null;
  onClose: () => void;
  onSave: (member: CreateTeamMemberDto | UpdateTeamMemberDto) => void;
  isCreating?: boolean;
}

export interface TeamMemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: number;
  onViewMember?: (member: TeamMemberDto) => void;
  onEditMember?: (member: TeamMemberDto) => void;
  onDeleteMember?: (employeeId: number) => void;
  onCreateMember?: () => void;
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

export type LeaveTypeLabel = {
  [key in LeaveType]: string;
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

export const LEAVE_TYPE_LABELS: LeaveTypeLabel = {
  [LeaveType.AnnualLeave]: 'Annual Leave',
  [LeaveType.SickDay]: 'Sick Day',
  [LeaveType.Training]: 'Training',
};

export const LEAVE_TYPE_COLORS = {
  [LeaveType.AnnualLeave]: '#10b981', // Green
  [LeaveType.SickDay]: '#ef4444',     // Red
  [LeaveType.Training]: '#6b7280',    // Gray
};

export const LEAVE_TYPE_ICONS = {
  [LeaveType.AnnualLeave]: '✈️',
  [LeaveType.SickDay]: '🤒',
  [LeaveType.Training]: '🎓',
};

export type TeamTypeLabel = {
  [key in TeamType]: string;
};

export type SkillTypeLabel = {
  [key in SkillType]: string;
};

export const TEAM_TYPE_LABELS: TeamTypeLabel = {
  [TeamType.Structural]: 'Structural',
  [TeamType.NonStructural]: 'Non-Structural',
  [TeamType.BIM]: 'BIM',
  [TeamType.RD]: 'R&D',
};

export const SKILL_TYPE_LABELS: SkillTypeLabel = {
  [SkillType.BOM]: 'BOM',
  [SkillType.BIM]: 'BIM',
  [SkillType.REVIT]: 'REVIT',
  [SkillType.SOLIDWORKS]: 'SOLIDWORKS',
  [SkillType.NAVISWORKS]: 'NAVISWORKS',
  [SkillType.MESH]: 'MESH',
  [SkillType.MANIFOLD]: 'MANIFOLD',
  [SkillType.FISHTANK]: 'FISHTANK',
};

export const TEAM_TYPE_COLORS = {
  [TeamType.Structural]: '#3b82f6',     // Blue
  [TeamType.NonStructural]: '#10b981',  // Green
  [TeamType.BIM]: '#8b5cf6',            // Purple
  [TeamType.RD]: '#f59e0b',             // Orange
};

export const SKILL_TYPE_COLORS = {
  [SkillType.BOM]: '#6b7280',           // Gray
  [SkillType.BIM]: '#8b5cf6',           // Purple
  [SkillType.REVIT]: '#3b82f6',         // Blue
  [SkillType.SOLIDWORKS]: '#10b981',    // Green
  [SkillType.NAVISWORKS]: '#f59e0b',    // Orange
  [SkillType.MESH]: '#ef4444',          // Red
  [SkillType.MANIFOLD]: '#ec4899',      // Pink
  [SkillType.FISHTANK]: '#06b6d4',      // Cyan
};

export const MAX_TASKS_PER_SLOT = 4;

// Type aliases for backward compatibility and convenience
export type TaskType = number; // For task type ID references
export type Priority = TaskPriority; // Alias for TaskPriority enum
export type EmployeeCalendarDto = EmployeeScheduleDto; // Alias for EmployeeScheduleDto