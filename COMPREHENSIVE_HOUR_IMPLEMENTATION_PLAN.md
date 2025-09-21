# Comprehensive Hour-Based Column Implementation Plan

## 🚨 Critical Analysis - Current Dependencies

Based on code analysis, the current system has these CRITICAL dependencies we must preserve:

### Current Layout Logic:
```typescript
// Width calculation (LINE 1070-1073)
width: tasksToShow.length === 1 ? 'calc(100% - 4px)' :
       tasksToShow.length === 2 ? 'calc(50% - 2px)' :
       tasksToShow.length === 3 ? 'calc(33.33% - 2px)' :
       'calc(25% - 2px)'

// Font size adjustment (LINE 1108)
fontSize: tasksToShow.length === 4 ? '0.5rem' : '0.6rem'
```

### Capacity Validation:
```typescript
// Context menu validation
enabled: !hasTasks || (slotData?.tasks?.length || 0) < 4

// Drag & drop validation
onDragOver: slotData.tasks.length < 4
onDrop: slotData.tasks.length < 4

// More tasks indicator
hasMoreTasks = slotData.tasks.length > 4
```

## 📋 **DETAILED IMPLEMENTATION PLAN**

### **PHASE 1: Data Structure (30 minutes)**

#### 1.1 Add Hour Fields to Types (5 minutes)
```typescript
// frontend/src/types/schedule.ts
export interface AssignmentTaskDto {
  // ... existing fields ...

  // NEW FIELDS
  hours?: number; // 1, 2, 3, or 4 hours (default to current auto-calc)
  columnStart?: number; // 0, 1, 2, or 3 (which column it starts at)

  // COMPUTED FIELDS (for backward compatibility)
  get computedHours(): number {
    return this.hours ?? this.getAutoCalculatedHours();
  }

  get computedColumnStart(): number {
    return this.columnStart ?? this.getAutoCalculatedPosition();
  }
}
```

#### 1.2 Backward Compatibility Helpers (10 minutes)
```typescript
// utils/taskLayoutHelpers.ts
export const getAutoCalculatedHours = (taskIndex: number, totalTasks: number): number => {
  // Maintain current behavior if no hours specified
  return Math.floor(4 / totalTasks);
};

export const getAutoCalculatedPosition = (taskIndex: number, totalTasks: number): number => {
  // Maintain current behavior if no position specified
  const width = Math.floor(4 / totalTasks);
  return taskIndex * width;
};

export const migrateTasksToColumns = (tasks: AssignmentTaskDto[]): AssignmentTaskDto[] => {
  // Convert existing tasks to use column system
  return tasks.map((task, index) => ({
    ...task,
    hours: task.hours ?? getAutoCalculatedHours(index, tasks.length),
    columnStart: task.columnStart ?? getAutoCalculatedPosition(index, tasks.length)
  }));
};
```

#### 1.3 Validation Functions (15 minutes)
```typescript
// utils/slotValidation.ts
export interface SlotCapacity {
  totalHours: number; // Always 4
  usedHours: number;
  availableHours: number;
  columnAvailability: boolean[]; // [col0, col1, col2, col3]
  canFitTask: (hours: number) => boolean;
  findBestPosition: (hours: number) => number | null;
}

export const calculateSlotCapacity = (tasks: AssignmentTaskDto[]): SlotCapacity => {
  const columns = [false, false, false, false]; // Available columns
  let usedHours = 0;

  tasks.forEach(task => {
    const hours = task.computedHours;
    const start = task.computedColumnStart;
    usedHours += hours;

    // Mark columns as occupied
    for (let i = start; i < start + hours && i < 4; i++) {
      columns[i] = true;
    }
  });

  return {
    totalHours: 4,
    usedHours,
    availableHours: 4 - usedHours,
    columnAvailability: columns,
    canFitTask: (hours: number) => findBestPosition(hours, columns) !== null,
    findBestPosition: (hours: number) => findBestPosition(hours, columns)
  };
};

const findBestPosition = (hours: number, columns: boolean[]): number | null => {
  for (let start = 0; start <= 4 - hours; start++) {
    let canFit = true;
    for (let i = start; i < start + hours; i++) {
      if (columns[i]) {
        canFit = false;
        break;
      }
    }
    if (canFit) return start;
  }
  return null;
};
```

### **PHASE 2: Update Core Rendering (45 minutes)**

#### 2.1 Modify Task Width Calculation (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - REPLACE existing width calculation

// OLD CODE (REMOVE):
width: tasksToShow.length === 1 ? 'calc(100% - 4px)' :
       tasksToShow.length === 2 ? 'calc(50% - 2px)' :
       tasksToShow.length === 3 ? 'calc(33.33% - 2px)' :
       'calc(25% - 2px)',

// NEW CODE:
const getTaskWidth = (task: AssignmentTaskDto): string => {
  const hours = task.computedHours;
  return `calc(${(hours / 4) * 100}% - 2px)`;
};

const getTaskPosition = (task: AssignmentTaskDto): string => {
  const columnStart = task.computedColumnStart;
  return `${(columnStart / 4) * 100}%`;
};

// In the task rendering:
style={{
  // ... existing styles ...
  width: getTaskWidth(task),
  left: getTaskPosition(task),
  position: 'absolute', // CHANGE from flex to absolute positioning
  top: 0,
  height: '62px',
}}
```

#### 2.2 Update Slot Container (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Update slot container

// ADD: Hover state for columns
const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

// UPDATE: Slot container style
const slotContainerStyle = {
  position: 'relative', // Ensure relative positioning for absolute tasks
  display: 'block', // Change from flex to block
  width: '100%',
  height: '65px',
  // ... other existing styles
};

// ADD: Column hover zones
const renderColumnHoverZones = (employee: any, day: any, isAM: boolean) => (
  <>
    {[0, 1, 2, 3].map(col => (
      <div
        key={col}
        className="column-hover-zone"
        style={{
          position: 'absolute',
          left: `${col * 25}%`,
          width: '25%',
          height: '100%',
          top: 0,
          zIndex: 1,
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setHoveredColumn(col)}
        onMouseLeave={() => setHoveredColumn(null)}
        onClick={() => handleColumnClick(employee, day, isAM, col)}
      />
    ))}

    {/* Column indicator on hover */}
    {hoveredColumn !== null && (
      <div
        className="column-indicator"
        style={{
          position: 'absolute',
          left: `${hoveredColumn * 25}%`,
          width: '25%',
          height: '100%',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px dashed #3b82f6',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
    )}
  </>
);
```

#### 2.3 Update Task Rendering Loop (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Update task mapping

// BEFORE rendering tasks, migrate them to column system
const migratedTasks = useMemo(() => {
  return migrateTasksToColumns(tasksToShow);
}, [tasksToShow]);

// UPDATE: Task rendering with absolute positioning
{migratedTasks.map((task, taskIndex) => (
  <div
    key={task.assignmentId}
    draggable={!isReadOnly}
    style={{
      // ... existing styles ...
      width: getTaskWidth(task),
      left: getTaskPosition(task),
      position: 'absolute',
      top: 0,
      height: '62px',
      zIndex: 10 + taskIndex, // Ensure proper stacking
      // ... rest of existing styles
    }}
    // ... existing event handlers ...
  >
    {/* Existing task content */}
  </div>
))}

// ADD: Render column hover zones
{renderColumnHoverZones(employee, day, isAM)}
```

### **PHASE 3: Update Validation & Constraints (30 minutes)**

#### 3.1 Update Capacity Checks (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Update all capacity validations

// UPDATE: Context menu validation
const getSlotCapacity = (slotData: any) => {
  if (!slotData?.tasks) return { canFitTask: () => false };
  return calculateSlotCapacity(slotData.tasks);
};

// REPLACE all instances of:
// (slotData?.tasks?.length || 0) < 4
// WITH:
// getSlotCapacity(slotData).canFitTask(1) // For 1-hour tasks

// UPDATE: Context menu items
{
  label: '➕ Create Task',
  action: () => onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
  enabled: !hasTasks || getSlotCapacity(slotData).canFitTask(1)
},
{
  label: '📋 Paste Task',
  action: () => handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
  enabled: hasCopiedTask && (!hasTasks || getSlotCapacity(slotData).canFitTask(copiedTaskHours))
}
```

#### 3.2 Update Drag & Drop Validation (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Update drag & drop logic

// UPDATE: Drag over validation
onDragOver={(e) => {
  if (!isReadOnly) {
    const dragData = getDragData(); // Extract from drag event
    const capacity = getSlotCapacity(slotData);

    if (capacity.canFitTask(dragData.hours || 1)) {
      e.preventDefault();
      e.currentTarget.style.backgroundColor = '#f0f9ff';
    }
  }
}}

// UPDATE: Drop validation
onDrop={(e) => {
  if (!isReadOnly) {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    const capacity = getSlotCapacity(slotData);

    if (capacity.canFitTask(dragData.task.hours || 1)) {
      // Find best position for the task
      const bestPosition = capacity.findBestPosition(dragData.task.hours || 1);

      if (bestPosition !== null) {
        onTaskDrop?.(
          {
            ...dragData,
            task: {
              ...dragData.task,
              columnStart: bestPosition
            }
          },
          dateObj,
          isAM ? Slot.Morning : Slot.Afternoon,
          employee.employeeId
        );
      }
    }
  }
}}
```

### **PHASE 4: Task Creation & Editing (30 minutes)**

#### 4.1 Update Task Creation Modal (20 minutes)
```typescript
// TaskCreationModal.tsx - Add hour selector

// ADD: Hour state
const [selectedHours, setSelectedHours] = useState(4);
const [availableHours, setAvailableHours] = useState<number[]>([]);

// ADD: Check available hours when slot changes
useEffect(() => {
  if (employeeId && date && slot) {
    checkAvailableHours();
  }
}, [employeeId, date, slot]);

const checkAvailableHours = async () => {
  try {
    const slotData = await getSlotData(employeeId, date, slot);
    const capacity = calculateSlotCapacity(slotData.tasks || []);

    const available = [];
    for (let hours = 4; hours >= 1; hours--) {
      if (capacity.canFitTask(hours)) {
        available.push(hours);
      }
    }
    setAvailableHours(available);

    // Set default to highest available
    if (available.length > 0 && !available.includes(selectedHours)) {
      setSelectedHours(available[0]);
    }
  } catch (error) {
    console.error('Error checking available hours:', error);
  }
};

// ADD: Hour selector UI
<div className="form-group">
  <label>Duration (Hours)</label>
  <div className="hour-selector">
    {[4, 3, 2, 1].map(hours => (
      <button
        key={hours}
        type="button"
        className={`hour-btn ${selectedHours === hours ? 'active' : ''}`}
        disabled={!availableHours.includes(hours)}
        onClick={() => setSelectedHours(hours)}
      >
        {hours}h
      </button>
    ))}
  </div>
  {availableHours.length === 0 && (
    <div className="warning">No available space in this slot</div>
  )}
</div>

// UPDATE: Submit handler to include hours
const handleSubmit = (taskData) => {
  onSubmit({
    ...taskData,
    hours: selectedHours
  });
};
```

#### 4.2 Add Column Click Handler (10 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Handle column clicks

const handleColumnClick = (employee: any, day: any, isAM: boolean, column: number) => {
  // Open task creation modal with specific column pre-selected
  onSlotClick?.(
    new Date(day.date),
    isAM ? Slot.Morning : Slot.Afternoon,
    employee.employeeId,
    { preferredColumn: column, preferredHours: 1 }
  );
};
```

### **PHASE 5: Resize Functionality (30 minutes)**

#### 5.1 Add Resize Handles (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Add resize functionality

const [resizingTask, setResizingTask] = useState<number | null>(null);

// ADD: Resize handles to task rendering
{migratedTasks.map((task, taskIndex) => (
  <div
    key={task.assignmentId}
    style={/* existing styles */}
    onMouseEnter={() => setHoveredTask(task.assignmentId)}
    onMouseLeave={() => setHoveredTask(null)}
  >
    {/* Existing task content */}

    {/* Resize handles */}
    {hoveredTask === task.assignmentId && !isReadOnly && (
      <>
        <div
          className="resize-handle resize-left"
          style={{
            position: 'absolute',
            left: '-2px',
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'ew-resize',
            backgroundColor: '#3b82f6',
            zIndex: 20
          }}
          onMouseDown={(e) => startResize(e, task, 'left')}
        />
        <div
          className="resize-handle resize-right"
          style={{
            position: 'absolute',
            right: '-2px',
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'ew-resize',
            backgroundColor: '#3b82f6',
            zIndex: 20
          }}
          onMouseDown={(e) => startResize(e, task, 'right')}
        />
      </>
    )}
  </div>
))}
```

#### 5.2 Implement Resize Logic (15 minutes)
```typescript
// DayBasedCalendarGrid.tsx - Resize handlers

const startResize = (e: React.MouseEvent, task: AssignmentTaskDto, handle: 'left' | 'right') => {
  e.preventDefault();
  e.stopPropagation();

  setResizingTask(task.assignmentId);

  const startX = e.clientX;
  const startHours = task.computedHours;
  const startColumn = task.computedColumnStart;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const slotWidth = 160; // Approximate slot width
    const deltaColumns = Math.round(deltaX / (slotWidth / 4));

    let newHours = startHours;
    let newColumn = startColumn;

    if (handle === 'right') {
      newHours = Math.max(1, Math.min(4, startHours + deltaColumns));
      // Check if fits in slot
      if (newColumn + newHours > 4) {
        newHours = 4 - newColumn;
      }
    } else {
      newColumn = Math.max(0, startColumn + deltaColumns);
      newHours = startHours - deltaColumns;
      if (newHours < 1) {
        newColumn = startColumn + startHours - 1;
        newHours = 1;
      }
    }

    // Update task temporarily for visual feedback
    updateTaskDisplay(task.assignmentId, { hours: newHours, columnStart: newColumn });
  };

  const handleMouseUp = () => {
    setResizingTask(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Commit the change
    commitTaskUpdate(task.assignmentId);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
```

### **PHASE 6: Testing & Validation (15 minutes)**

#### 6.1 Test Existing Functionality
- [ ] Task selection (single & multi)
- [ ] Context menus
- [ ] Copy/paste
- [ ] Quick edit modals
- [ ] Drag & drop between slots
- [ ] Task details modal
- [ ] Bulk operations
- [ ] Leave/holiday rendering
- [ ] Overflow handling

#### 6.2 Test New Functionality
- [ ] Column hover effects
- [ ] Hour-based positioning
- [ ] Resize handles
- [ ] Capacity validation
- [ ] Task creation with hours
- [ ] Auto-positioning on drop

### **PHASE 7: CSS Updates (10 minutes)**

```css
/* Add to existing styles */

.hour-selector {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.hour-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hour-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.hour-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f9fafb;
}

.column-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.1; }
  50% { opacity: 0.2; }
  100% { opacity: 0.1; }
}

.resize-handle {
  opacity: 0;
  transition: opacity 0.2s;
}

.task-card:hover .resize-handle {
  opacity: 0.7;
}

.resize-handle:hover {
  opacity: 1;
}

.warning {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}
```

## 🚨 **CRITICAL SUCCESS CRITERIA**

1. **NO BREAKING CHANGES** - All existing functionality must work
2. **BACKWARD COMPATIBILITY** - Tasks without hour data auto-calculate
3. **PRESERVE 4-TASK LIMIT** - Maintain existing capacity constraints
4. **VISUAL CONSISTENCY** - Keep existing look and feel
5. **PERFORMANCE** - No degradation in rendering speed

## 🔄 **ROLLBACK STRATEGY**

If ANY existing functionality breaks:
```bash
# Immediate rollback
cp backup_20250920_201738/modified_files/* frontend/src/components/calendar/
cp backup_20250920_201738/modified_files/* frontend/src/types/
```

## ⏱️ **ESTIMATED TIMELINE: 3 hours total**
- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 30 minutes
- Phase 4: 30 minutes
- Phase 5: 30 minutes
- Phase 6: 15 minutes
- Phase 7: 10 minutes
- Buffer: 10 minutes