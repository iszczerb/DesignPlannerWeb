// Column-based drag and drop logic for 4-column task slots
import { AssignmentTaskDto } from '../types/schedule';

/**
 * Calculate which column (0-3) a drop occurred in based on mouse position relative to slot
 */
export const calculateDropColumn = (
  dropX: number,
  slotElement: HTMLElement
): number => {
  const slotRect = slotElement.getBoundingClientRect();
  const relativeX = dropX - slotRect.left;
  const columnWidth = slotRect.width / 4;
  const column = Math.floor(relativeX / columnWidth);
  return Math.max(0, Math.min(3, column)); // Ensure 0-3 range
};

/**
 * Rearrange tasks when dropping on a specific column
 * - If dropping on empty column: place task and left-pack
 * - If dropping on existing task: insert and push right
 * - Validate max 3 tasks before drop (allowing up to 4 after)
 */
export const calculateColumnBasedRearrangement = (
  existingTasks: AssignmentTaskDto[],
  droppedTask: AssignmentTaskDto,
  targetColumn: number
): {
  canDrop: boolean;
  newArrangement: AssignmentTaskDto[];
  reason?: string;
} => {
  // RULE 1: Only accept drops if slot currently has ≤ 3 tasks
  if (existingTasks.length > 3) {
    return {
      canDrop: false,
      newArrangement: [],
      reason: "Slot is full (4 tasks maximum)"
    };
  }

  // RULE 1.5: Smart space validation - allow drops that can be accommodated by intelligent resizing
  const tasksExcludingDropped = existingTasks.filter(t => t.assignmentId !== droppedTask.assignmentId);
  const droppedTaskHours = droppedTask.hours || 1;

  // Calculate if we can fit the task with smart compression
  const totalExistingHours = tasksExcludingDropped.reduce((sum, task) => sum + (task.hours || 1), 0);
  const totalHoursNeeded = totalExistingHours + droppedTaskHours;

  // SMART VALIDATION: Check if we can fit with intelligent compression
  // Each task (including dropped) needs minimum 1 hour, but dropped task can be compressed too
  const totalTaskCount = tasksExcludingDropped.length + 1; // Including the dropped task
  if (totalTaskCount > 4) {
    return {
      canDrop: false,
      newArrangement: [],
      reason: `Cannot fit ${totalTaskCount} tasks in 4 columns (maximum 4 tasks)`
    };
  }

  // If we have space for all tasks (each taking at least 1 hour), allow the drop
  // The smart compression will handle resizing as needed

  // RULE 2: Don't allow dropping task on itself in same position
  const isMovingWithinSlot = existingTasks.some(t => t.assignmentId === droppedTask.assignmentId);

  console.log('🎯 Column-based rearrangement:', {
    targetColumn,
    existingTaskCount: existingTasks.length,
    isMovingWithinSlot,
    tasksAfterFilter: tasksExcludingDropped.length,
    existingTasks: existingTasks.map(t => ({
      id: t.assignmentId,
      hours: t.hours,
      columnStart: t.columnStart,
      title: t.taskTitle?.substring(0, 20)
    })),
    droppedTask: {
      id: droppedTask.assignmentId,
      hours: droppedTask.hours,
      title: droppedTask.taskTitle?.substring(0, 20)
    }
  });

  // SIMPLIFIED APPROACH: Always use smart compression regardless of drop location
  // This ensures resizing works whether dropping in first, middle, or last column of multi-hour tasks

  console.log('🎯 Column-based rearrangement - using smart compression approach');
  console.log(`🎯 DROP DETAILS: targetColumn=${targetColumn}, droppedTask=${droppedTask.assignmentId}`);

  // Create the new arrangement with dropped task
  const newArrangement = [
    ...tasksExcludingDropped,
    { ...droppedTask, columnStart: targetColumn, hours: droppedTask.hours ?? 1 }
  ];

  console.log('📋 New arrangement before compression:', newArrangement.map(t => ({
    id: t.assignmentId,
    hours: t.hours,
    start: t.columnStart
  })));

  // Always apply smart compression - it will handle both scenarios:
  // 1. No compression needed → simple left-pack
  // 2. Compression needed → intelligent resizing
  return {
    canDrop: true,
    newArrangement: smartCompressAndPosition(newArrangement, droppedTask.assignmentId, targetColumn)
  };
};

/**
 * Smart compression and positioning system with proper insertion order
 * Intelligently resizes tasks when needed to fit all tasks in 4 columns
 * Respects the insertion position of the dropped task
 */
export const smartCompressAndPosition = (tasks: AssignmentTaskDto[], droppedTaskId?: number, targetColumn?: number): AssignmentTaskDto[] => {
  if (tasks.length === 0) return tasks;

  // Find the dropped task
  const droppedTask = tasks.find(t => t.assignmentId === droppedTaskId);
  const otherTasks = tasks.filter(t => t.assignmentId !== droppedTaskId);

  console.log(`🧠 Smart compression for ${tasks.length} tasks (dropped: ${droppedTaskId} at column ${targetColumn}):`, {
    totalTasks: tasks.length,
    droppedTask: droppedTask ? { id: droppedTask.assignmentId, hours: droppedTask.hours } : 'not found',
    otherTasks: otherTasks.map(t => ({ id: t.assignmentId, hours: t.hours, column: t.columnStart }))
  });

  let finalOrder: AssignmentTaskDto[];

  if (droppedTask && targetColumn !== undefined) {
    // SMART INSERTION: Place dropped task at the correct position
    const sortedOtherTasks = [...otherTasks].sort((a, b) => (a.columnStart ?? 0) - (b.columnStart ?? 0));

    // Find where to insert the dropped task based on targetColumn
    let insertIndex = 0;

    // For targetColumn = 0, always insert at beginning
    if (targetColumn === 0) {
      insertIndex = 0;
    } else {
      // For other columns, find the right insertion point
      for (let i = 0; i < sortedOtherTasks.length; i++) {
        const task = sortedOtherTasks[i];
        const taskStart = task.columnStart ?? 0;
        if (targetColumn > taskStart) {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
    }

    console.log(`📍 INSERTION: Inserting dropped task ${droppedTaskId} at index ${insertIndex} (target column ${targetColumn})`);

    // Create the ordered array with proper insertion
    finalOrder = [
      ...sortedOtherTasks.slice(0, insertIndex),
      droppedTask,
      ...sortedOtherTasks.slice(insertIndex)
    ];
  } else {
    // Fallback: just sort by current position
    finalOrder = [...tasks].sort((a, b) => (a.columnStart ?? 0) - (b.columnStart ?? 0));
  }

  // Calculate total hours needed
  const totalOriginalHours = finalOrder.reduce((sum, task) => sum + (task.hours || 1), 0);

  console.log(`🧠 After insertion, total hours: ${totalOriginalHours}`, {
    finalOrder: finalOrder.map(t => ({ id: t.assignmentId, hours: t.hours })),
    needsCompression: totalOriginalHours > 4
  });

  // If all tasks fit without compression, just position them
  if (totalOriginalHours <= 4) {
    console.log('✅ No compression needed, positioning in order');
    let currentPosition = 0;
    return finalOrder.map(task => {
      const result = {
        ...task,
        columnStart: currentPosition,
        hours: task.hours || 1
      };
      currentPosition += result.hours;
      console.log(`📍 Positioned task ${task.assignmentId}: column ${result.columnStart}, ${result.hours}h`);
      return result;
    });
  }

  // COMPRESSION NEEDED - Smart algorithm
  console.log('🔥 Compression needed!');

  // Calculate how much we need to compress
  const excessHours = totalOriginalHours - 4;
  console.log(`💡 Need to reduce ${excessHours} hours total`);

  // Smart compression strategy: prefer to compress larger tasks first
  const compressedTasks = [...finalOrder];
  let remainingCompressionNeeded = excessHours;

  // Sort by hours (largest first) for compression priority
  const tasksBySize = [...compressedTasks].sort((a, b) => (b.hours || 1) - (a.hours || 1));

  for (let i = 0; i < tasksBySize.length && remainingCompressionNeeded > 0; i++) {
    const task = tasksBySize[i];
    const currentHours = task.hours || 1;

    if (currentHours > 1) {
      // Can compress this task
      const maxCompressionForThisTask = currentHours - 1; // Can't go below 1 hour
      const compressionToApply = Math.min(maxCompressionForThisTask, remainingCompressionNeeded);

      task.hours = currentHours - compressionToApply;
      remainingCompressionNeeded -= compressionToApply;

      console.log(`🔧 Compressed task ${task.assignmentId}: ${currentHours}h → ${task.hours}h`);
    }
  }

  // Position the compressed tasks in final order
  let currentPosition = 0;
  return finalOrder.map(task => {
    const result = {
      ...task,
      columnStart: currentPosition,
      hours: task.hours || 1
    };
    currentPosition += result.hours;

    console.log(`📍 Positioned task ${task.assignmentId}: column ${result.columnStart}, ${result.hours}h`);
    return result;
  });
};

/**
 * Pure left-pack function that ONLY repositions tasks without resizing
 * Used when removing tasks - we want to eliminate gaps but preserve task sizes
 */
export const leftPackOnly = (tasks: AssignmentTaskDto[]): AssignmentTaskDto[] => {
  if (tasks.length === 0) return tasks;

  console.log(`🔧 LEFT-PACK ONLY (no resizing) for ${tasks.length} tasks`);

  // Sort tasks by their current position
  const sortedTasks = [...tasks].sort((a, b) => (a.columnStart ?? 0) - (b.columnStart ?? 0));

  // Position tasks left-to-right without any resizing
  let currentPosition = 0;
  return sortedTasks.map(task => {
    const result = {
      ...task,
      columnStart: currentPosition,
      hours: task.hours || 1 // Keep original hours - NO RESIZING
    };
    currentPosition += result.hours;

    console.log(`📍 LEFT-PACK: Task ${task.assignmentId} positioned at column ${result.columnStart}, kept ${result.hours}h`);
    return result;
  });
};

/**
 * Add visual column guides to a slot for better drop targeting
 */
export const addColumnGuides = (slotElement: HTMLElement): void => {
  // Remove existing guides
  const existingGuides = slotElement.querySelectorAll('.column-guide');
  existingGuides.forEach(guide => guide.remove());

  // Add 4 column guides
  for (let i = 0; i < 4; i++) {
    const guide = document.createElement('div');
    guide.className = 'column-guide';
    guide.style.position = 'absolute';
    guide.style.left = `${(i / 4) * 100}%`;
    guide.style.width = '25%';
    guide.style.height = '100%';
    guide.style.border = '1px dashed rgba(59, 130, 246, 0.3)';
    guide.style.pointerEvents = 'none';
    guide.style.zIndex = '5';
    slotElement.appendChild(guide);
  }
};

/**
 * Remove visual column guides from a slot
 */
export const removeColumnGuides = (slotElement: HTMLElement): void => {
  const guides = slotElement.querySelectorAll('.column-guide');
  guides.forEach(guide => guide.remove());
};