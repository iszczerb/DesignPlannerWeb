import { AssignmentTaskDto } from '../types/schedule';

const SLOT_TOTAL_HOURS = 4; // Each slot has 4 hours

export interface TaskWithCalculatedHours extends AssignmentTaskDto {
  calculatedHours: number; // The actual hours this task will use
}

/**
 * Calculate hours for all tasks in a time slot - AUTOMATIC CALCULATION ONLY
 * Logic:
 * - Each slot has 4 total hours
 * - Hours are automatically divided equally among all tasks
 * - 1 task = 4 hours, 2 tasks = 2 hours each, 3 tasks = 1.33 hours each, 4 tasks = 1 hour each
 */
export function calculateTaskHours(tasks: AssignmentTaskDto[]): TaskWithCalculatedHours[] {
  if (tasks.length === 0) {
    return [];
  }

  // Automatic calculation: divide 4 hours equally among all tasks
  const hoursPerTask = SLOT_TOTAL_HOURS / tasks.length;
  const roundedHoursPerTask = Math.round(hoursPerTask * 100) / 100; // Round to 2 decimal places

  // Build result array - all tasks get equal hours
  const result: TaskWithCalculatedHours[] = tasks.map(task => ({
    ...task,
    calculatedHours: roundedHoursPerTask
  }));

  return result;
}

/**
 * Format hours for display (e.g., "4h", "2.5h", "1.33h")
 */
export function formatHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    return `${hours}h`;
  }
  return `${Math.round(hours * 100) / 100}h`;
}

/**
 * Get summary of hours allocation for a slot
 */
export function getSlotHoursSummary(tasks: AssignmentTaskDto[]): {
  totalTasks: number;
  totalHours: number;
  hasCustomHours: boolean;
  customHoursCount: number;
} {
  const calculatedTasks = calculateTaskHours(tasks);
  const totalHours = calculatedTasks.reduce((sum, task) => sum + task.calculatedHours, 0);
  const customHoursCount = tasks.filter(task => task.hours !== undefined && task.hours !== null).length;

  return {
    totalTasks: tasks.length,
    totalHours: Math.round(totalHours * 100) / 100,
    hasCustomHours: customHoursCount > 0,
    customHoursCount
  };
}