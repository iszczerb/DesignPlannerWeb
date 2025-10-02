# Hours-Based Task Scheduling System - Complete Technical Specification

## Executive Summary

This document provides a comprehensive technical specification for migrating the DesignPlannerWeb application from a slot-based scheduling system (AM/PM) to a granular hours-based system. The migration will enable precise task duration management, intelligent auto-placement, drag-and-drop resizing, and advanced capacity management.

## 1. Data Structure Changes

### 1.1 Backend Schema Modifications

#### 1.1.1 Assignment Entity Enhancement
The `Assignment` entity already has the `Hours` field as nullable double. We need to enhance the business logic:

```csharp
// backend/DesignPlanner.Core/Entities/Assignment.cs
public class Assignment : ITimestampEntity
{
    // ... existing properties ...

    // Enhanced Hours field with validation
    [Range(0.5, 8.0, ErrorMessage = "Hours must be between 0.5 and 8.0")]
    public double? Hours { get; set; }

    // New: Starting hour within the slot (0-4 for AM, 4-8 for PM relative to slot start)
    [Range(0, 4, ErrorMessage = "StartHourOffset must be between 0 and 4")]
    public double StartHourOffset { get; set; } = 0;

    // Computed property for absolute start time
    [NotMapped]
    public double AbsoluteStartHour => Slot == Slot.Morning ? StartHourOffset : 4 + StartHourOffset;

    // Computed property for end time
    [NotMapped]
    public double AbsoluteEndHour => AbsoluteStartHour + (Hours ?? GetDefaultHours());

    private double GetDefaultHours()
    {
        return Task?.EstimatedHours ?? 4.0; // Default to 4 hours if not specified
    }
}
```

#### 1.1.2 ProjectTask Entity Enhancement
```csharp
// backend/DesignPlanner.Core/Entities/ProjectTask.cs
public class ProjectTask : ITimestampEntity
{
    // ... existing properties ...

    // Default estimated hours for new assignments
    [Range(0.5, 8.0)]
    public double EstimatedHours { get; set; } = 4.0;

    // Minimum hours this task can be scheduled for
    [Range(0.5, 8.0)]
    public double MinimumHours { get; set; } = 0.5;

    // Maximum hours this task can be scheduled for
    [Range(0.5, 8.0)]
    public double MaximumHours { get; set; } = 8.0;

    // Whether this task can be split across multiple slots
    public bool AllowSplitting { get; set; } = true;
}
```

#### 1.1.3 New Entity: TimeSlot (for granular scheduling)
```csharp
// backend/DesignPlanner.Core/Entities/TimeSlot.cs
public class TimeSlot
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int EmployeeId { get; set; }
    public double StartHour { get; set; } // 0-8 (0=9AM, 8=5PM)
    public double EndHour { get; set; }
    public bool IsAvailable { get; set; } = true;
    public string? Notes { get; set; }

    // Navigation
    public virtual Employee Employee { get; set; } = null!;
}
```

### 1.2 Frontend Type Definitions

#### 1.2.1 Enhanced Schedule Types
```typescript
// frontend/src/types/schedule.ts

// Enhanced slot definition with hour granularity
export interface HourSlot {
  date: string;
  employeeId: number;
  startHour: number; // 0-8 (0=9AM, 8=5PM)
  endHour: number;
  isAvailable: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

// Enhanced task assignment with positioning
export interface AssignmentTaskDto {
  // ... existing properties ...
  hours: number; // Required in new system
  startHourOffset: number; // 0-4 within slot
  endHourOffset: number; // Computed: startHourOffset + hours

  // Grid positioning (computed)
  gridColumn: string; // CSS Grid column
  gridRow: string; // CSS Grid row

  // Visual properties
  width: number; // Percentage of slot width
  height: number; // Based on hours
  top: number; // Percentage from slot top
  left: number; // Percentage from slot left
}

// Hour-based capacity tracking
export interface HourCapacityDto {
  employeeId: number;
  date: string;
  hourlyCapacity: { [hour: string]: number }; // hour -> available capacity
  totalDailyHours: number;
  maxDailyHours: number;
  overbooked: boolean;
}

// Grid cell definition for positioning
export interface GridCell {
  column: number; // 1-based grid column
  row: number; // 1-based grid row
  width: number; // Number of columns to span
  height: number; // Number of rows to span
  startHour: number;
  endHour: number;
}
```

#### 1.2.2 Drag and Drop Enhancement
```typescript
// frontend/src/types/dragDrop.ts
export interface HourDragItem {
  type: 'task';
  task: AssignmentTaskDto;
  originalHours: number;
  originalStartHour: number;
  sourceDate: string;
  sourceEmployeeId: number;

  // Drag state
  currentHours?: number;
  currentStartHour?: number;
  isResizing?: boolean;
  resizeHandle?: 'start' | 'end';
}

export interface DropZone {
  date: string;
  employeeId: number;
  startHour: number;
  endHour: number;
  availableHours: number;
  conflicts: AssignmentTaskDto[];
}
```

## 2. UI/Layout Architecture

### 2.1 CSS Grid System Design

#### 2.1.1 Grid Container Specifications
```css
/* Day column grid layout */
.hour-based-day-column {
  display: grid;
  grid-template-columns: 1fr; /* Single column for stacked slots */
  grid-template-rows: auto 1fr 1fr; /* Header, AM slot, PM slot */
  min-width: 320px;
  border-right: 1px solid #e5e7eb;
}

/* Time slot grid (AM/PM) */
.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr); /* 8 half-hour columns (4 hours) */
  grid-template-rows: repeat(4, 1fr); /* 4 task rows for stacking */
  min-height: 160px;
  position: relative;
  border: 1px solid #e5e7eb;
  gap: 2px;
  padding: 4px;
}

/* Task positioning within grid */
.task-card-positioned {
  position: absolute;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  z-index: 10;

  /* Grid positioning calculated dynamically */
  grid-column: var(--grid-column-start) / var(--grid-column-end);
  grid-row: var(--grid-row-start) / var(--grid-row-end);
}
```

#### 2.1.2 Slot Dimensions and Calculations
```typescript
// Grid configuration constants
export const GRID_CONFIG = {
  HOURS_PER_SLOT: 4, // AM: 9-13, PM: 13-17
  COLUMNS_PER_HOUR: 2, // 30-minute granularity
  TOTAL_COLUMNS: 8, // 4 hours * 2 columns
  MAX_TASK_ROWS: 4, // Maximum stacked tasks
  MIN_TASK_WIDTH: 1, // Minimum task width (30 minutes)
  SLOT_HEIGHT: 160, // Pixels
  TASK_HEIGHT: 32, // Pixels per task
  TASK_MARGIN: 2, // Pixels between tasks
};

// Grid positioning calculations
export const calculateGridPosition = (
  hours: number,
  startHourOffset: number,
  taskIndex: number = 0
): GridCell => {
  const startColumn = Math.floor(startHourOffset * GRID_CONFIG.COLUMNS_PER_HOUR) + 1;
  const columnSpan = Math.max(1, Math.floor(hours * GRID_CONFIG.COLUMNS_PER_HOUR));
  const row = (taskIndex % GRID_CONFIG.MAX_TASK_ROWS) + 1;

  return {
    column: startColumn,
    row: row,
    width: columnSpan,
    height: 1,
    startHour: startHourOffset,
    endHour: startHourOffset + hours
  };
};
```

### 2.2 Visual Layout Examples

#### 2.2.1 Single Task Scenarios
```
AM Slot (9:00-13:00) - 4 hours available
┌─────────────────────────────────────────┐
│ 9:00  9:30  10:00 10:30 11:00 11:30 12:00 12:30│
├─────────────────────────────────────────┤
│ [    2-hour task    ]                   │ Row 1
│                     [ 1h ]             │ Row 2
│ [   3-hour task         ]              │ Row 3
└─────────────────────────────────────────┘
```

#### 2.2.2 Complex Overlap Scenarios
```
PM Slot (13:00-17:00) - 4 hours available
┌─────────────────────────────────────────┐
│13:00 13:30 14:00 14:30 15:00 15:30 16:00 16:30│
├─────────────────────────────────────────┤
│ [  Task A - 1.5h  ]                    │ Row 1
│      [  Task B - 2h     ]              │ Row 2
│                [ Task C - 1h ]         │ Row 1 (reused)
│ [      Task D - 4h (full slot)        ]│ Row 3
└─────────────────────────────────────────┘
```

## 3. Task Sizing Logic

### 3.1 Width Calculation Algorithm
```typescript
// Calculate task width based on hours
export const calculateTaskWidth = (
  hours: number,
  slotWidth: number = GRID_CONFIG.TOTAL_COLUMNS
): number => {
  const columnsNeeded = Math.max(
    GRID_CONFIG.MIN_TASK_WIDTH,
    Math.floor(hours * GRID_CONFIG.COLUMNS_PER_HOUR)
  );
  return (columnsNeeded / slotWidth) * 100; // Percentage
};

// Calculate task height (fixed for now, could be dynamic)
export const calculateTaskHeight = (
  taskCount: number = 1,
  availableHeight: number = GRID_CONFIG.SLOT_HEIGHT
): number => {
  return Math.min(
    GRID_CONFIG.TASK_HEIGHT,
    (availableHeight - (taskCount * GRID_CONFIG.TASK_MARGIN)) / taskCount
  );
};
```

### 3.2 Auto-Placement Algorithm
```typescript
// Find optimal position for a new task
export const findOptimalPosition = (
  newTaskHours: number,
  existingTasks: AssignmentTaskDto[],
  slotStartHour: number = 0,
  slotDuration: number = 4
): { startHour: number; row: number } | null => {

  // Create hour availability map
  const hourMap = new Array(slotDuration * 2).fill(true); // 30-min slots

  // Mark occupied hours
  existingTasks.forEach(task => {
    const startSlot = Math.floor(task.startHourOffset * 2);
    const endSlot = Math.ceil((task.startHourOffset + task.hours) * 2);

    for (let i = startSlot; i < endSlot; i++) {
      hourMap[i] = false;
    }
  });

  // Find first available consecutive block
  const slotsNeeded = Math.ceil(newTaskHours * 2);

  for (let i = 0; i <= hourMap.length - slotsNeeded; i++) {
    let canFit = true;
    for (let j = i; j < i + slotsNeeded; j++) {
      if (!hourMap[j]) {
        canFit = false;
        break;
      }
    }

    if (canFit) {
      return {
        startHour: i / 2, // Convert back to hours
        row: findAvailableRow(existingTasks, i / 2, newTaskHours)
      };
    }
  }

  return null; // No space available
};

// Find available row for task placement
const findAvailableRow = (
  existingTasks: AssignmentTaskDto[],
  startHour: number,
  duration: number
): number => {
  const conflictingTasks = existingTasks.filter(task =>
    task.startHourOffset < startHour + duration &&
    task.startHourOffset + task.hours > startHour
  );

  const usedRows = new Set(conflictingTasks.map(task => task.gridRow || 1));

  for (let row = 1; row <= GRID_CONFIG.MAX_TASK_ROWS; row++) {
    if (!usedRows.has(row)) {
      return row;
    }
  }

  return 1; // Fallback to first row (will cause overlap)
};
```

### 3.3 Collision Detection and Space Optimization
```typescript
// Check for task overlaps
export const detectCollisions = (
  task: AssignmentTaskDto,
  otherTasks: AssignmentTaskDto[]
): AssignmentTaskDto[] => {
  return otherTasks.filter(other => {
    const taskStart = task.startHourOffset;
    const taskEnd = task.startHourOffset + task.hours;
    const otherStart = other.startHourOffset;
    const otherEnd = other.startHourOffset + other.hours;

    return taskStart < otherEnd && taskEnd > otherStart;
  });
};

// Optimize task arrangement to minimize empty space
export const optimizeTaskLayout = (
  tasks: AssignmentTaskDto[]
): AssignmentTaskDto[] => {
  // Sort tasks by start time, then by duration
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.startHourOffset !== b.startHourOffset) {
      return a.startHourOffset - b.startHourOffset;
    }
    return b.hours - a.hours; // Longer tasks first
  });

  // Reassign rows to minimize gaps
  const optimizedTasks: AssignmentTaskDto[] = [];
  const rowTimeline: { [row: number]: number } = {}; // row -> last end time

  sortedTasks.forEach(task => {
    let assignedRow = 1;

    // Find the earliest available row
    for (let row = 1; row <= GRID_CONFIG.MAX_TASK_ROWS; row++) {
      const rowEndTime = rowTimeline[row] || 0;
      if (rowEndTime <= task.startHourOffset) {
        assignedRow = row;
        break;
      }
    }

    // Update row timeline
    rowTimeline[assignedRow] = task.startHourOffset + task.hours;

    optimizedTasks.push({
      ...task,
      gridRow: assignedRow
    });
  });

  return optimizedTasks;
};
```

## 4. Drag & Drop Enhancements

### 4.1 Enhanced Drag Data Structure
```typescript
// Enhanced drag item with hour precision
export interface HourDragItem extends DragItem {
  // Original position
  originalStartHour: number;
  originalHours: number;
  originalRow: number;

  // Current drag state
  currentStartHour?: number;
  currentHours?: number;
  currentRow?: number;

  // Drag mode
  mode: 'move' | 'resize-start' | 'resize-end';

  // Snap settings
  snapToGrid: boolean;
  snapInterval: number; // in hours (e.g., 0.5 for 30-min snapping)
}

// Drop zone with hour-based validation
export interface HourDropZone {
  date: string;
  employeeId: number;
  slot: Slot;
  startHour: number;
  endHour: number;
  availableHours: number;
  isValid: boolean;
  conflicts: AssignmentTaskDto[];
  suggestedStartHour?: number; // Auto-suggested position
}
```

### 4.2 Auto-sizing Logic When Dropping
```typescript
// Auto-adjust task size when dropping between different slots
export const adjustTaskForDropZone = (
  dragItem: HourDragItem,
  dropZone: HourDropZone
): { hours: number; startHour: number } => {
  const originalHours = dragItem.originalHours;
  const availableHours = dropZone.availableHours;

  // Strategy 1: Keep original size if it fits
  if (originalHours <= availableHours) {
    const optimalPosition = findOptimalPosition(
      originalHours,
      dropZone.conflicts,
      dropZone.startHour,
      dropZone.endHour - dropZone.startHour
    );

    if (optimalPosition) {
      return {
        hours: originalHours,
        startHour: optimalPosition.startHour
      };
    }
  }

  // Strategy 2: Shrink to fit available space
  const maxFitHours = Math.floor(availableHours * 2) / 2; // Round to 30-min intervals

  if (maxFitHours >= 0.5) {
    return {
      hours: Math.min(originalHours, maxFitHours),
      startHour: dropZone.startHour
    };
  }

  // Strategy 3: No space available
  throw new Error('No space available in target slot');
};
```

### 4.3 Visual Feedback During Drag
```typescript
// Real-time drop zone highlighting
export const updateDropZoneVisuals = (
  dragItem: HourDragItem,
  potentialDropZones: HourDropZone[]
) => {
  potentialDropZones.forEach(zone => {
    const element = document.querySelector(
      `[data-drop-zone="${zone.date}-${zone.employeeId}-${zone.slot}"]`
    );

    if (element) {
      element.classList.remove('drop-valid', 'drop-invalid', 'drop-partial');

      if (zone.isValid) {
        if (zone.availableHours >= dragItem.originalHours) {
          element.classList.add('drop-valid');
        } else {
          element.classList.add('drop-partial');
        }
      } else {
        element.classList.add('drop-invalid');
      }

      // Show suggested position
      if (zone.suggestedStartHour !== undefined) {
        const indicator = element.querySelector('.drop-indicator');
        if (indicator) {
          const leftPercent = (zone.suggestedStartHour / 4) * 100;
          const widthPercent = (dragItem.originalHours / 4) * 100;

          (indicator as HTMLElement).style.left = `${leftPercent}%`;
          (indicator as HTMLElement).style.width = `${widthPercent}%`;
          (indicator as HTMLElement).style.display = 'block';
        }
      }
    }
  });
};
```

## 5. Resizing System

### 5.1 Resize Handle Implementation
```typescript
// Resize handle component
export const ResizeHandle: React.FC<{
  position: 'start' | 'end';
  onResize: (delta: number) => void;
  minHours: number;
  maxHours: number;
}> = ({ position, onResize, minHours, maxHours }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.clientX);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const hourDelta = (deltaX / GRID_CONFIG.SLOT_WIDTH) * 4; // Convert pixels to hours

    // Apply constraints
    const constrainedDelta = Math.max(
      -maxHours + minHours,
      Math.min(maxHours - minHours, hourDelta)
    );

    onResize(constrainedDelta);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`resize-handle resize-handle-${position}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        [position]: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        backgroundColor: '#3b82f6',
        cursor: 'ew-resize',
        opacity: isDragging ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    />
  );
};
```

### 5.2 Real-time Hour Calculation During Resize
```typescript
// Hook for managing task resize state
export const useTaskResize = (
  task: AssignmentTaskDto,
  onUpdate: (updatedTask: AssignmentTaskDto) => void
) => {
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    handle: 'start' | 'end' | null;
    originalHours: number;
    originalStartHour: number;
    currentHours: number;
    currentStartHour: number;
  }>({
    isResizing: false,
    handle: null,
    originalHours: task.hours,
    originalStartHour: task.startHourOffset,
    currentHours: task.hours,
    currentStartHour: task.startHourOffset,
  });

  const startResize = (handle: 'start' | 'end') => {
    setResizeState(prev => ({
      ...prev,
      isResizing: true,
      handle,
      originalHours: task.hours,
      originalStartHour: task.startHourOffset,
    }));
  };

  const updateResize = (hourDelta: number) => {
    setResizeState(prev => {
      let newHours = prev.originalHours;
      let newStartHour = prev.originalStartHour;

      if (prev.handle === 'start') {
        newStartHour = Math.max(0, prev.originalStartHour + hourDelta);
        newHours = prev.originalHours - hourDelta;
      } else if (prev.handle === 'end') {
        newHours = Math.max(0.5, prev.originalHours + hourDelta);
      }

      // Ensure task stays within slot bounds
      newStartHour = Math.max(0, Math.min(4 - newHours, newStartHour));
      newHours = Math.max(0.5, Math.min(4 - newStartHour, newHours));

      return {
        ...prev,
        currentHours: newHours,
        currentStartHour: newStartHour,
      };
    });
  };

  const finishResize = () => {
    onUpdate({
      ...task,
      hours: resizeState.currentHours,
      startHourOffset: resizeState.currentStartHour,
    });

    setResizeState(prev => ({
      ...prev,
      isResizing: false,
      handle: null,
    }));
  };

  return {
    resizeState,
    startResize,
    updateResize,
    finishResize,
  };
};
```

### 5.3 Grid Snapping Behavior
```typescript
// Snap values to grid intervals
export const snapToGrid = (
  value: number,
  interval: number = 0.5, // 30-minute intervals
  offset: number = 0
): number => {
  const snappedValue = Math.round((value - offset) / interval) * interval + offset;
  return Math.max(0, snappedValue);
};

// Enhanced resize with grid snapping
export const resizeWithSnapping = (
  originalValue: number,
  delta: number,
  snapInterval: number = 0.5,
  minValue: number = 0.5,
  maxValue: number = 4
): number => {
  const newValue = originalValue + delta;
  const snappedValue = snapToGrid(newValue, snapInterval);
  return Math.max(minValue, Math.min(maxValue, snappedValue));
};
```

## 6. Validation System

### 6.1 Hour Availability Calculation
```typescript
// Calculate available hours for a specific slot
export const calculateAvailableHours = (
  employeeId: number,
  date: string,
  slot: Slot,
  existingTasks: AssignmentTaskDto[],
  excludeTaskId?: number
): HourCapacityDto => {
  const relevantTasks = existingTasks.filter(task =>
    task.employeeId === employeeId &&
    task.assignedDate === date &&
    task.slot === slot &&
    task.assignmentId !== excludeTaskId
  );

  // Create hourly availability map (30-minute precision)
  const hourlyCapacity: { [hour: string]: number } = {};
  const slotDuration = 4; // 4 hours per slot
  const totalSlots = slotDuration * 2; // 30-minute slots

  // Initialize all slots as available
  for (let i = 0; i < totalSlots; i++) {
    const hour = (i * 0.5).toFixed(1);
    hourlyCapacity[hour] = 1; // 1 = available, 0 = occupied
  }

  // Mark occupied slots
  relevantTasks.forEach(task => {
    const startSlot = Math.floor(task.startHourOffset * 2);
    const endSlot = Math.ceil((task.startHourOffset + task.hours) * 2);

    for (let i = startSlot; i < endSlot; i++) {
      const hour = (i * 0.5).toFixed(1);
      hourlyCapacity[hour] = 0;
    }
  });

  // Calculate total available hours
  const totalAvailableHours = Object.values(hourlyCapacity)
    .reduce((sum, capacity) => sum + capacity, 0) * 0.5;

  const totalAssignedHours = relevantTasks
    .reduce((sum, task) => sum + task.hours, 0);

  return {
    employeeId,
    date,
    hourlyCapacity,
    totalDailyHours: totalAssignedHours,
    maxDailyHours: slotDuration,
    overbooked: totalAssignedHours > slotDuration
  };
};
```

### 6.2 Constraint Checking Logic
```typescript
// Comprehensive validation for task assignment
export const validateTaskAssignment = (
  task: CreateAssignmentDto & { hours: number; startHourOffset: number },
  existingTasks: AssignmentTaskDto[],
  employee: EmployeeScheduleDto
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic hour validation
  if (task.hours < 0.5 || task.hours > 8) {
    errors.push('Task hours must be between 0.5 and 8 hours');
  }

  // 2. Slot boundary validation
  const slotEnd = task.slot === Slot.Morning ? 4 : 8;
  const slotStart = task.slot === Slot.Morning ? 0 : 4;

  if (task.startHourOffset < 0 || task.startHourOffset >= 4) {
    errors.push('Start hour offset must be between 0 and 4 hours within the slot');
  }

  if (task.startHourOffset + task.hours > 4) {
    errors.push('Task extends beyond slot boundary');
  }

  // 3. Overlap validation
  const conflicts = detectCollisions({
    ...task,
    assignmentId: -1, // Temporary ID for new task
    startHourOffset: task.startHourOffset,
    hours: task.hours
  } as AssignmentTaskDto, existingTasks);

  if (conflicts.length > 0) {
    errors.push(`Task overlaps with ${conflicts.length} existing task(s)`);
  }

  // 4. Daily capacity validation
  const dailyHours = existingTasks
    .filter(t => t.employeeId === task.employeeId && t.assignedDate === task.assignedDate)
    .reduce((sum, t) => sum + t.hours, 0) + task.hours;

  if (dailyHours > 8) {
    warnings.push(`Daily total (${dailyHours}h) exceeds 8 hours`);
  }

  // 5. Employee availability validation
  if (!employee.isActive) {
    errors.push('Cannot assign tasks to inactive employee');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canProceed: errors.length === 0,
    requiresConfirmation: warnings.length > 0
  };
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  requiresConfirmation: boolean;
}
```

### 6.3 Error Handling and User Feedback
```typescript
// User-friendly error messages for common scenarios
export const ERROR_MESSAGES = {
  INSUFFICIENT_SPACE: (required: number, available: number) =>
    `Need ${required} hours but only ${available} hours available`,

  SLOT_OVERFLOW: (hours: number) =>
    `Task duration (${hours}h) exceeds slot capacity (4h)`,

  OVERLAP_DETECTED: (conflicts: number) =>
    `Cannot place task due to ${conflicts} conflict${conflicts > 1 ? 's' : ''}`,

  EMPLOYEE_OVERBOOKED: (total: number) =>
    `Employee would be overbooked (${total}h daily total)`,

  INVALID_HOURS: (hours: number) =>
    `Invalid duration: ${hours}h (must be 0.5-8.0 hours)`,

  PAST_DATE: () =>
    'Cannot assign tasks to past dates',

  WEEKEND_ASSIGNMENT: () =>
    'Tasks can only be assigned to weekdays',

  EMPLOYEE_UNAVAILABLE: (reason: string) =>
    `Employee unavailable: ${reason}`
};

// Toast notification system for validation feedback
export const showValidationFeedback = (
  result: ValidationResult,
  toastService: ToastService
) => {
  if (result.errors.length > 0) {
    result.errors.forEach(error => {
      toastService.error(error);
    });
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      toastService.warning(warning);
    });
  }

  if (result.isValid && result.warnings.length === 0) {
    toastService.success('Task scheduled successfully');
  }
};
```

## 7. Step-by-Step Migration Strategy

### 7.1 Phase 1: Backend Infrastructure (Week 1-2)

#### 7.1.1 Database Migration
```csharp
// Migration: Add hour-based fields to Assignment
public partial class AddHourBasedScheduling : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add new columns to Assignment table
        migrationBuilder.AddColumn<double>(
            name: "StartHourOffset",
            table: "Assignments",
            type: "float",
            nullable: false,
            defaultValue: 0.0);

        // Add estimated hours to ProjectTask
        migrationBuilder.AddColumn<double>(
            name: "EstimatedHours",
            table: "ProjectTasks",
            type: "float",
            nullable: false,
            defaultValue: 4.0);

        migrationBuilder.AddColumn<double>(
            name: "MinimumHours",
            table: "ProjectTasks",
            type: "float",
            nullable: false,
            defaultValue: 0.5);

        migrationBuilder.AddColumn<double>(
            name: "MaximumHours",
            table: "ProjectTasks",
            type: "float",
            nullable: false,
            defaultValue: 8.0);

        migrationBuilder.AddColumn<bool>(
            name: "AllowSplitting",
            table: "ProjectTasks",
            type: "bit",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "StartHourOffset", table: "Assignments");
        migrationBuilder.DropColumn(name: "EstimatedHours", table: "ProjectTasks");
        migrationBuilder.DropColumn(name: "MinimumHours", table: "ProjectTasks");
        migrationBuilder.DropColumn(name: "MaximumHours", table: "ProjectTasks");
        migrationBuilder.DropColumn(name: "AllowSplitting", table: "ProjectTasks");
    }
}
```

#### 7.1.2 Service Layer Updates
```csharp
// Enhanced ScheduleService with hour-based logic
public class ScheduleService : IScheduleService
{
    // ... existing code ...

    public async Task<ValidationResult> ValidateAssignmentAsync(
        CreateAssignmentDto request,
        CancellationToken cancellationToken = default)
    {
        var existingTasks = await GetEmployeeTasksAsync(
            request.EmployeeId,
            request.AssignedDate,
            request.Slot);

        return ValidateTaskPlacement(request, existingTasks);
    }

    public async Task<List<AvailableSlot>> FindAvailableSlotsAsync(
        int employeeId,
        DateTime startDate,
        DateTime endDate,
        double requiredHours)
    {
        var availableSlots = new List<AvailableSlot>();

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                continue;

            // Check AM slot
            var amCapacity = await CalculateSlotCapacityAsync(employeeId, date, Slot.Morning);
            if (amCapacity.AvailableHours >= requiredHours)
            {
                availableSlots.Add(new AvailableSlot
                {
                    Date = date,
                    Slot = Slot.Morning,
                    AvailableHours = amCapacity.AvailableHours,
                    SuggestedStartHour = FindOptimalStartHour(amCapacity, requiredHours)
                });
            }

            // Check PM slot
            var pmCapacity = await CalculateSlotCapacityAsync(employeeId, date, Slot.Afternoon);
            if (pmCapacity.AvailableHours >= requiredHours)
            {
                availableSlots.Add(new AvailableSlot
                {
                    Date = date,
                    Slot = Slot.Afternoon,
                    AvailableHours = pmCapacity.AvailableHours,
                    SuggestedStartHour = FindOptimalStartHour(pmCapacity, requiredHours)
                });
            }
        }

        return availableSlots;
    }

    private async Task<SlotCapacity> CalculateSlotCapacityAsync(
        int employeeId,
        DateTime date,
        Slot slot)
    {
        var existingTasks = await _context.Assignments
            .Where(a => a.EmployeeId == employeeId &&
                       a.AssignedDate.Date == date.Date &&
                       a.Slot == slot &&
                       a.IsActive)
            .Include(a => a.Task)
            .ToListAsync();

        var occupiedHours = existingTasks.Sum(a => a.Hours ?? a.Task.EstimatedHours);

        return new SlotCapacity
        {
            TotalHours = 4,
            OccupiedHours = occupiedHours,
            AvailableHours = 4 - occupiedHours,
            Tasks = existingTasks.Select(a => new TaskPlacement
            {
                StartHour = a.StartHourOffset,
                Hours = a.Hours ?? a.Task.EstimatedHours
            }).ToList()
        };
    }
}
```

### 7.2 Phase 2: Frontend Core Components (Week 3-4)

#### 7.2.1 Enhanced DayColumn Component
```typescript
// Updated DayColumn with hour-based grid
import React, { useMemo } from 'react';
import { GRID_CONFIG, calculateGridPosition, optimizeTaskLayout } from '../utils/gridCalculations';

const HourBasedDayColumn: React.FC<DayColumnProps> = ({
  day,
  employees,
  onTaskClick,
  onTaskDrop,
  // ... other props
}) => {
  // Memoized task layout optimization
  const optimizedLayout = useMemo(() => {
    const allTasks: AssignmentTaskDto[] = [];

    employees.forEach(employee => {
      const dayAssignment = employee.dayAssignments.find(
        assignment => new Date(assignment.date).toDateString() === new Date(day.date).toDateString()
      );

      if (dayAssignment) {
        [dayAssignment.morningSlot, dayAssignment.afternoonSlot]
          .filter(Boolean)
          .forEach(slotData => {
            allTasks.push(...slotData!.tasks);
          });
      }
    });

    return {
      amTasks: optimizeTaskLayout(allTasks.filter(t => t.slot === Slot.Morning)),
      pmTasks: optimizeTaskLayout(allTasks.filter(t => t.slot === Slot.Afternoon))
    };
  }, [day.date, employees]);

  const renderHourBasedSlot = (
    slot: Slot,
    tasks: AssignmentTaskDto[]
  ) => {
    return (
      <div className="time-slot-grid" data-slot={slot}>
        {/* Hour markers */}
        {Array.from({ length: GRID_CONFIG.TOTAL_COLUMNS + 1 }, (_, i) => (
          <div
            key={i}
            className="hour-marker"
            style={{
              position: 'absolute',
              left: `${(i / GRID_CONFIG.TOTAL_COLUMNS) * 100}%`,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: '#e5e7eb',
              zIndex: 1
            }}
          >
            {i % 2 === 0 && (
              <span className="hour-label">
                {slot === Slot.Morning ? 9 + (i / 2) : 13 + (i / 2)}:00
              </span>
            )}
          </div>
        ))}

        {/* Task cards */}
        {tasks.map(task => {
          const gridPos = calculateGridPosition(
            task.hours,
            task.startHourOffset,
            task.gridRow || 1
          );

          return (
            <HourBasedTaskCard
              key={task.assignmentId}
              task={task}
              gridPosition={gridPos}
              onClick={() => onTaskClick?.(task)}
              onDrop={onTaskDrop}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="hour-based-day-column">
      {/* Day header */}
      <div className="day-header">
        <div className="day-name">
          {day.dayName} {day.displayDate}
          {day.isToday && <span className="today-indicator">(Today)</span>}
        </div>
      </div>

      {/* AM Slot */}
      <div className="slot-container slot-am">
        <div className="slot-label">AM (9:00-13:00)</div>
        {renderHourBasedSlot(Slot.Morning, optimizedLayout.amTasks)}
      </div>

      {/* PM Slot */}
      <div className="slot-container slot-pm">
        <div className="slot-label">PM (13:00-17:00)</div>
        {renderHourBasedSlot(Slot.Afternoon, optimizedLayout.pmTasks)}
      </div>
    </div>
  );
};
```

#### 7.2.2 Hour-Based Task Card Component
```typescript
// New component for hour-based task rendering
const HourBasedTaskCard: React.FC<{
  task: AssignmentTaskDto;
  gridPosition: GridCell;
  onClick?: (task: AssignmentTaskDto) => void;
  onDrop?: (dragItem: HourDragItem, task: AssignmentTaskDto) => void;
}> = ({ task, gridPosition, onClick, onDrop }) => {
  const { resizeState, startResize, updateResize, finishResize } = useTaskResize(
    task,
    (updatedTask) => {
      // Handle task update
      onTaskUpdate?.(updatedTask);
    }
  );

  const cardStyle: React.CSSProperties = {
    gridColumn: `${gridPosition.column} / span ${gridPosition.width}`,
    gridRow: `${gridPosition.row} / span ${gridPosition.height}`,
    backgroundColor: task.clientColor || '#f8f9fa',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    minHeight: `${GRID_CONFIG.TASK_HEIGHT}px`,
    // Animation for resize
    transition: resizeState.isResizing ? 'none' : 'all 0.2s ease',
  };

  return (
    <div
      style={cardStyle}
      onClick={() => onClick?.(task)}
      onMouseEnter={() => setShowResizeHandles(true)}
      onMouseLeave={() => setShowResizeHandles(false)}
    >
      {/* Task content */}
      <div className="task-content">
        <div className="task-project">{task.projectName}</div>
        <div className="task-client">{task.clientName}</div>
        <div className="task-duration">{task.hours}h</div>
      </div>

      {/* Resize handles */}
      {showResizeHandles && (
        <>
          <ResizeHandle
            position="start"
            onResize={(delta) => updateResize(delta)}
            minHours={0.5}
            maxHours={4}
          />
          <ResizeHandle
            position="end"
            onResize={(delta) => updateResize(delta)}
            minHours={0.5}
            maxHours={4}
          />
        </>
      )}

      {/* Conflict indicator */}
      {task.hasConflicts && (
        <div className="conflict-indicator">
          ⚠️
        </div>
      )}
    </div>
  );
};
```

### 7.3 Phase 3: Advanced Features (Week 5-6)

#### 7.3.1 Task Creation Modal Enhancement
```typescript
// Enhanced modal with hour input and visual preview
const HourBasedTaskCreationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateAssignmentDto) => void;
  initialDate?: string;
  initialSlot?: Slot;
  initialEmployeeId?: number;
}> = ({ isOpen, onClose, onSave, initialDate, initialSlot, initialEmployeeId }) => {
  const [formData, setFormData] = useState({
    taskId: 0,
    employeeId: initialEmployeeId || 0,
    assignedDate: initialDate || '',
    slot: initialSlot || Slot.Morning,
    hours: 2.0,
    startHourOffset: 0,
    notes: '',
  });

  const [availableCapacity, setAvailableCapacity] = useState<HourCapacityDto | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Real-time validation as user changes form
  useEffect(() => {
    if (formData.employeeId && formData.assignedDate && formData.slot) {
      validateFormData();
    }
  }, [formData]);

  const validateFormData = async () => {
    try {
      const capacity = await scheduleService.getSlotCapacity(
        formData.employeeId,
        formData.assignedDate,
        formData.slot
      );
      setAvailableCapacity(capacity);

      const validation = await scheduleService.validateTaskAssignment({
        ...formData,
        hours: formData.hours,
        startHourOffset: formData.startHourOffset
      });
      setValidationResult(validation);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const renderSlotPreview = () => {
    if (!availableCapacity) return null;

    return (
      <div className="slot-preview">
        <h4>Slot Preview</h4>
        <div className="preview-grid">
          {/* Render existing tasks */}
          {availableCapacity.existingTasks?.map(task => (
            <div
              key={task.assignmentId}
              className="preview-task existing"
              style={{
                left: `${(task.startHourOffset / 4) * 100}%`,
                width: `${(task.hours / 4) * 100}%`,
                backgroundColor: task.clientColor,
              }}
            >
              {task.taskTitle} ({task.hours}h)
            </div>
          ))}

          {/* Render new task preview */}
          <div
            className={`preview-task new ${validationResult?.isValid ? 'valid' : 'invalid'}`}
            style={{
              left: `${(formData.startHourOffset / 4) * 100}%`,
              width: `${(formData.hours / 4) * 100}%`,
              backgroundColor: validationResult?.isValid ? '#10b981' : '#ef4444',
            }}
          >
            New Task ({formData.hours}h)
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>Create New Task Assignment</h2>

        {/* Standard form fields */}
        <FormField label="Task">
          <TaskSelector
            value={formData.taskId}
            onChange={(taskId) => setFormData(prev => ({ ...prev, taskId }))}
          />
        </FormField>

        <FormField label="Employee">
          <EmployeeSelector
            value={formData.employeeId}
            onChange={(employeeId) => setFormData(prev => ({ ...prev, employeeId }))}
          />
        </FormField>

        <FormField label="Date">
          <DatePicker
            value={formData.assignedDate}
            onChange={(date) => setFormData(prev => ({ ...prev, assignedDate: date }))}
          />
        </FormField>

        <FormField label="Time Slot">
          <Select
            value={formData.slot}
            onChange={(slot) => setFormData(prev => ({ ...prev, slot }))}
          >
            <option value={Slot.Morning}>Morning (9:00-13:00)</option>
            <option value={Slot.Afternoon}>Afternoon (13:00-17:00)</option>
          </Select>
        </FormField>

        {/* Hour-based controls */}
        <FormField label="Duration (hours)">
          <HourInput
            value={formData.hours}
            onChange={(hours) => setFormData(prev => ({ ...prev, hours }))}
            min={0.5}
            max={4}
            step={0.5}
          />
        </FormField>

        <FormField label="Start Time Offset (hours from slot start)">
          <HourInput
            value={formData.startHourOffset}
            onChange={(startHourOffset) => setFormData(prev => ({ ...prev, startHourOffset }))}
            min={0}
            max={4 - formData.hours}
            step={0.5}
          />
        </FormField>

        {/* Visual preview */}
        {renderSlotPreview()}

        {/* Validation feedback */}
        {validationResult && (
          <ValidationFeedback result={validationResult} />
        )}

        {/* Action buttons */}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            disabled={!validationResult?.canProceed}
            className={validationResult?.requiresConfirmation ? 'warning' : 'primary'}
          >
            {validationResult?.requiresConfirmation ? 'Create Anyway' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

### 7.4 Phase 4: Testing and Optimization (Week 7-8)

#### 7.4.1 Unit Tests for Grid Calculations
```typescript
// Test suite for grid calculation utilities
describe('Grid Calculations', () => {
  describe('calculateGridPosition', () => {
    it('should calculate correct position for 2-hour task at start', () => {
      const position = calculateGridPosition(2, 0, 1);
      expect(position).toEqual({
        column: 1,
        row: 1,
        width: 4, // 2 hours * 2 columns per hour
        height: 1,
        startHour: 0,
        endHour: 2
      });
    });

    it('should handle 30-minute task correctly', () => {
      const position = calculateGridPosition(0.5, 1.5, 2);
      expect(position).toEqual({
        column: 4, // 1.5 hours * 2 + 1
        row: 2,
        width: 1, // 0.5 hours * 2
        height: 1,
        startHour: 1.5,
        endHour: 2
      });
    });
  });

  describe('findOptimalPosition', () => {
    it('should find first available slot', () => {
      const existingTasks = [
        { startHourOffset: 0, hours: 1 } as AssignmentTaskDto,
        { startHourOffset: 2, hours: 1 } as AssignmentTaskDto
      ];

      const position = findOptimalPosition(1, existingTasks);
      expect(position).toEqual({
        startHour: 1,
        row: 1
      });
    });

    it('should return null when no space available', () => {
      const existingTasks = [
        { startHourOffset: 0, hours: 4 } as AssignmentTaskDto
      ];

      const position = findOptimalPosition(1, existingTasks);
      expect(position).toBeNull();
    });
  });

  describe('optimizeTaskLayout', () => {
    it('should minimize row usage', () => {
      const tasks = [
        { startHourOffset: 0, hours: 1, assignmentId: 1 },
        { startHourOffset: 1.5, hours: 1, assignmentId: 2 },
        { startHourOffset: 3, hours: 1, assignmentId: 3 }
      ] as AssignmentTaskDto[];

      const optimized = optimizeTaskLayout(tasks);

      // All tasks should fit in row 1 since they don't overlap
      optimized.forEach(task => {
        expect(task.gridRow).toBe(1);
      });
    });
  });
});
```

#### 7.4.2 Integration Tests
```typescript
// Integration tests for hour-based scheduling
describe('Hour-Based Scheduling Integration', () => {
  let scheduleService: ScheduleService;
  let testEmployee: Employee;
  let testTask: ProjectTask;

  beforeEach(async () => {
    // Setup test data
    scheduleService = new ScheduleService(mockContext, mockLogger);
    testEmployee = await createTestEmployee();
    testTask = await createTestTask({ estimatedHours: 2 });
  });

  it('should create assignment with custom hours', async () => {
    const request: CreateAssignmentDto = {
      taskId: testTask.id,
      employeeId: testEmployee.id,
      assignedDate: new Date('2024-01-15'),
      slot: Slot.Morning,
      hours: 3, // Custom hours different from task default
      startHourOffset: 0.5
    };

    const result = await scheduleService.createAssignmentAsync(request);

    expect(result.hours).toBe(3);
    expect(result.startHourOffset).toBe(0.5);
  });

  it('should prevent overlapping assignments', async () => {
    // Create first assignment
    await scheduleService.createAssignmentAsync({
      taskId: testTask.id,
      employeeId: testEmployee.id,
      assignedDate: new Date('2024-01-15'),
      slot: Slot.Morning,
      hours: 2,
      startHourOffset: 1
    });

    // Try to create overlapping assignment
    const overlappingRequest = {
      taskId: testTask.id,
      employeeId: testEmployee.id,
      assignedDate: new Date('2024-01-15'),
      slot: Slot.Morning,
      hours: 2,
      startHourOffset: 1.5 // Overlaps with first assignment
    };

    await expect(
      scheduleService.createAssignmentAsync(overlappingRequest)
    ).rejects.toThrow('Task overlaps with existing assignment');
  });

  it('should calculate available capacity correctly', async () => {
    // Create some assignments
    await scheduleService.createAssignmentAsync({
      taskId: testTask.id,
      employeeId: testEmployee.id,
      assignedDate: new Date('2024-01-15'),
      slot: Slot.Morning,
      hours: 1.5,
      startHourOffset: 0
    });

    const capacity = await scheduleService.calculateSlotCapacityAsync(
      testEmployee.id,
      new Date('2024-01-15'),
      Slot.Morning
    );

    expect(capacity.availableHours).toBe(2.5); // 4 - 1.5
    expect(capacity.occupiedHours).toBe(1.5);
  });
});
```

## 8. Component-Level Changes

### 8.1 Modified CalendarGrid Component
```typescript
// Enhanced CalendarGrid with hour-based rendering
const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarData,
  viewType,
  isLoading,
  onTaskClick,
  onSlotClick,
  onRefresh
}) => {
  const [dragState, setDragState] = useState<HourDragItem | null>(null);
  const [dropZones, setDropZones] = useState<HourDropZone[]>([]);

  // Enhanced drag handlers
  const handleTaskDragStart = (task: AssignmentTaskDto) => {
    const dragItem: HourDragItem = {
      type: 'task',
      task,
      originalHours: task.hours,
      originalStartHour: task.startHourOffset,
      sourceDate: task.assignedDate,
      sourceEmployeeId: task.employeeId,
      mode: 'move',
      snapToGrid: true,
      snapInterval: 0.5
    };

    setDragState(dragItem);

    // Calculate potential drop zones
    const zones = calculateDropZones(dragItem, calendarData);
    setDropZones(zones);
  };

  const handleTaskDrop = async (
    dragItem: HourDragItem,
    targetDate: string,
    targetSlot: Slot,
    targetEmployeeId: number
  ) => {
    try {
      const dropZone = dropZones.find(zone =>
        zone.date === targetDate &&
        zone.employeeId === targetEmployeeId &&
        zone.slot === targetSlot
      );

      if (!dropZone?.isValid) {
        throw new Error('Invalid drop target');
      }

      const adjustedTask = adjustTaskForDropZone(dragItem, dropZone);

      await scheduleService.updateAssignment({
        assignmentId: dragItem.task.assignmentId,
        employeeId: targetEmployeeId,
        assignedDate: targetDate,
        slot: targetSlot,
        hours: adjustedTask.hours,
        startHourOffset: adjustedTask.startHour
      });

      onRefresh?.();

    } catch (error) {
      console.error('Drop failed:', error);
      // Show error toast
    } finally {
      setDragState(null);
      setDropZones([]);
    }
  };

  return (
    <div className="calendar-grid hour-based">
      {isLoading && <LoadingSpinner />}

      <div className="calendar-header">
        <CalendarHeader
          viewType={viewType}
          currentDate={new Date(calendarData.startDate)}
          onDateChange={handleDateChange}
          onViewTypeChange={handleViewTypeChange}
        />
      </div>

      <div className="calendar-content">
        <div className="employee-sidebar">
          {calendarData.employees.map(employee => (
            <EmployeeHeader key={employee.employeeId} employee={employee} />
          ))}
        </div>

        <div className="days-container">
          {calendarData.days.map(day => (
            <HourBasedDayColumn
              key={day.date}
              day={day}
              employees={calendarData.employees}
              dragState={dragState}
              dropZones={dropZones.filter(zone => zone.date === day.date)}
              onTaskClick={onTaskClick}
              onTaskDragStart={handleTaskDragStart}
              onTaskDrop={handleTaskDrop}
              onSlotClick={onSlotClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 8.2 New Utility Components

#### 8.2.1 HourInput Component
```typescript
// Specialized input for hour values with validation
const HourInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}> = ({ value, onChange, min = 0.5, max = 8, step = 0.5, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isValid, setIsValid] = useState(true);

  const validateAndUpdate = (newValue: string) => {
    const numValue = parseFloat(newValue);

    if (isNaN(numValue)) {
      setIsValid(false);
      return;
    }

    if (numValue < min || numValue > max) {
      setIsValid(false);
      return;
    }

    if ((numValue * (1 / step)) % 1 !== 0) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    onChange(numValue);
  };

  return (
    <div className="hour-input">
      <input
        type="number"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          validateAndUpdate(e.target.value);
        }}
        onBlur={() => {
          if (!isValid) {
            setInputValue(value.toString());
            setIsValid(true);
          }
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`form-input ${!isValid ? 'error' : ''}`}
      />
      <span className="unit">hours</span>

      {!isValid && (
        <div className="error-message">
          Must be between {min} and {max} hours in {step}h increments
        </div>
      )}

      {/* Quick selection buttons */}
      <div className="quick-select">
        {[0.5, 1, 2, 4, 8].filter(h => h >= min && h <= max).map(hours => (
          <button
            key={hours}
            type="button"
            onClick={() => {
              setInputValue(hours.toString());
              onChange(hours);
              setIsValid(true);
            }}
            className={value === hours ? 'active' : ''}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
};
```

#### 8.2.2 ValidationFeedback Component
```typescript
// Component for displaying validation results
const ValidationFeedback: React.FC<{
  result: ValidationResult;
  showDetails?: boolean;
}> = ({ result, showDetails = true }) => {
  if (result.isValid && result.warnings.length === 0) {
    return (
      <div className="validation-feedback success">
        ✅ Task assignment is valid
      </div>
    );
  }

  return (
    <div className="validation-feedback">
      {result.errors.length > 0 && (
        <div className="errors">
          <h4>❌ Errors (must be fixed):</h4>
          <ul>
            {result.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="warnings">
          <h4>⚠️ Warnings (optional):</h4>
          <ul>
            {result.warnings.map((warning, index) => (
              <li key={index} className="warning-item">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className="validation-summary">
          <div className={`status ${result.canProceed ? 'can-proceed' : 'blocked'}`}>
            {result.canProceed ? 'Can proceed' : 'Blocked'}
            {result.requiresConfirmation && ' (requires confirmation)'}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 8.3 CSS Styling Updates

#### 8.3.1 Hour-Based Grid Styles
```css
/* Hour-based calendar grid styles */
.hour-based-day-column {
  display: flex;
  flex-direction: column;
  min-width: 320px;
  border-right: 1px solid #e5e7eb;
}

.slot-container {
  position: relative;
  border-bottom: 1px solid #e5e7eb;
}

.slot-label {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(4, 40px);
  min-height: 160px;
  position: relative;
  padding: 24px 8px 8px 8px;
  gap: 2px;
}

.hour-marker {
  position: absolute;
  top: 24px;
  bottom: 8px;
  width: 1px;
  background-color: #e5e7eb;
  z-index: 1;
}

.hour-label {
  position: absolute;
  top: -20px;
  left: -15px;
  font-size: 0.65rem;
  color: #6b7280;
  background: white;
  padding: 0 2px;
}

/* Task card positioning */
.task-card-positioned {
  position: relative;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.task-card-positioned:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.task-card-positioned.dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  z-index: 1000;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 15;
}

.resize-handle:hover {
  opacity: 1;
}

.resize-handle-start {
  left: -2px;
  border-radius: 4px 0 0 4px;
}

.resize-handle-end {
  right: -2px;
  border-radius: 0 4px 4px 0;
}

.task-card-positioned:hover .resize-handle {
  opacity: 0.7;
}

/* Drop zone feedback */
.drop-zone {
  position: absolute;
  border: 2px dashed transparent;
  border-radius: 4px;
  pointer-events: none;
  z-index: 5;
}

.drop-zone.drop-valid {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.drop-zone.drop-invalid {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.drop-zone.drop-partial {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.drop-indicator {
  position: absolute;
  top: 2px;
  height: calc(100% - 4px);
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid #3b82f6;
  border-radius: 2px;
  display: none;
  z-index: 8;
}

/* Conflict indicators */
.conflict-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  z-index: 12;
}

/* Hour input styling */
.hour-input {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hour-input input {
  width: 80px;
  text-align: center;
}

.hour-input .unit {
  color: #6b7280;
  font-size: 0.875rem;
}

.hour-input .quick-select {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.hour-input .quick-select button {
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.hour-input .quick-select button:hover {
  background: #f3f4f6;
}

.hour-input .quick-select button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Validation feedback styling */
.validation-feedback {
  margin: 12px 0;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.validation-feedback.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.validation-feedback .errors {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.validation-feedback .warnings {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fed7aa;
  border-radius: 4px;
  padding: 8px;
}

.validation-feedback ul {
  margin: 4px 0;
  padding-left: 16px;
}

.validation-feedback li {
  margin: 2px 0;
}

.validation-summary {
  margin-top: 8px;
  font-weight: 600;
}

.validation-summary .status.can-proceed {
  color: #065f46;
}

.validation-summary .status.blocked {
  color: #991b1b;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hour-based-day-column {
    min-width: 280px;
  }

  .time-slot-grid {
    grid-template-columns: repeat(4, 1fr);
    min-height: 120px;
  }

  .task-card-positioned {
    font-size: 0.65rem;
    padding: 2px 4px;
  }

  .hour-input .quick-select {
    flex-wrap: wrap;
  }
}
```

## 9. Testing Strategy and Rollback Procedures

### 9.1 Testing Checkpoints

#### 9.1.1 Backend Testing Checklist
- [ ] Database migration runs successfully
- [ ] Hour-based assignment creation works
- [ ] Validation prevents overlapping tasks
- [ ] Capacity calculation is accurate
- [ ] API endpoints return correct data
- [ ] Performance benchmarks met (< 500ms response times)

#### 9.1.2 Frontend Testing Checklist
- [ ] Grid positioning calculations work correctly
- [ ] Tasks render in correct positions
- [ ] Drag and drop preserves task data
- [ ] Resize handles function properly
- [ ] Validation feedback displays correctly
- [ ] Mobile responsiveness maintained

#### 9.1.3 Integration Testing Checklist
- [ ] Full create/edit/delete workflow
- [ ] Cross-browser compatibility
- [ ] Performance under load (100+ tasks)
- [ ] Data consistency after operations
- [ ] Error handling and recovery

### 9.2 Rollback Procedures

#### 9.2.1 Emergency Rollback Plan
```bash
# Step 1: Database rollback
cd backend/DesignPlanner.Api
dotnet ef database update PreviousMigration

# Step 2: Code rollback
git revert <commit-hash> --no-edit

# Step 3: Frontend rollback
cd frontend
npm run build:legacy  # Build without hour features

# Step 4: Restart services
docker-compose restart
```

#### 9.2.2 Partial Rollback (Feature Flag)
```typescript
// Feature flag implementation for gradual rollout
const FEATURES = {
  HOUR_BASED_SCHEDULING: process.env.REACT_APP_ENABLE_HOURS === 'true',
  HOUR_BASED_RESIZE: process.env.REACT_APP_ENABLE_RESIZE === 'true',
  HOUR_BASED_VALIDATION: process.env.REACT_APP_ENABLE_VALIDATION === 'true',
};

// Conditional rendering based on feature flags
const Calendar: React.FC = () => {
  if (FEATURES.HOUR_BASED_SCHEDULING) {
    return <HourBasedCalendar />;
  }
  return <LegacySlotBasedCalendar />;
};
```

## 10. Performance Considerations and Optimizations

### 10.1 Frontend Performance Optimizations
```typescript
// Memoized grid calculations to prevent unnecessary re-renders
const MemoizedTaskCard = React.memo(HourBasedTaskCard, (prevProps, nextProps) => {
  return (
    prevProps.task.assignmentId === nextProps.task.assignmentId &&
    prevProps.task.hours === nextProps.task.hours &&
    prevProps.task.startHourOffset === nextProps.task.startHourOffset &&
    prevProps.gridPosition.column === nextProps.gridPosition.column &&
    prevProps.gridPosition.row === nextProps.gridPosition.row
  );
});

// Virtualized rendering for large numbers of tasks
const VirtualizedDayColumn: React.FC<DayColumnProps> = ({ tasks, ...props }) => {
  const visibleTasks = useMemo(() => {
    // Only render tasks within viewport
    return tasks.filter(task => isTaskVisible(task, viewportBounds));
  }, [tasks, viewportBounds]);

  return (
    <FixedSizeList
      height={600}
      itemCount={visibleTasks.length}
      itemSize={40}
      itemData={visibleTasks}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <MemoizedTaskCard task={data[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 10.2 Backend Performance Optimizations
```csharp
// Optimized database queries with proper indexing
public class ScheduleService
{
    public async Task<List<AssignmentTaskDto>> GetSlotTasksOptimizedAsync(
        int employeeId,
        DateTime date,
        Slot slot)
    {
        // Single query with includes to minimize round trips
        return await _context.Assignments
            .Where(a => a.EmployeeId == employeeId &&
                       a.AssignedDate.Date == date.Date &&
                       a.Slot == slot &&
                       a.IsActive)
            .Include(a => a.Task)
                .ThenInclude(t => t.Project)
                    .ThenInclude(p => p.Client)
            .Select(a => new AssignmentTaskDto
            {
                AssignmentId = a.Id,
                TaskId = a.TaskId,
                Hours = a.Hours ?? a.Task.EstimatedHours,
                StartHourOffset = a.StartHourOffset,
                // ... other mapped properties
            })
            .AsNoTracking() // Read-only for better performance
            .ToListAsync();
    }
}

// Database indexes for optimal query performance
[Index(nameof(EmployeeId), nameof(AssignedDate), nameof(Slot))]
[Index(nameof(AssignedDate), nameof(IsActive))]
public class Assignment : ITimestampEntity
{
    // ... entity definition
}
```

## Conclusion

This comprehensive technical specification provides a complete roadmap for implementing hours-based task scheduling in the DesignPlannerWeb application. The migration strategy is designed to be incremental, testable, and reversible, ensuring minimal disruption to existing functionality while adding powerful new capabilities.

Key benefits of this implementation:
- **Precise scheduling**: Tasks can be scheduled with 30-minute granularity
- **Visual clarity**: Clear grid-based layout shows exactly when tasks are scheduled
- **Intuitive interaction**: Drag-and-drop with auto-positioning and resizing
- **Smart validation**: Real-time conflict detection and capacity management
- **Scalable architecture**: Designed to handle complex scheduling scenarios

The phased approach allows for continuous testing and validation, ensuring each component works correctly before moving to the next phase. Feature flags enable gradual rollout and easy rollback if issues arise.