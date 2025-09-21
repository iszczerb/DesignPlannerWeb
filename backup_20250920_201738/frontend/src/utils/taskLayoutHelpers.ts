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