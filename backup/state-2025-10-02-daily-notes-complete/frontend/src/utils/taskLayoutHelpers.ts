// Task layout utility functions for hour-based column system
// Provides backward compatibility with the existing equal-division layout

import { AssignmentTaskDto } from '../types/schedule';

/**
 * Calculate hours for a task based on the current equal-division system
 * This maintains exact backward compatibility with the existing layout
 */
export const getAutoCalculatedHours = (taskIndex: number, totalTasks: number): number => {
  if (totalTasks <= 0) return 4;

  // Current system divides 4 hours equally among tasks
  const baseHours = Math.floor(4 / totalTasks);

  // Handle remainder distribution (existing logic)
  const remainder = 4 % totalTasks;

  // First 'remainder' tasks get one extra hour
  if (taskIndex < remainder) {
    return baseHours + 1;
  }

  return Math.max(1, baseHours); // Minimum 1 hour
};

/**
 * Calculate column start position based on current equal-division system
 * This maintains exact backward compatibility with the existing layout
 */
export const getAutoCalculatedColumnStart = (taskIndex: number, totalTasks: number): number => {
  if (totalTasks <= 0) return 0;

  let currentPosition = 0;

  // Calculate position by adding up widths of previous tasks
  for (let i = 0; i < taskIndex; i++) {
    const taskHours = getAutoCalculatedHours(i, totalTasks);
    currentPosition += taskHours;
  }

  return Math.min(3, currentPosition); // Max column start is 3
};

/**
 * Migrate existing tasks to use the new column system
 * Automatically assigns hours and columnStart based on current layout
 */
export const migrateTasksToColumns = (tasks: AssignmentTaskDto[]): AssignmentTaskDto[] => {
  if (!tasks || tasks.length === 0) return tasks;

  return tasks.map((task, index) => ({
    ...task,
    hours: task.hours ?? getAutoCalculatedHours(index, tasks.length),
    columnStart: task.columnStart ?? getAutoCalculatedColumnStart(index, tasks.length)
  }));
};

/**
 * Get computed hours for a task (with fallback to auto-calculation)
 */
export const getTaskHours = (task: AssignmentTaskDto, taskIndex: number, totalTasks: number): number => {
  return task.hours ?? getAutoCalculatedHours(taskIndex, totalTasks);
};

/**
 * Get computed column start for a task (with fallback to auto-calculation)
 */
export const getTaskColumnStart = (task: AssignmentTaskDto, taskIndex: number, totalTasks: number): number => {
  return task.columnStart ?? getAutoCalculatedColumnStart(taskIndex, totalTasks);
};

/**
 * Calculate CSS width percentage for a task based on hours
 */
export const getTaskWidthPercentage = (hours: number): number => {
  return (hours / 4) * 100; // 4 hours = 100% of slot
};

/**
 * Calculate actual hours based on visual column occupancy
 * CRITICAL: Hours = Number of columns the task visually occupies (NOT task count division)
 */
export const calculateActualHours = (task: AssignmentTaskDto, taskIndex: number, totalTasks: number): number => {
  // PRIORITY 1: Use the task's explicitly set hours (from smart resizing or database)
  if (task.hours && task.hours >= 1 && task.hours <= 4) {
    const roundedHours = Math.round(task.hours);
    return roundedHours; // Ensure whole numbers only
  }

  // PRIORITY 2: If no valid hours, this means task needs migration to column system
  // For now, force equal distribution as emergency fallback
  console.warn(`⚠️ Task ${task.assignmentId} missing proper hours! Forcing equal distribution.`);

  // Emergency: distribute 4 hours among all tasks equally
  const baseHours = Math.floor(4 / totalTasks);
  const remainder = 4 % totalTasks;
  const taskHours = taskIndex < remainder ? baseHours + 1 : baseHours;
  const finalHours = Math.max(1, taskHours);

  console.log(`🚨 Emergency calculation: ${finalHours}h`);
  return finalHours;
};

/**
 * Calculate actual column start based on visual positioning
 */
export const calculateActualColumnStart = (task: AssignmentTaskDto, taskIndex: number, totalTasks: number): number => {
  // Use the task's columnStart if set, otherwise calculate
  if (task.columnStart !== undefined && task.columnStart >= 0 && task.columnStart <= 3) {
    return Math.round(task.columnStart); // Ensure whole numbers only
  }

  // Fallback to column-based calculation
  const calculatedStart = getTaskColumnStart(task, taskIndex, totalTasks);
  return Math.max(0, Math.min(3, Math.round(calculatedStart))); // Ensure 0-3 range
};

/**
 * Calculate CSS left position percentage for a task based on column start
 */
export const getTaskLeftPercentage = (columnStart: number): number => {
  return (columnStart / 4) * 100; // Column 0 = 0%, Column 3 = 75%
};

/**
 * Validate that a task fits within the 4-hour slot boundaries
 */
export const validateTaskBoundaries = (hours: number, columnStart: number): boolean => {
  return hours >= 1 && hours <= 4 &&
         columnStart >= 0 && columnStart <= 3 &&
         (columnStart + hours) <= 4;
};

/**
 * Check if tasks layout matches the current equal-division system
 * Used for testing backward compatibility
 */
export const isLegacyLayout = (tasks: AssignmentTaskDto[]): boolean => {
  if (!tasks || tasks.length === 0) return true;

  return tasks.every((task, index) => {
    const expectedHours = getAutoCalculatedHours(index, tasks.length);
    const expectedColumn = getAutoCalculatedColumnStart(index, tasks.length);

    return (!task.hours || task.hours === expectedHours) &&
           (!task.columnStart || task.columnStart === expectedColumn);
  });
};

/**
 * Create a column occupancy map for a slot
 * Returns array of 4 booleans indicating which columns are occupied
 */
export const getColumnOccupancy = (tasks: AssignmentTaskDto[]): boolean[] => {
  const occupancy = [false, false, false, false];

  tasks.forEach((task, index) => {
    const hours = getTaskHours(task, index, tasks.length);
    const columnStart = getTaskColumnStart(task, index, tasks.length);

    // Mark occupied columns
    for (let i = 0; i < hours && (columnStart + i) < 4; i++) {
      occupancy[columnStart + i] = true;
    }
  });

  return occupancy;
};

/**
 * Find the next available column for a new task
 * Always tries to place tasks as far left as possible
 */
export const findNextAvailableColumn = (tasks: AssignmentTaskDto[], requiredHours: number = 1): number => {
  const occupancy = getColumnOccupancy(tasks);

  // Find the leftmost position where we can fit the required hours
  for (let startCol = 0; startCol <= 4 - requiredHours; startCol++) {
    let canFit = true;

    // Check if all required columns are free
    for (let i = 0; i < requiredHours; i++) {
      if (occupancy[startCol + i]) {
        canFit = false;
        break;
      }
    }

    if (canFit) {
      return startCol;
    }
  }

  // No space available
  return -1;
};

/**
 * Get available space after a specific column position
 */
export const getAvailableSpaceAfter = (tasks: AssignmentTaskDto[], afterColumn: number): number => {
  const occupancy = getColumnOccupancy(tasks);
  let availableSpace = 0;

  for (let col = afterColumn; col < 4; col++) {
    if (!occupancy[col]) {
      availableSpace++;
    } else {
      break; // Stop at first occupied column
    }
  }

  return availableSpace;
};

/**
 * Auto-reflow tasks to the left after a resize operation
 * Ensures tasks are packed to the left with no gaps
 */
export const autoReflowTasks = (tasks: AssignmentTaskDto[]): AssignmentTaskDto[] => {
  if (!tasks || tasks.length === 0) return tasks;

  // Check if all tasks have explicit columnStart values (from column-based drop)
  const allHaveExplicitColumns = tasks.every(t =>
    t.columnStart !== undefined && t.columnStart !== null && t.columnStart >= 0
  );

  if (allHaveExplicitColumns) {
    // Just return tasks sorted by columnStart to maintain visual order
    return [...tasks].sort((a, b) => (a.columnStart ?? 0) - (b.columnStart ?? 0));
  }

  // Otherwise, proceed with auto-reflow logic based on SlotOrder
  // Auto-reflowing tasks based on SlotOrder

  // CRITICAL: Position tasks based on placement order (SlotOrder)
  // Lower SlotOrder = leftmost position, higher SlotOrder = rightmost position
  const sortedTasks = [...tasks].sort((a, b) => {
    // If tasks have slotOrder, use that for positioning
    const aOrder = a.slotOrder ?? 999; // Put tasks without slotOrder at the end
    const bOrder = b.slotOrder ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Fallback to array index for tasks without slotOrder
    const aIndex = tasks.indexOf(a);
    const bIndex = tasks.indexOf(b);
    return aIndex - bIndex;
  });

  let currentColumn = 0;

  const reflowedTasks = sortedTasks.map((task, index) => {
    // CRITICAL: Use the task's explicitly set hours (NO FALLBACK to old calculation)
    let hours = task.hours;

    // If hours not set, this indicates a problem - tasks should have hours after smart resizing
    if (!hours || hours < 1 || hours > 4) {
      console.error(`❌ Task ${task.assignmentId} missing proper hours! Using fallback of 1 hour.`);
      hours = 1; // Emergency fallback
    }

    const newColumnStart = currentColumn;

    // Task positioning logic

    // Ensure we don't exceed slot boundaries
    if (currentColumn + hours > 4) {
      // Task would exceed 4-column limit, capping
      const remainingColumns = 4 - currentColumn;
      const cappedHours = Math.max(1, remainingColumns);

      currentColumn += cappedHours;
      return {
        ...task,
        hours: cappedHours,
        columnStart: newColumnStart
      };
    }

    // Move to next available position
    currentColumn += hours;

    return {
      ...task,
      hours,
      columnStart: newColumnStart
    };
  });

  // Auto-reflow complete

  return reflowedTasks;
};

/**
 * Optimize task layout after a task is resized
 * Reflows other tasks to fill gaps and maintain left alignment
 */
export const optimizeLayoutAfterResize = (
  tasks: AssignmentTaskDto[],
  resizedTaskId: number,
  newHours: number
): AssignmentTaskDto[] => {
  if (!tasks || tasks.length === 0) return tasks;

  // Update the resized task
  const updatedTasks = tasks.map(task =>
    task.assignmentId === resizedTaskId
      ? { ...task, hours: newHours }
      : task
  );

  // Auto-reflow all tasks to eliminate gaps
  return autoReflowTasks(updatedTasks);
};

/**
 * Calculate optimal column start for a new task
 * Always places the task as far left as possible
 */
export const calculateOptimalPlacement = (
  existingTasks: AssignmentTaskDto[],
  newTaskHours: number
): { columnStart: number; canPlace: boolean } => {
  const nextColumn = findNextAvailableColumn(existingTasks, newTaskHours);

  return {
    columnStart: Math.max(0, nextColumn),
    canPlace: nextColumn !== -1
  };
};

/**
 * Get maximum available duration for a new task in a slot
 */
export const getMaxAvailableDuration = (existingTasks: AssignmentTaskDto[]): number => {
  const occupancy = getColumnOccupancy(existingTasks);
  let maxDuration = 0;
  let currentDuration = 0;

  // Find the longest consecutive sequence of free columns
  for (let col = 0; col < 4; col++) {
    if (!occupancy[col]) {
      currentDuration++;
      maxDuration = Math.max(maxDuration, currentDuration);
    } else {
      currentDuration = 0;
    }
  }

  return maxDuration;
};

/**
 * Calculate total hours used by existing tasks
 */
export const getTotalUsedHours = (tasks: AssignmentTaskDto[]): number => {
  return tasks.reduce((total, task, index) => {
    return total + getTaskHours(task, index, tasks.length);
  }, 0);
};

/**
 * Intelligently resize existing tasks to make room for a new task
 * Returns the updated task list with resized tasks and the new task
 */
export const smartResizeForNewTask = (
  existingTasks: AssignmentTaskDto[],
  newTaskHours: number = 1
): {
  resizedTasks: AssignmentTaskDto[];
  canFit: boolean;
  tasksToUpdate: { assignmentId: number; newHours: number }[];
} => {
  console.log('🔍 smartResizeForNewTask called:', {
    existingTasksCount: existingTasks.length,
    newTaskHours,
    currentUsedHours: getTotalUsedHours(existingTasks)
  });

  if (!existingTasks || existingTasks.length === 0) {
    console.log('✅ Empty slot - no resizing needed');
    return {
      resizedTasks: [],
      canFit: true,
      tasksToUpdate: []
    };
  }

  // HARD LIMIT: Cannot exceed 4 tasks total
  if (existingTasks.length >= 4) {
    console.log('❌ Slot already has 4 tasks - cannot add more');
    return {
      resizedTasks: existingTasks,
      canFit: false,
      tasksToUpdate: []
    };
  }

  // CONSERVATIVE RESIZING: Only shrink tasks when absolutely necessary
  const currentUsedHours = getTotalUsedHours(existingTasks);
  const availableSpace = 4 - currentUsedHours;

  console.log(`🔍 Current state: ${currentUsedHours}h used, ${availableSpace}h available, need ${newTaskHours}h`);

  // If we have enough space, don't resize anything
  if (availableSpace >= newTaskHours) {
    console.log('✅ Enough space available - no resizing needed');
    return {
      resizedTasks: existingTasks,
      canFit: true,
      tasksToUpdate: []
    };
  }

  // Need to make room - calculate how much space we need to free up
  const spaceToFree = newTaskHours - availableSpace;
  console.log(`⚠️ Need to free up ${spaceToFree}h`);

  const resizedTasks: AssignmentTaskDto[] = [];
  const tasksToUpdate: { assignmentId: number; newHours: number }[] = [];
  let spaceFreed = 0;

  // Try to shrink tasks minimally, starting with the largest ones
  const sortedTasks = [...existingTasks].sort((a, b) => {
    const hoursA = getTaskHours(a, 0, existingTasks.length);
    const hoursB = getTaskHours(b, 0, existingTasks.length);
    return hoursB - hoursA; // Largest first
  });

  for (const task of sortedTasks) {
    const currentHours = getTaskHours(task, 0, existingTasks.length);

    if (spaceFreed >= spaceToFree) {
      // We have enough space, keep this task as-is
      resizedTasks.push(task);
    } else {
      // Try to shrink this task by 1 hour minimum
      const hoursToReduce = Math.min(currentHours - 1, spaceToFree - spaceFreed);
      const newHours = Math.max(1, currentHours - hoursToReduce);

      console.log(`📉 Shrinking task ${task.assignmentId}: ${currentHours}h → ${newHours}h`);

      if (newHours !== currentHours) {
        resizedTasks.push({
          ...task,
          hours: newHours
        });

        tasksToUpdate.push({
          assignmentId: task.assignmentId,
          newHours: newHours
        });

        spaceFreed += (currentHours - newHours);
      } else {
        resizedTasks.push(task);
      }
    }
  }

  const canFit = spaceFreed >= spaceToFree;
  console.log(canFit ? '✅ Successfully made room' : '❌ Could not make enough room');

  return {
    resizedTasks,
    canFit,
    tasksToUpdate
  };
};

/**
 * Calculate optimal layout when adding a new task to existing tasks
 * Automatically resizes existing tasks if needed and positions everything optimally
 */
export const calculateOptimalLayoutWithNewTask = (
  existingTasks: AssignmentTaskDto[],
  newTaskData: Partial<AssignmentTaskDto>,
  preferredHours: number = 1
): {
  finalLayout: AssignmentTaskDto[];
  newTaskHours: number;
  canPlace: boolean;
  tasksToUpdate: { assignmentId: number; newHours: number }[];
} => {
  console.log('🧮 calculateOptimalLayoutWithNewTask:', {
    existingTasksCount: existingTasks.length,
    newTaskId: newTaskData.assignmentId,
    preferredHours
  });

  // CRITICAL: Remove the moved task from existing tasks if it's already there
  // This prevents duplication when moving tasks between slots
  const filteredExistingTasks = existingTasks.filter(task =>
    task.assignmentId !== newTaskData.assignmentId
  );

  console.log('🔍 Task deduplication:', {
    originalCount: existingTasks.length,
    filteredCount: filteredExistingTasks.length,
    removedDuplicate: existingTasks.length !== filteredExistingTasks.length
  });

  // CRITICAL: Preserve the original task hours when moving
  // For task moves, use the original hours from the moved task
  const originalTaskHours = newTaskData.hours || preferredHours;
  console.log(`🎯 Preserving original task hours: ${originalTaskHours}`);

  // Check if we can fit the task with its original hours without resizing anything
  const totalUsedHours = getTotalUsedHours(filteredExistingTasks);
  const spaceNeeded = originalTaskHours;
  const availableSpace = 4 - totalUsedHours;

  console.log(`📊 Space analysis: need ${spaceNeeded}h, available ${availableSpace}h`);

  let finalTaskHours = originalTaskHours;
  let resizeResult = { resizedTasks: filteredExistingTasks, canFit: true, tasksToUpdate: [] };

  if (availableSpace < spaceNeeded) {
    console.log(`⚠️ Not enough space! Need ${spaceNeeded}h but only ${availableSpace}h available`);

    // Only resize if absolutely necessary, and try to keep original hours if possible
    const maxPossibleHours = Math.min(originalTaskHours, availableSpace);

    if (maxPossibleHours >= 1) {
      // Try to fit with reduced hours first
      finalTaskHours = maxPossibleHours;
      console.log(`📉 Reducing task to ${finalTaskHours}h to fit available space`);
    } else {
      // Last resort: force resize existing tasks
      console.log(`🚨 Force resizing existing tasks to make room`);
      resizeResult = smartResizeForNewTask(filteredExistingTasks, originalTaskHours);
      finalTaskHours = originalTaskHours; // Keep original hours

      if (!resizeResult.canFit) {
        console.log('❌ Cannot fit new task even with smart resizing');
        return {
          finalLayout: filteredExistingTasks,
          newTaskHours: 0,
          canPlace: false,
          tasksToUpdate: []
        };
      }
    }
  }

  console.log(`✅ Final task hours: ${finalTaskHours} (original: ${originalTaskHours})`);

  // Create the new task with preserved hours
  const newTask: AssignmentTaskDto = {
    assignmentId: newTaskData.assignmentId || 0, // Use actual ID from newTaskData
    taskTitle: newTaskData.taskTitle || 'New Task',
    taskDescription: newTaskData.taskDescription || '',
    priority: newTaskData.priority || 1,
    taskStatus: newTaskData.taskStatus || 1,
    assignedDate: newTaskData.assignedDate || '',
    slot: newTaskData.slot || 1,
    hours: finalTaskHours, // Use preserved/adjusted hours
    columnStart: 0,
    ...newTaskData
  };

  // Combine resized existing tasks with new task
  const allTasks = [...resizeResult.resizedTasks, newTask];

  // Auto-reflow everything to optimal positions
  const finalLayout = autoReflowTasks(allTasks);

  console.log('✅ Final layout calculated:', {
    finalLayoutLength: finalLayout.length,
    newTaskHours: finalTaskHours,
    totalHours: finalLayout.reduce((sum, task) => sum + (task.hours || 1), 0)
  });

  return {
    finalLayout,
    newTaskHours: finalTaskHours,
    canPlace: true,
    tasksToUpdate: resizeResult.tasksToUpdate
  };
};