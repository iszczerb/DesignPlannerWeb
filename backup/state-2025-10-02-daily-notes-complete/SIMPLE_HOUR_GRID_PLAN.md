# Simple Hour-Based Grid Implementation Plan

## ✅ Key Requirements
- **4 columns per slot** (NOT 8!) - representing 1, 2, 3, or 4 hours
- **Keep existing structure** - just adapt slots to have hour divisions
- **Same task cards** - no changes to task card component
- **Hover effects only** - no visible grid lines, just hover indicators
- **Quick implementation** - 2 hours max, not weeks!

## 📐 Grid Structure (4 Columns)

```
Each Slot (AM/PM) = 4 hours = 4 columns
┌─────┬─────┬─────┬─────┐
│  1h │  1h │  1h │  1h │  = 4 hours total
└─────┴─────┴─────┴─────┘

Task Sizing:
- 1 hour task = 1 column (25% width)
- 2 hour task = 2 columns (50% width)
- 3 hour task = 3 columns (75% width)
- 4 hour task = 4 columns (100% width)
```

## 🎯 Implementation Steps (2 Hours Total)

### Step 1: Update Data Structure (15 minutes)
Add hours field to assignments:

```typescript
// frontend/src/types/schedule.ts
export interface AssignmentTaskDto {
  // ... existing fields ...
  hours?: number; // 1, 2, 3, or 4
  columnStart?: number; // 0, 1, 2, or 3
}
```

### Step 2: Modify Slot Rendering (30 minutes)

```typescript
// DayBasedCalendarGrid.tsx - Update task width calculation

const getTaskWidth = (hours: number = 4): string => {
  switch(hours) {
    case 1: return '25%';
    case 2: return '50%';
    case 3: return '75%';
    case 4:
    default: return '100%';
  }
};

const getTaskPosition = (columnStart: number = 0): string => {
  return `${columnStart * 25}%`;
};

// In the slot rendering:
style={{
  position: 'absolute',
  width: getTaskWidth(task.hours),
  left: getTaskPosition(task.columnStart),
  height: '62px',
  top: '0',
  // ... other existing styles
}}
```

### Step 3: Add Hover Effects (20 minutes)

```typescript
// Add invisible hover zones for each column
const renderSlotHoverZones = () => (
  <>
    {[0, 1, 2, 3].map(col => (
      <div
        key={col}
        className="hover-zone"
        style={{
          position: 'absolute',
          left: `${col * 25}%`,
          width: '25%',
          height: '100%',
          top: 0,
          zIndex: 1,
          pointerEvents: hoveredSlot ? 'none' : 'auto'
        }}
        onMouseEnter={() => setHoveredColumn(col)}
        onMouseLeave={() => setHoveredColumn(null)}
      />
    ))}

    {/* Hover indicator */}
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

### Step 4: Task Placement Logic (25 minutes)

```typescript
// Smart placement when adding/moving tasks
const findAvailableColumns = (
  existingTasks: AssignmentTaskDto[],
  requiredHours: number
): number | null => {
  const occupied = new Array(4).fill(false);

  existingTasks.forEach(task => {
    const start = task.columnStart || 0;
    const end = start + (task.hours || 4);
    for (let i = start; i < end && i < 4; i++) {
      occupied[i] = true;
    }
  });

  // Find first available space that fits
  for (let i = 0; i <= 4 - requiredHours; i++) {
    let canFit = true;
    for (let j = i; j < i + requiredHours; j++) {
      if (occupied[j]) {
        canFit = false;
        break;
      }
    }
    if (canFit) return i;
  }

  return null; // No space available
};
```

### Step 5: Update Task Creation Modal (20 minutes)

```typescript
// Add hours selector to TaskCreationModal
<div className="form-group">
  <label>Duration (Hours)</label>
  <div className="hour-buttons">
    {[4, 3, 2, 1].map(h => {
      const available = checkAvailableSpace(h);
      return (
        <button
          key={h}
          type="button"
          className={`hour-btn ${hours === h ? 'active' : ''}`}
          disabled={!available}
          onClick={() => setHours(h)}
        >
          {h}h
        </button>
      );
    })}
  </div>
</div>
```

### Step 6: Drag & Drop Updates (20 minutes)

```typescript
// Update drop validation to check available columns
const canDropTask = (
  task: AssignmentTaskDto,
  targetSlot: { date: string; slot: Slot; employeeId: number }
): boolean => {
  const slotTasks = getSlotTasks(targetSlot);
  const taskHours = task.hours || 4;
  const availableCol = findAvailableColumns(slotTasks, taskHours);
  return availableCol !== null;
};

// Auto-adjust task size if needed when dropping
const handleTaskDrop = (dragItem, targetSlot) => {
  const slotTasks = getSlotTasks(targetSlot);
  let hours = dragItem.task.hours || 4;

  // Try original size first
  let columnStart = findAvailableColumns(slotTasks, hours);

  // If doesn't fit, try smaller sizes
  if (columnStart === null && hours > 1) {
    for (let h = hours - 1; h >= 1; h--) {
      columnStart = findAvailableColumns(slotTasks, h);
      if (columnStart !== null) {
        hours = h;
        break;
      }
    }
  }

  if (columnStart !== null) {
    // Update task with new position and size
    updateTask({
      ...dragItem.task,
      hours,
      columnStart,
      slot: targetSlot.slot,
      employeeId: targetSlot.employeeId,
      assignedDate: targetSlot.date
    });
  }
};
```

### Step 7: Add Resize Capability (10 minutes)

```typescript
// Simple resize by clicking on task edges
const handleTaskEdgeClick = (e: React.MouseEvent, task: AssignmentTaskDto, edge: 'left' | 'right') => {
  e.stopPropagation();

  const currentHours = task.hours || 4;
  const currentStart = task.columnStart || 0;

  if (edge === 'right') {
    // Increase/decrease from right
    const newHours = currentHours < 4 ? currentHours + 1 : 1;
    if (currentStart + newHours <= 4) {
      updateTask({ ...task, hours: newHours });
    }
  } else {
    // Adjust from left (changes both position and size)
    const newStart = currentStart > 0 ? currentStart - 1 : 0;
    const newHours = currentHours + (currentStart - newStart);
    if (newHours <= 4) {
      updateTask({ ...task, columnStart: newStart, hours: newHours });
    }
  }
};
```

## 🎨 CSS Updates

```css
/* Add to existing styles - NO NEW FILES! */

/* Hover zones - invisible by default */
.hover-zone {
  cursor: pointer;
}

/* Task edge resize areas */
.task-resize-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 11;
}

.task-resize-edge-left {
  left: 0;
}

.task-resize-edge-right {
  right: 0;
}

.task-resize-edge:hover {
  background-color: rgba(59, 130, 246, 0.3);
}

/* Hour buttons in modal */
.hour-buttons {
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
}

.hour-btn.active {
  background: #3b82f6;
  color: white;
}

.hour-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## ⚡ Quick Testing Checklist
- [ ] Tasks display with correct width (25%, 50%, 75%, 100%)
- [ ] Hover zones show column divisions
- [ ] Drag & drop respects column availability
- [ ] Task creation shows available hour options
- [ ] Resize works by clicking edges
- [ ] Auto-sizing when space is limited

## 🔄 Rollback Plan
If anything goes wrong:
```bash
# Restore backup files
cp backup_20250920_201738/modified_files/* frontend/src/components/calendar/
```

## Summary
This is a **SIMPLE ADAPTATION** of the existing system:
- Uses the **SAME 4-task maximum** we have now
- Just changes from equal division to **1-4 hour columns**
- **No complex grid system** - just percentage widths
- **Minimal code changes** - mostly in DayBasedCalendarGrid.tsx
- **Can be implemented in 2 hours**