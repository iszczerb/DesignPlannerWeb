import React, { useState, useRef, useEffect } from 'react';
import SimplifiedEmployeeRow from './SimplifiedEmployeeRow';
import TeamDetailsModal from './TeamDetailsModal';
import {
  EmployeeCalendarDto,
  CalendarDayDto,
  AssignmentTaskDto,
  Slot,
  LeaveType,
  LeaveDuration,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_ICONS,
  LEAVE_TYPE_LABELS
} from '../../types/schedule';
import { DragItem } from '../../types/dragDrop';
import {
  migrateTasksToColumns,
  getTaskHours,
  getTaskColumnStart,
  getTaskWidthPercentage,
  getTaskLeftPercentage,
  optimizeLayoutAfterResize,
  calculateOptimalPlacement,
  getMaxAvailableDuration,
  autoReflowTasks,
  smartResizeForNewTask,
  calculateOptimalLayoutWithNewTask,
  getTotalUsedHours,
  calculateActualHours,
  calculateActualColumnStart
} from '../../utils/taskLayoutHelpers';
import {
  calculateDropColumn,
  calculateColumnBasedRearrangement,
  addColumnGuides,
  removeColumnGuides
} from '../../utils/columnDropHelpers';
import { createCardColorScheme, lightenColor } from '../../utils/colorUtils';

interface DayBasedCalendarGridProps {
  employees: EmployeeCalendarDto[];
  days: CalendarDayDto[];
  onTaskClick?: (task: AssignmentTaskDto, event?: React.MouseEvent) => void;
  onSlotClick?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskDrop?: (dragItem: DragItem, targetDate: Date, targetSlot: Slot, targetEmployeeId: number) => void;
  onDragStart?: (sourceSlotInfo: {employeeId: number, date: Date, slot: Slot, remainingTasks: AssignmentTaskDto[]}) => void;
  onTaskEdit?: (task: AssignmentTaskDto) => void;
  onTaskDelete?: (assignmentId: number) => void;
  onTaskView?: (task: AssignmentTaskDto) => void;
  onTaskCopy?: (task: AssignmentTaskDto) => void;
  onTaskPaste?: (date: Date, slot: Slot, employeeId: number) => void;
  onTaskPasteMultiple?: () => void; // For multi-slot pasting
  onBulkEdit?: () => void; // For bulk editing multiple tasks
  onQuickEditTaskType?: (task: AssignmentTaskDto) => void;
  onQuickEditStatus?: (task: AssignmentTaskDto) => void;
  onQuickEditPriority?: (task: AssignmentTaskDto) => void;
  onQuickEditDueDate?: (task: AssignmentTaskDto) => void;
  onQuickEditNotes?: (task: AssignmentTaskDto) => void;
  onBulkDelete?: (taskIds: number[]) => void;
  hasCopiedTask?: boolean;
  isReadOnly?: boolean;
  onSetBankHoliday?: (date: Date) => void;
  onSetLeave?: (date: Date) => void;
  onClearBlocking?: (date: Date) => void;
  onDayViewDetails?: (date: Date, day: CalendarDayDto) => void;
  selectedTaskIds?: number[];
  selectedSlots?: Array<{ date: Date; slot: Slot; employeeId: number; }>;
  onSlotFocus?: (date: Date, slot: Slot, employeeId: number, event?: React.MouseEvent) => void;
  selectedDays?: string[]; // Array of date strings (toDateString() format)
  onDayClick?: (date: Date, event?: React.MouseEvent) => void;
  // Team management props
  onTeamViewDetails?: (teamId: number, teamName: string, teamMembers: EmployeeCalendarDto[]) => void;
  onTeamFilter?: (action: 'toggle' | 'clear', teamName?: string) => void;
  selectedTeamFilters?: string[];
  // Individual employee management props
  onEmployeeView?: (employee: any) => void;
  onEmployeeEdit?: (employee: any) => void;
  onEmployeeDelete?: (employeeId: number) => void;
  // Refresh callback for actions that need to reload calendar data
  onRefresh?: () => void;
}

const DayBasedCalendarGrid: React.FC<DayBasedCalendarGridProps> = ({
  employees,
  days,
  onTaskClick,
  onSlotClick,
  onTaskDrop,
  onDragStart,
  onTaskEdit,
  onTaskDelete,
  onTaskView,
  onTaskCopy,
  onTaskPaste,
  onTaskPasteMultiple,
  onBulkEdit,
  onQuickEditTaskType,
  onQuickEditStatus,
  onQuickEditPriority,
  onQuickEditDueDate,
  onQuickEditNotes,
  onBulkDelete,
  hasCopiedTask = false,
  isReadOnly = false,
  onSetBankHoliday,
  onSetLeave,
  onClearBlocking,
  onDayViewDetails,
  selectedTaskIds = [],
  selectedSlots = [],
  onSlotFocus,
  selectedDays = [],
  onDayClick,
  onTeamViewDetails,
  onTeamFilter,
  selectedTeamFilters = [],
  onEmployeeView,
  onEmployeeEdit,
  onEmployeeDelete,
  onRefresh
}) => {
  // State management for hover and context menus
  const [hoveredSlot, setHoveredSlot] = useState<{
    employeeId: number;
    date: string;
    isAM: boolean;
  } | null>(null);

  // State for tracking hovered columns in the 4-column grid
  const [hoveredColumn, setHoveredColumn] = useState<{
    employeeId: number;
    date: string;
    isAM: boolean;
    column: number;
  } | null>(null);

  // State for tracking hovered resize handles
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<{
    taskId: number;
    side: 'left' | 'right';
  } | null>(null);

  // State for tracking active resize operation
  const [resizingTask, setResizingTask] = useState<{
    taskId: number;
    side: 'left' | 'right';
    originalHours: number;
    originalColumnStart: number;
    startX: number;
    currentHours: number;
    currentColumnStart: number;
    employeeId: number;
    date: Date;
    slot: Slot;
  } | null>(null);

  // Helper function to find available columns for a task
  const findAvailableColumns = (
    existingTasks: AssignmentTaskDto[],
    requiredHours: number
  ): number | null => {
    const occupied = new Array(4).fill(false);

    // Mark occupied columns
    migrateTasksToColumns(existingTasks).forEach((task, taskIndex) => {
      const start = getTaskColumnStart(task, taskIndex, existingTasks.length);
      const hours = getTaskHours(task, taskIndex, existingTasks.length);
      const end = start + hours;
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

  // Intelligent drop validation with auto-resizing
  const canDropTask = (
    task: AssignmentTaskDto,
    targetSlotTasks: AssignmentTaskDto[]
  ): {
    canDrop: boolean;
    smartLayout?: AssignmentTaskDto[];
    tasksToUpdate?: { assignmentId: number; newHours: number }[];
    newTaskHours?: number;
  } => {
    const taskHours = task.hours || 1; // Default to 1 hour for new tasks

    console.log('🎯 Smart drop analysis:', {
      incomingTaskHours: taskHours,
      currentSlotTasks: targetSlotTasks.length,
      currentTotalHours: getTotalUsedHours(targetSlotTasks)
    });

    // Use the smart layout calculator
    const layoutResult = calculateOptimalLayoutWithNewTask(
      targetSlotTasks,
      {
        assignmentId: task.assignmentId,
        taskTitle: task.taskTitle,
        taskDescription: task.taskDescription,
        priority: task.priority,
        taskStatus: task.taskStatus,
        assignedDate: task.assignedDate,
        slot: task.slot
      },
      taskHours
    );

    console.log('🧠 Smart layout result:', {
      canPlace: layoutResult.canPlace,
      tasksToUpdate: layoutResult.tasksToUpdate,
      finalLayoutLength: layoutResult.finalLayout.length
    });

    return {
      canDrop: layoutResult.canPlace,
      smartLayout: layoutResult.finalLayout,
      tasksToUpdate: layoutResult.tasksToUpdate,
      newTaskHours: layoutResult.newTaskHours
    };
  };

  // NEW: Column-based drop handler
  const handleColumnBasedDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    slotData: any,
    dateObj: Date,
    isAM: boolean,
    employee: EmployeeCalendarDto
  ) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'transparent';
    removeColumnGuides(e.currentTarget);

    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!dragData || dragData.type !== 'task') {
      return;
    }

    // Check if the target slot has a leave - prevent task operations on blocked slots
    // Fix timezone issue - use local date instead of UTC
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dayNum = String(dateObj.getDate()).padStart(2, '0');
    const dayString = `${year}-${month}-${dayNum}`;
    const day = { date: dayString } as CalendarDayDto;
    if (hasLeaveInSlot(employee, day, isAM)) {
      console.log('❌ Cannot drop task on slot with leave');
      return;
    }

    // 🚨 CRITICAL FIX: Get FRESH slot data instead of using stale React state!
    // The slotData parameter can be stale during rapid operations, causing overlaps
    console.log('🔍 GETTING FRESH SLOT DATA to prevent stale state overlaps...');

    // Get the most up-to-date slot data from current calendar state
    const currentDayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );
    const freshSlotData = isAM ? currentDayAssignment?.morningSlot : currentDayAssignment?.afternoonSlot;
    const freshExistingTasks = freshSlotData?.tasks || [];

    // Calculate which column (0-3) the drop occurred in
    const targetColumn = calculateDropColumn(e.clientX, e.currentTarget);

    console.log('🎯 Column-based drop WITH FRESH DATA:', {
      targetColumn,
      staleTaskCount: slotData?.tasks?.length || 0,
      freshTaskCount: freshExistingTasks.length,
      draggedTask: dragData.task.taskTitle,
      freshTasks: freshExistingTasks.map(t => ({ id: t.assignmentId, column: t.columnStart, hours: t.hours }))
    });

    // CRITICAL: Use FRESH existing tasks for collision detection
    const existingTasks = freshExistingTasks;

    // Apply column-based rearrangement logic
    const rearrangementResult = calculateColumnBasedRearrangement(
      existingTasks,
      dragData.task,
      targetColumn
    );

    if (!rearrangementResult.canDrop) {
      console.log('❌ Drop rejected:', rearrangementResult.reason);
      return;
    }

    console.log('✅ Drop accepted! New arrangement:', rearrangementResult.newArrangement);

    // CRITICAL: Update the dragged task with its new position from the arrangement
    const droppedTaskInArrangement = rearrangementResult.newArrangement.find(
      t => t.assignmentId === dragData.task.assignmentId
    );

    if (droppedTaskInArrangement) {
      // Update drag data with the calculated position
      dragData.task.columnStart = droppedTaskInArrangement.columnStart;
      dragData.task.hours = droppedTaskInArrangement.hours;

      console.log('📍 Updated task position:', {
        taskId: dragData.task.assignmentId,
        columnStart: droppedTaskInArrangement.columnStart,
        hours: droppedTaskInArrangement.hours
      });
    }

    // Call the original drop handler with updated task data
    onTaskDrop?.(dragData, dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);

    // Update all other tasks in the slot with their new positions
    if (rearrangementResult.newArrangement.length > 1) {
      console.log('🔄 Updating other tasks in slot with new positions...');

      // Import the schedule service dynamically
      const { default: scheduleService } = await import('../../services/scheduleService');

      // Update ALL tasks in the new arrangement (except the dropped one)
      // This ensures compression changes are always saved to backend
      for (const task of rearrangementResult.newArrangement) {
        if (task.assignmentId !== dragData.task.assignmentId) {
          console.log(`📦 FORCE UPDATING task ${task.assignmentId}: column ${task.columnStart}, hours ${task.hours} (ensuring compression is saved)`);

          await scheduleService.updateAssignment({
            assignmentId: task.assignmentId,
            columnStart: task.columnStart,
            hours: task.hours
          });
        }
      }

      // ⚡ SMART REFRESH: Only refresh after all operations complete
      // Reduced delay and single refresh point to eliminate race conditions
      setTimeout(() => {
        console.log('⚡ Smart refresh after operations complete');
        onRefresh?.();
      }, 100);
    }
  };

  // Helper function to check if a task can be resized
  const canResizeTask = (task: AssignmentTaskDto, side: 'left' | 'right', allSlotTasks: AssignmentTaskDto[]): boolean => {
    const currentHours = task.hours || 4;
    const currentColumnStart = task.columnStart || 0;

    // CRITICAL: Don't show resize handles when slot has 4 tasks (no more space)
    if (allSlotTasks.length >= 4) {
      return false;
    }

    if (side === 'left') {
      // Can resize left if task can be made smaller (> 1 hour)
      return currentHours > 1;
    } else {
      // Can resize right if task can be made smaller or larger within bounds
      const currentEnd = currentColumnStart + currentHours;
      return currentHours > 1 || currentEnd < 4;
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, task: AssignmentTaskDto, side: 'left' | 'right', employeeId: number, date: Date, slot: Slot) => {
    e.preventDefault();
    e.stopPropagation();

    const currentHours = task.hours || 4;
    const currentColumnStart = task.columnStart || 0;

    setResizingTask({
      taskId: task.assignmentId,
      side,
      originalHours: currentHours,
      originalColumnStart: currentColumnStart,
      startX: e.clientX,
      currentHours: currentHours,
      currentColumnStart: currentColumnStart,
      employeeId,
      date,
      slot
    });

  };

  // Handle resize during mouse move
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingTask) return;

    const deltaX = e.clientX - resizingTask.startX;
    const columnWidth = 80; // Approximate column width in pixels (adjust based on actual slot width)
    const columnsChanged = Math.round(deltaX / columnWidth);

    let newHours = resizingTask.originalHours;
    let newColumnStart = resizingTask.originalColumnStart;

    if (resizingTask.side === 'left') {
      // Resizing from left: adjust column start and hours
      const adjustment = Math.max(-resizingTask.originalColumnStart, Math.min(resizingTask.originalHours - 1, columnsChanged));
      newColumnStart = resizingTask.originalColumnStart + adjustment;
      newHours = resizingTask.originalHours - adjustment;
    } else {
      // Resizing from right: adjust hours only
      const maxHours = 4 - resizingTask.originalColumnStart;
      newHours = Math.max(1, Math.min(maxHours, resizingTask.originalHours + columnsChanged));
    }

    // Validate bounds
    newHours = Math.max(1, Math.min(4, newHours));
    newColumnStart = Math.max(0, Math.min(3, newColumnStart));

    // Ensure task doesn't exceed slot boundaries
    if (newColumnStart + newHours > 4) {
      if (resizingTask.side === 'left') {
        newColumnStart = 4 - newHours;
      } else {
        newHours = 4 - newColumnStart;
      }
    }

    // Update current state for visual feedback
    setResizingTask(prev => prev ? {
      ...prev,
      currentHours: newHours,
      currentColumnStart: newColumnStart
    } : null);

  };

  // Handle bulk task resizing during smart drops
  const handleBulkTaskResize = async (tasksToUpdate: { assignmentId: number; newHours: number }[]) => {
    try {
      console.log('🔄 Starting bulk task resize for smart drop:', tasksToUpdate);

      // Import schedule service
      const { default: scheduleService } = await import('../../services/scheduleService');

      // Update each task individually (can be optimized to bulk update later)
      const updatePromises = tasksToUpdate.map(async (taskUpdate) => {
        console.log(`📤 Updating task ${taskUpdate.assignmentId} to ${taskUpdate.newHours} hours`);

        const updateData = {
          assignmentId: taskUpdate.assignmentId,
          hours: taskUpdate.newHours
        };

        return scheduleService.updateAssignment(updateData);
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      console.log('✅ Bulk resize completed:', results);

      // Refresh calendar after bulk update
      if (onRefresh) {
        setTimeout(() => {
          console.log('🔄 Refreshing calendar after bulk resize...');
          onRefresh();
        }, 100); // Small delay to ensure API calls complete
      }

    } catch (error) {
      console.error('❌ Bulk task resize failed:', error);
      // TODO: Show error message to user
    }
  };

  // Handle resize end
  const handleResizeEnd = async () => {
    if (!resizingTask) {
      return;
    }

    const { taskId, currentHours, currentColumnStart, originalHours, originalColumnStart, employeeId, date, slot } = resizingTask;

    // Only update if something actually changed
    if (currentHours !== originalHours || currentColumnStart !== originalColumnStart) {
      try {
        // Find the current employee and slot to get fresh data
        const employee = employees.find(emp => emp.employeeId === employeeId);
        const day = days.find(d => new Date(d.date).toDateString() === new Date(date).toDateString());

        if (!employee || !day) {
          console.error('Could not find employee or day for resize collision detection');
          throw new Error('Invalid employee or day for resize');
        }

        const dayAssignment = employee.dayAssignments.find(
          assignment => new Date(assignment.date).toDateString() === new Date(date).toDateString()
        );

        if (!dayAssignment) {
          console.error('Could not find day assignment for resize collision detection');
          throw new Error('Invalid day assignment for resize');
        }

        const slotData = slot === Slot.Morning ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;

        if (!slotData) {
          console.error('Could not find slot data for resize collision detection');
          throw new Error('Invalid slot data for resize');
        }

        // The slot data structure uses 'tasks' not 'assignmentTasks'
        const slotTasks = slotData.tasks || [];

        // Get fresh existing tasks (excluding the one being resized)
        const freshExistingTasks = slotTasks.filter(task => task.assignmentId !== taskId);

        // Create a mock task with the new resize dimensions for collision detection
        const originalTask = slotTasks.find(task => task.assignmentId === taskId);
        if (!originalTask) {
          console.error('Could not find original task in slot data for resize collision detection');
          throw new Error('Original task not found for resize');
        }

        const resizedTaskForCollision = {
          ...originalTask,
          columnStart: currentColumnStart,
          hours: currentHours
        };

        // Apply column-based rearrangement logic (same as drag-and-drop)
        const rearrangementResult = calculateColumnBasedRearrangement(
          freshExistingTasks,
          resizedTaskForCollision,
          currentColumnStart
        );

        if (!rearrangementResult.canDrop) {
          // Reset the task to original state
          setResizingTask(null);
          return;
        }

        const { default: scheduleService } = await import('../../services/scheduleService');

        // Update all tasks in the arrangement (including repositioned ones)
        for (const task of rearrangementResult.newArrangement) {
          const updateData = {
            assignmentId: task.assignmentId,
            columnStart: task.columnStart,
            hours: task.hours
          };

          await scheduleService.updateAssignment(updateData);
        }

        // Trigger a refresh of the calendar data
        if (onRefresh) {
          await onRefresh();
        }

      } catch (error) {
        console.error(`Failed to resize task ${taskId}:`, error);
      }
    }

    setResizingTask(null);
  };

  // Add global mouse event listeners for resize
  React.useEffect(() => {
    if (resizingTask) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingTask]);
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const [contextMenus, setContextMenus] = useState<NodeListOf<Element> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Team details modal state
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: number;
    name: string;
    members: EmployeeCalendarDto[];
  } | null>(null);
  const [teamHeaderHovered, setTeamHeaderHovered] = useState(false);

  // Cleanup context menus
  useEffect(() => {
    const handleClickOutside = () => {
      // Remove all existing context menus
      document.querySelectorAll('[data-context-menu]').forEach(menu => {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      handleClickOutside(); // Cleanup on unmount
    };
  }, []);

  // Helper function to create context menus with proper cleanup
  const createSlotContextMenu = (e: React.MouseEvent, employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove existing context menus
    document.querySelectorAll('[data-context-menu]').forEach(menu => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    });

    if (isReadOnly) return;

    const contextMenu = document.createElement('div');
    contextMenu.setAttribute('data-context-menu', 'true');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '6px';
    contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    contextMenu.style.zIndex = '10000';
    contextMenu.style.padding = '4px 0';
    contextMenu.style.fontSize = '14px';
    contextMenu.style.minWidth = '160px';

    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );
    const slotData = isAM ? dayAssignment?.morningSlot : dayAssignment?.afternoonSlot;
    const hasTasks = slotData?.tasks && slotData.tasks.length > 0;

    // Check if slot has a leave - this blocks all task operations
    const hasLeave = hasLeaveInSlot(employee, day, isAM);

    const menuItems = [
      {
        label: '◯⁺ Create Task',
        action: () => onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
        enabled: !hasLeave && (!hasTasks || (slotData?.tasks?.length || 0) < 4)
      },
      {
        label: '⧉ Paste Task',
        action: () => handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId),
        enabled: !hasLeave && hasCopiedTask && (!hasTasks || (slotData?.tasks?.length || 0) < 4)
      }
    ];

    menuItems.forEach(item => {
      if (!item.enabled) return;

      const menuItem = document.createElement('div');
      menuItem.textContent = item.label;
      menuItem.style.padding = '8px 16px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.transition = 'background-color 0.2s';

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f1f5f9';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
      });

      contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);
  };

  // Helper function to create team header context menu
  const createTeamHeaderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove existing context menus
    document.querySelectorAll('[data-context-menu]').forEach(menu => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    });

    if (isReadOnly) return;

    const contextMenu = document.createElement('div');
    contextMenu.setAttribute('data-context-menu', 'true');
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #e5e7eb';
    contextMenu.style.borderRadius = '8px';
    contextMenu.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    contextMenu.style.zIndex = '10000';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.fontSize = '14px';
    contextMenu.style.minWidth = '200px';

    // Header
    const header = document.createElement('div');
    header.textContent = 'Team Management';
    header.style.padding = '8px 16px';
    header.style.fontSize = '0.75rem';
    header.style.fontWeight = '600';
    header.style.color = '#6b7280';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '0.05em';
    header.style.borderBottom = '1px solid #f3f4f6';
    header.style.backgroundColor = '#f9fafb';
    contextMenu.appendChild(header);

    // Get unique structural teams from employees
    const structuralTeams = [...new Set(employees.map(emp => emp.team))].filter(team => team && team !== '');

    const menuItems = [
      {
        label: '📊 View Team Details',
        action: () => {
          // For admin view, show all employees from all structural teams
          const teamName = 'Admin View - All Members';
          const teamId = 1;

          // Show ALL employees (admin can see everyone)
          setSelectedTeam({
            id: teamId,
            name: teamName,
            members: employees
          });
          setShowTeamDetailsModal(true);
        },
        icon: '📊'
      },
      // Add separator
      { label: '─────────────────', action: () => {}, icon: '' },
      {
        label: '🏠 Clear All Filters',
        action: () => {
          if (onTeamFilter) {
            onTeamFilter('clear');
          }
        },
        icon: '🏠'
      },
      // Add separator
      { label: '─────────────────', action: () => {}, icon: '' },
      // Add checkbox options for each structural team
      ...structuralTeams.map(teamName => ({
        label: teamName,
        action: () => {
          if (onTeamFilter) {
            onTeamFilter('toggle', teamName);
          }
        },
        icon: selectedTeamFilters.includes(teamName) ? '☑️' : '☐',
        isCheckbox: true,
        isSelected: selectedTeamFilters.includes(teamName)
      }))
    ];

    menuItems.forEach((item, index) => {
      const menuItem = document.createElement('div');
      menuItem.style.padding = '12px 16px';
      menuItem.style.cursor = 'pointer';
      menuItem.style.transition = 'all 0.2s';
      menuItem.style.display = 'flex';
      menuItem.style.alignItems = 'center';
      menuItem.style.gap = '12px';
      menuItem.style.fontSize = '0.875rem';

      // Handle separator
      if (item.label.includes('─')) {
        menuItem.style.padding = '4px 16px';
        menuItem.style.cursor = 'default';
        menuItem.style.borderBottom = '1px solid #e5e7eb';
        menuItem.style.margin = '4px 0';
        menuItem.textContent = '';
        contextMenu.appendChild(menuItem);
        return;
      }

      // Style for checkbox items vs regular items
      if (item.isCheckbox) {
        menuItem.style.color = item.isSelected ? '#1e40af' : '#374151';
        menuItem.style.backgroundColor = item.isSelected ? '#eff6ff' : 'transparent';
        menuItem.style.fontWeight = item.isSelected ? '600' : '400';
      } else {
        menuItem.style.color = '#374151';
        menuItem.style.backgroundColor = 'transparent';
      }

      // Icon
      const iconSpan = document.createElement('span');
      iconSpan.textContent = item.icon;
      iconSpan.style.fontSize = '1rem';
      iconSpan.style.minWidth = '20px';
      menuItem.appendChild(iconSpan);

      // Label - don't remove emoji for new format
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.isCheckbox ? item.label : (item.label.includes(' ') ? item.label.substring(2) : item.label);
      menuItem.appendChild(labelSpan);

      menuItem.addEventListener('mouseenter', () => {
        if (item.isCheckbox) {
          menuItem.style.backgroundColor = item.isSelected ? '#dbeafe' : '#f3f4f6';
        } else {
          menuItem.style.backgroundColor = '#f9fafb';
        }
      });
      menuItem.addEventListener('mouseleave', () => {
        if (item.isCheckbox) {
          menuItem.style.backgroundColor = item.isSelected ? '#eff6ff' : 'transparent';
        } else {
          menuItem.style.backgroundColor = 'transparent';
        }
      });
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        // Keep menu open for checkbox items to allow multi-selection
        if (!item.isCheckbox && document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
      });

      contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);
  };

  // Debug: Log when the component receives new days data
  // Get next weekday from today (skip weekends)
  const getNextWeekday = (date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    // If it's Saturday (6) or Sunday (0), move to Monday
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  };

  // Check if a date is today (ignoring weekends)
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const todayDay = today.getDay();
    
    // If today is weekend, consider next Monday as "today"
    const effectiveToday = (todayDay === 0 || todayDay === 6) ? getNextWeekday(today) : today;
    
    return date.toDateString() === effectiveToday.toDateString();
  };

  // Format day header text
  const formatDayHeader = (day: CalendarDayDto): string => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    if (isToday(date)) {
      return `${dayName} ${dayNumber} (Today)`;
    }
    return `${dayName} ${dayNumber}`;
  };
  // Helper functions for leave styling
  const hasLeaveInSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean): boolean => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    if (!dayAssignment) return false;

    // Check day-level leave (full day)
    if (dayAssignment.leave?.duration === LeaveDuration.FullDay) {
      return true;
    }

    // Check slot-level leave (half day)
    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    return !!slotData?.leave;
  };

  const getLeaveInfo = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    if (!dayAssignment) return null;

    // Check day-level leave first (full day)
    if (dayAssignment.leave?.duration === LeaveDuration.FullDay) {
      return dayAssignment.leave;
    }

    // Check slot-level leave (half day)
    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    return slotData?.leave || null;
  };

  const isHoliday = (employee: EmployeeCalendarDto, day: CalendarDayDto): boolean => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );
    return !!dayAssignment?.isHoliday;
  };

  // Color palette for task cards
  const getTaskColor = (taskId: number): string => {
    const colors = [
      '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4',
      '#f97316', '#84cc16', '#ec4899', '#6366f1', '#14b8a6'
    ];
    return colors[taskId % colors.length];
  };

  // Get darker border color for task cards
  const getTaskBorderColor = (taskId: number): string => {
    const borderColors = [
      '#b45309', '#047857', '#6d28d9', '#b91c1c', '#0e7490', 
      '#c2410c', '#4d7c0f', '#be185d', '#3730a3', '#0d9488'
    ];
    return borderColors[taskId % borderColors.length];
  };

  // Render leave slot with appropriate styling
  const renderLeaveSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const leaveInfo = getLeaveInfo(employee, day, isAM);
    if (!leaveInfo) return null;

    const backgroundColor = LEAVE_TYPE_COLORS[leaveInfo.leaveType];
    const icon = LEAVE_TYPE_ICONS[leaveInfo.leaveType];
    const label = LEAVE_TYPE_LABELS[leaveInfo.leaveType];
    const isFullDay = leaveInfo.duration === LeaveDuration.FullDay;
    const slotLabel = isFullDay ? 'Full Day' : (isAM ? 'Morning' : 'Afternoon');

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundColor + '20', // 20% opacity for background
          border: `2px solid ${backgroundColor}`,
          borderRadius: '6px',
          color: backgroundColor,
          fontWeight: '600',
          fontSize: '0.75rem',
          padding: '8px',
          margin: '2px',
          minHeight: '56px',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.75rem', lineHeight: '1.1', fontWeight: '600' }}>{label}</div>
          {!isFullDay && (
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>({slotLabel})</div>
          )}
        </div>
      </div>
    );
  };

  // Render holiday slot
  const renderHolidaySlot = (employee: EmployeeCalendarDto, day: CalendarDayDto) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    const holidayName = dayAssignment?.holidayName || 'Bank Holiday';

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2', // Light red background
          border: '2px solid #dc2626', // Red border
          borderRadius: '6px',
          color: '#dc2626',
          fontWeight: '600',
          fontSize: '0.75rem',
          padding: '8px',
          margin: '2px',
          minHeight: '56px',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>🏛️</div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <div style={{ fontSize: '0.75rem', lineHeight: '1.1', fontWeight: '600' }}>{holidayName}</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Bank Holiday</div>
        </div>
      </div>
    );
  };

  // Helper function to check if a slot is selected
  const isSlotSelected = (employeeId: number, date: Date, isAM: boolean): boolean => {
    return selectedSlots?.some(slot =>
      slot.employeeId === employeeId &&
      slot.date.toDateString() === date.toDateString() &&
      ((isAM && slot.slot === Slot.Morning) || (!isAM && slot.slot === Slot.Afternoon))
    ) || false;
  };

  // Helper function to check if a day is selected
  const isDaySelected = (date: Date): boolean => {
    return selectedDays?.includes(date.toDateString()) || false;
  };

  // Handle slot click with Ctrl detection for multi-select
  const handleSlotClick = (e: React.MouseEvent, employeeId: number, date: Date, isAM: boolean) => {
    e.stopPropagation();

    if (isReadOnly) return;

    // Pass the event to onSlotFocus for multi-selection handling
    onSlotFocus?.(date, isAM ? Slot.Morning : Slot.Afternoon, employeeId, e);
  };

  // Handle paste action - check if there are multiple selected slots
  const handlePasteAction = (date: Date, slot: Slot, employeeId: number) => {
    if (selectedSlots && selectedSlots.length > 0) {
      // Use multi-slot paste if there are selected slots
      onTaskPasteMultiple?.();
    } else {
      // Use single-slot paste for individual slot
      onTaskPaste?.(date, slot, employeeId);
    }
  };

  // Render task cards with proper styling and max 4 limit
  const renderTasksInSlot = (employee: EmployeeCalendarDto, day: CalendarDayDto, isAM: boolean) => {
    const dateObj = new Date(day.date);
    const dayAssignment = employee.dayAssignments.find(
      assignment => new Date(assignment.date).toDateString() === dateObj.toDateString()
    );

    // Check for holiday first (takes precedence)
    if (isHoliday(employee, day)) {
      return renderHolidaySlot(employee, day);
    }

    // Check for leave
    if (hasLeaveInSlot(employee, day, isAM)) {
      return renderLeaveSlot(employee, day, isAM);
    }

    if (!dayAssignment) {
      const slotKey = `${employee.employeeId}-${day.date}-${isAM}`;
      const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                       hoveredSlot?.date === day.date &&
                       hoveredSlot?.isAM === isAM;
      const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
            cursor: isReadOnly ? 'default' : 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
            border: isSelected ? '3px solid #3b82f6' : 'none',
            borderRadius: '8px',
            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={(e) => handleSlotClick(e, employee.employeeId, dateObj, isAM)}
          onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
          onMouseEnter={() => !isReadOnly && setHoveredSlot({
            employeeId: employee.employeeId,
            date: day.date,
            isAM: isAM
          })}
          onMouseLeave={() => setHoveredSlot(null)}
          onDragOver={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              addColumnGuides(e.currentTarget);
            }
          }}
          onDragLeave={(e) => {
            if (!isReadOnly) {
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
              removeColumnGuides(e.currentTarget);
            }
          }}
          onDrop={(e) => {
            if (!isReadOnly) {
              handleColumnBasedDrop(e, null, dateObj, isAM, employee);
            }
          }}
        >
          {!isReadOnly ? (isAM ? 'AM' : 'PM') : ''}

          {/* Hover action buttons */}
          {isHovered && !isReadOnly && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              padding: '2px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  lineHeight: '1',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                title="Add task"
              >
                ＋
              </button>
              {hasCopiedTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    lineHeight: '1',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                  title="Paste task"
                >
                  ⧉
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    const slotData = isAM ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
    
    if (!slotData || !slotData.tasks || slotData.tasks.length === 0) {
      const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                       hoveredSlot?.date === day.date &&
                       hoveredSlot?.isAM === isAM;
      const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
            cursor: isReadOnly ? 'default' : 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
            border: isSelected ? '3px solid #3b82f6' : 'none',
            borderRadius: '8px',
            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={(e) => handleSlotClick(e, employee.employeeId, dateObj, isAM)}
          onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
          onMouseEnter={() => !isReadOnly && setHoveredSlot({
            employeeId: employee.employeeId,
            date: day.date,
            isAM: isAM
          })}
          onMouseLeave={() => setHoveredSlot(null)}
          onDragOver={(e) => {
            if (!isReadOnly) {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              addColumnGuides(e.currentTarget);
            }
          }}
          onDragLeave={(e) => {
            if (!isReadOnly) {
              e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
              removeColumnGuides(e.currentTarget);
            }
          }}
          onDrop={(e) => {
            if (!isReadOnly) {
              handleColumnBasedDrop(e, null, dateObj, isAM, employee);
            }
          }}
        >
          {!isReadOnly ? (isAM ? 'AM' : 'PM') : ''}

          {/* Hover action buttons */}
          {isHovered && !isReadOnly && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              padding: '2px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  lineHeight: '1',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                title="Add task"
              >
                ＋
              </button>
              {hasCopiedTask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    lineHeight: '1',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                  title="Paste task"
                >
                  ⧉
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    // Limit to maximum 4 tasks per slot
    const tasksToShow = slotData.tasks.slice(0, 4);
    const hasMoreTasks = slotData.tasks.length > 4;
    const isHovered = hoveredSlot?.employeeId === employee.employeeId &&
                     hoveredSlot?.date === day.date &&
                     hoveredSlot?.isAM === isAM;
    const isSelected = isSlotSelected(employee.employeeId, dateObj, isAM);

    return (
      <div
        style={{
          flex: 1,
          display: 'block', // Changed from 'flex' to support absolute positioning
          padding: '1px',
          height: '100%',
          overflow: 'hidden',
          position: 'relative', // Essential for absolute positioned children
          transition: 'all 0.2s ease-in-out',
          backgroundColor: isSelected ? '#dbeafe' : (isHovered ? '#fafbff' : 'transparent'),
          border: isSelected ? '3px solid #3b82f6' : 'none',
          borderRadius: '4px',
          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
        }}
        onContextMenu={(e) => createSlotContextMenu(e, employee, day, isAM)}
        onMouseEnter={() => !isReadOnly && setHoveredSlot({
          employeeId: employee.employeeId,
          date: day.date,
          isAM: isAM
        })}
        onMouseLeave={() => setHoveredSlot(null)}
        onDragOver={(e) => {
          if (!isReadOnly && !hasLeaveInSlot(employee, day, isAM)) {
            // Prevent drag over for slots with leaves - they should be blocked
            e.preventDefault();
            e.currentTarget.style.backgroundColor = '#f0f9ff';
            addColumnGuides(e.currentTarget);
          }
        }}
        onDragLeave={(e) => {
          if (!isReadOnly) {
            e.currentTarget.style.backgroundColor = isHovered ? '#fafbff' : 'transparent';
            removeColumnGuides(e.currentTarget);
          }
        }}
        onDrop={(e) => {
          if (!isReadOnly) {
            handleColumnBasedDrop(e, slotData, dateObj, isAM, employee);
          }
        }}>
        {/* Auto-reflow tasks to ensure left-aligned positioning */}
        {autoReflowTasks(tasksToShow).map((task, taskIndex) => {
          // Calculate actual hours and column position based on visual layout
          let actualHours = calculateActualHours(task, taskIndex, tasksToShow.length);
          let actualColumnStart = calculateActualColumnStart(task, taskIndex, tasksToShow.length);

          // Use resizing state for visual feedback if this task is being resized
          if (resizingTask && resizingTask.taskId === task.assignmentId) {
            actualHours = resizingTask.currentHours;
            actualColumnStart = resizingTask.currentColumnStart;
          }

          const actualWidth = getTaskWidthPercentage(actualHours);
          const actualLeft = getTaskLeftPercentage(actualColumnStart);

          // Validate bounds to prevent visual cropping
          const boundedWidth = Math.min(actualWidth, 100 - actualLeft);
          const boundedLeft = Math.min(actualLeft, 100);

          const finalWidth = boundedWidth;
          const finalLeft = boundedLeft;

          return (
            <div
              key={task.assignmentId}
              data-task-card="true"
              draggable={!isReadOnly}
              onDragStart={(e) => {
              if (!isReadOnly) {
                const dragData = {
                  type: 'task',
                  task: task,
                  sourceSlot: {
                    date: dateObj,
                    slot: isAM ? Slot.Morning : Slot.Afternoon,
                    employeeId: employee.employeeId
                  }
                };
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));

                // 🎯 CAPTURE SOURCE SLOT DATA IMMEDIATELY ON DRAG START
                if (onDragStart) {
                  const currentSlot = isAM ? Slot.Morning : Slot.Afternoon;
                  // Use tasksToShow which is already available in this scope
                  // Get all tasks EXCEPT the one being dragged
                  const remainingTasks = tasksToShow.filter(t => t.assignmentId !== task.assignmentId);

                  console.log('🚀 DRAG START - Capturing source slot data:', {
                    employeeId: employee.employeeId,
                    date: dateObj.toDateString(),
                    slot: currentSlot,
                    draggedTask: task.assignmentId,
                    totalTasks: tasksToShow.length,
                    remainingTasks: remainingTasks.length,
                    capturedTasks: remainingTasks.map(t => ({id: t.assignmentId, column: t.columnStart, hours: t.hours}))
                  });

                  onDragStart({
                    employeeId: employee.employeeId,
                    date: dateObj,
                    slot: currentSlot,
                    remainingTasks: remainingTasks
                  });
                }
              }
            }}
            onClick={(e) => onTaskClick?.(task, e)}
            onMouseEnter={() => setHoveredTask(task.assignmentId)}
            onMouseLeave={() => setHoveredTask(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation(); // CRITICAL: Prevent slot context menu from also opening

              // Remove existing context menus
              document.querySelectorAll('[data-context-menu]').forEach(menu => {
                if (document.body.contains(menu)) {
                  document.body.removeChild(menu);
                }
              });

              // Show context menu with Edit, Delete, View, Copy options
              const contextMenu = document.createElement('div');
              contextMenu.setAttribute('data-context-menu', 'true');
              contextMenu.style.position = 'fixed';
              contextMenu.style.left = e.clientX + 'px';
              contextMenu.style.top = e.clientY + 'px';
              contextMenu.style.backgroundColor = 'white';
              contextMenu.style.border = '1px solid #ccc';
              contextMenu.style.borderRadius = '6px';
              contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              contextMenu.style.zIndex = '10000';
              contextMenu.style.padding = '4px 0';
              contextMenu.style.fontSize = '14px';
              contextMenu.style.minWidth = '160px';

              // Check if this task is selected and if there are multiple selected tasks
              const isTaskSelected = selectedTaskIds.includes(task.assignmentId);
              const hasMultipleSelected = selectedTaskIds.length > 1;

              let menuItems = [];

              if (isTaskSelected && hasMultipleSelected) {
                // Show bulk operations for multiple selected tasks
                menuItems = [
                  {
                    label: `📝 Edit Task Type (${selectedTaskIds.length})`,
                    action: () => onQuickEditTaskType?.(task),
                    separator: false
                  },
                  {
                    label: `📊 Edit Status (${selectedTaskIds.length})`,
                    action: () => onQuickEditStatus?.(task),
                    separator: false
                  },
                  {
                    label: `🔥 Edit Priority (${selectedTaskIds.length})`,
                    action: () => onQuickEditPriority?.(task),
                    separator: false
                  },
                  {
                    label: `📅 Edit Due Date (${selectedTaskIds.length})`,
                    action: () => onQuickEditDueDate?.(task),
                    separator: false
                  },
                  {
                    label: `📝 Edit Notes (${selectedTaskIds.length})`,
                    action: () => onQuickEditNotes?.(task),
                    separator: true
                  },
                  {
                    label: `✏️ Full Edit (${selectedTaskIds.length})`,
                    action: () => onBulkEdit?.(),
                    separator: false
                  },
                  {
                    label: `🗑️ Delete Selected (${selectedTaskIds.length})`,
                    action: () => onBulkDelete?.(selectedTaskIds),
                    separator: true
                  },
                  {
                    label: 'View/Edit This One',
                    action: () => onTaskView?.(task),
                    separator: false
                  },
                  {
                    label: 'Copy This One',
                    action: () => onTaskCopy?.(task),
                    separator: false
                  }
                ];
              } else {
                // Show individual task operations
                menuItems = [
                  { label: '📝 Edit Task Type', action: () => onQuickEditTaskType?.(task), separator: false },
                  { label: '📊 Edit Status', action: () => onQuickEditStatus?.(task), separator: false },
                  { label: '🔥 Edit Priority', action: () => onQuickEditPriority?.(task), separator: false },
                  { label: '📅 Edit Due Date', action: () => onQuickEditDueDate?.(task), separator: false },
                  { label: '📝 Edit Notes', action: () => onQuickEditNotes?.(task), separator: true },
                  { label: '✏️ View/Edit', action: () => onTaskView?.(task), separator: false },
                  { label: '📋 Copy', action: () => onTaskCopy?.(task), separator: false },
                  { label: '🗑️ Delete', action: () => onTaskDelete?.(task.assignmentId), separator: false }
                ];
              }
              
              menuItems.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.padding = '8px 16px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.transition = 'background-color 0.2s';
                menuItem.onmouseenter = () => menuItem.style.backgroundColor = '#f1f5f9';
                menuItem.onmouseleave = () => menuItem.style.backgroundColor = 'transparent';
                menuItem.onclick = (e) => {
                  e.stopPropagation();
                  item.action();
                  // Use proper cleanup
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                };
                contextMenu.appendChild(menuItem);

                // Add separator if needed
                if (item.separator && index < menuItems.length - 1) {
                  const separator = document.createElement('div');
                  separator.style.height = '1px';
                  separator.style.backgroundColor = '#e5e7eb';
                  separator.style.margin = '4px 0';
                  contextMenu.appendChild(separator);
                }
              });
              
              document.body.appendChild(contextMenu);
              
              // Remove context menu when clicking elsewhere
              const removeMenu = (event: MouseEvent) => {
                if (!contextMenu.contains(event.target as Node)) {
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                  document.removeEventListener('click', removeMenu);
                }
              };
              setTimeout(() => document.addEventListener('click', removeMenu), 0);
            }}
            style={{
              background: (() => {
                const colorScheme = createCardColorScheme(task.clientColor || '#3b82f6');
                const isHovered = hoveredTask === task.assignmentId;
                const adjustedStart = isHovered ? lightenColor(colorScheme.gradient.start, 8) : colorScheme.gradient.start;
                const adjustedEnd = isHovered ? lightenColor(colorScheme.gradient.end, 8) : colorScheme.gradient.end;
                return `linear-gradient(135deg, ${adjustedStart} 0%, ${adjustedEnd} 100%)`;
              })(),
              color: '#ffffff',
              border: resizingTask && resizingTask.taskId === task.assignmentId
                ? '3px dashed #10b981'
                : selectedTaskIds.includes(task.assignmentId)
                  ? '3px solid #3b82f6'
                  : (() => {
                    const colorScheme = createCardColorScheme(task.clientColor || '#3b82f6');
                    return `2px solid ${colorScheme.border}`;
                  })(),
              borderRadius: '12px',
              fontSize: '0.625rem',
              fontWeight: '500',
              cursor: isReadOnly ? 'pointer' : 'grab',
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute', // NEW: Absolute positioning for column system
              top: 0, // NEW: Ensure tasks align at top of container
              width: `${finalWidth}%`, // NEW: Column-based width with bounds checking
              left: `${finalLeft}%`, // NEW: Column-based position with bounds checking
              height: '62px',
              boxShadow: resizingTask && resizingTask.taskId === task.assignmentId
                ? '0 6px 16px rgba(16, 185, 129, 0.4)'
                : selectedTaskIds.includes(task.assignmentId)
                  ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                  : (() => {
                    const colorScheme = createCardColorScheme(task.clientColor || '#3b82f6');
                    const isHovered = hoveredTask === task.assignmentId;
                    const shadowIntensity = isHovered ? '0.25' : '0.15';
                    return `0 4px 16px rgba(0, 0, 0, ${shadowIntensity}), 0 2px 8px ${colorScheme.glass.shadow}40, inset 0 1px 0 ${colorScheme.glass.highlight}60`;
                  })(),
              overflow: 'hidden', // Hidden overflow for clean task appearance
              flexShrink: 0,
              transform: resizingTask && resizingTask.taskId === task.assignmentId
                ? 'scale(1.05)' // Slightly larger during resize
                : selectedTaskIds.includes(task.assignmentId)
                  ? 'scale(1.02)'
                  : hoveredTask === task.assignmentId
                    ? 'scale(1.01)' // Subtle hover scale
                    : 'scale(1)',
              opacity: resizingTask && resizingTask.taskId === task.assignmentId ? 0.9 : 1, // Slight transparency during resize
              transition: resizingTask && resizingTask.taskId === task.assignmentId
                ? 'none' // No transition during resize for immediate feedback
                : 'all 0.2s ease-in-out'
            }}
          >
            {/* Top colored section with project code */}
            <div style={{
              padding: `6px ${tasksToShow.length === 4 ? '4px' : '8px'} 3px ${tasksToShow.length === 4 ? '4px' : '8px'}`, // Responsive padding for small cards
              fontWeight: '700',
              fontSize: '0.75rem',
              textAlign: 'center',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '0.025em',
              color: '#ffffff',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {task.projectName || 'PROJ'}
            </div>
            <div style={{
              fontSize: '0.7rem', // Increased client text size
              opacity: 0.95,
              padding: `0 ${tasksToShow.length === 4 ? '4px' : '8px'} 6px ${tasksToShow.length === 4 ? '4px' : '8px'}`, // Responsive padding for small cards
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: '600',
              color: '#ffffff',
              lineHeight: '1.1',
            }}>
              {(task.clientName === 'Amazon Web Services' ? 'Amazon' : task.clientName) || 'CLIENT'}
            </div>
            
            {/* White bottom section with task type */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#1f2937',
              padding: `4px ${tasksToShow.length === 4 ? '4px' : '8px'} 8px ${tasksToShow.length === 4 ? '4px' : '8px'}`, // Responsive padding + move text UP from bottom
              fontSize: tasksToShow.length === 4 ? '0.52rem' : '0.62rem', // Slightly smaller font
              fontWeight: '700',
              textAlign: 'center',
              borderRadius: '0 0 10px 10px',
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1.2',
              minHeight: '18px',
              maxHeight: '18px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 -1px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {task.taskTypeName || task.taskName || 'Task'}
            </div>

            {/* Hover action icons for individual tasks */}
            {hoveredTask === task.assignmentId && !isReadOnly && (
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(15px)',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '3px',
                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                zIndex: 100
              }}>
                {/* Copy icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskCopy?.(task);
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                  title="Duplicate task"
                >
                  ⧉
                </button>

                {/* Edit icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskEdit?.(task);
                  }}
                  style={{
                    background: 'rgba(107, 114, 128, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(107, 114, 128, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.9)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                  title="Edit task"
                >
                  ✎
                </button>

                {/* Delete icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskDelete?.(task.assignmentId);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Resize Handles - Show on hover for all tasks */}
            {hoveredTask === task.assignmentId && !isReadOnly && (
              <>
                {/* Left resize handle - only if can resize left */}
                {canResizeTask(task, 'left', tasksToShow) && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-2px',
                      top: 0,
                      width: '6px',
                      height: '100%',
                      cursor: 'ew-resize',
                      backgroundColor: hoveredResizeHandle?.taskId === task.assignmentId && hoveredResizeHandle?.side === 'left'
                        ? '#3b82f6' : 'rgba(59, 130, 246, 0.6)',
                      borderRadius: '2px 0 0 2px',
                      opacity: hoveredResizeHandle?.taskId === task.assignmentId && hoveredResizeHandle?.side === 'left' ? 1 : 0.8,
                      transition: 'all 0.2s ease-in-out',
                      zIndex: 110
                    }}
                    onMouseEnter={() => setHoveredResizeHandle({ taskId: task.assignmentId, side: 'left' })}
                    onMouseLeave={() => setHoveredResizeHandle(null)}
                    onMouseDown={(e) => handleResizeStart(e, task, 'left', employee.employeeId, dateObj, isAM ? Slot.Morning : Slot.Afternoon)}
                    title={`Resize task from left edge (Current: ${actualHours}h)`}
                  />
                )}

                {/* Right resize handle - only if can resize right */}
                {canResizeTask(task, 'right', tasksToShow) && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-2px',
                      top: 0,
                      width: '6px',
                      height: '100%',
                      cursor: 'ew-resize',
                      backgroundColor: hoveredResizeHandle?.taskId === task.assignmentId && hoveredResizeHandle?.side === 'right'
                        ? '#3b82f6' : 'rgba(59, 130, 246, 0.6)',
                      borderRadius: '0 2px 2px 0',
                      opacity: hoveredResizeHandle?.taskId === task.assignmentId && hoveredResizeHandle?.side === 'right' ? 1 : 0.8,
                      transition: 'all 0.2s ease-in-out',
                      zIndex: 110
                    }}
                    onMouseEnter={() => setHoveredResizeHandle({ taskId: task.assignmentId, side: 'right' })}
                    onMouseLeave={() => setHoveredResizeHandle(null)}
                    onMouseDown={(e) => handleResizeStart(e, task, 'right', employee.employeeId, dateObj, isAM ? Slot.Morning : Slot.Afternoon)}
                    title={`Resize task from right edge (Current: ${actualHours}h)`}
                  />
                )}
              </>
            )}
          </div>
        );
        })}

        {hasMoreTasks && (
          <div style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            fontWeight: '500',
            padding: '2px 4px',
            alignSelf: 'center'
          }}>
            +{slotData.tasks.length - 4} more
          </div>
        )}

        {/* Hover action buttons for slots with tasks */}
        {isHovered && !isReadOnly && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            padding: '2px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}>
            {!hasLeaveInSlot(employee, day, isAM) && slotData.tasks.length < 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotClick?.(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  lineHeight: '1',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                title="Add new task"
              >
                ＋
              </button>
            )}
            {!hasLeaveInSlot(employee, day, isAM) && hasCopiedTask && slotData.tasks.length < 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePasteAction(dateObj, isAM ? Slot.Morning : Slot.Afternoon, employee.employeeId);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                title="Paste task"
              >
                ⧉
              </button>
            )}
          </div>
        )}

        {/* 4-Column Visual Grid - Background only, no interaction */}
        {!isReadOnly && (
          <>
            {/* Subtle column dividers - always visible */}
            {[1, 2, 3].map(col => (
              <div
                key={`divider-${col}`}
                style={{
                  position: 'absolute',
                  left: `${col * 25}%`,
                  width: '1px',
                  height: '100%',
                  top: 0,
                  backgroundColor: 'rgba(200, 200, 200, 0.2)',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />
            ))}

            {/* Column hover zones - only for EMPTY slots */}
            {tasksToShow.length === 0 && [0, 1, 2, 3].map(col => (
              <div
                key={`hover-${col}`}
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
                onMouseEnter={() => setHoveredColumn({
                  employeeId: employee.employeeId,
                  date: day.date,
                  isAM: isAM,
                  column: col
                })}
                onMouseLeave={() => setHoveredColumn(null)}
                onClick={() => {
                  console.log(`🎯 Clicked column ${col + 1}/4 in empty slot ${employee.employeeName} ${day.date} ${isAM ? 'AM' : 'PM'}`);
                  console.log(`Column ${col + 1} represents hour ${col + 1} of this time slot`);
                  // TODO: Handle column click for task creation with specific hour positioning
                }}
              />
            ))}

            {/* Hover indicator for columns - only show for empty slots */}
            {tasksToShow.length === 0 && hoveredColumn?.employeeId === employee.employeeId &&
             hoveredColumn?.date === day.date &&
             hoveredColumn?.isAM === isAM && (
              <div
                style={{
                  position: 'absolute',
                  left: `${hoveredColumn.column * 25}%`,
                  width: '25%',
                  height: '100%',
                  top: 0,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  border: '2px dashed #3b82f6',
                  borderRadius: '8px',
                  pointerEvents: 'none',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#3b82f6'
                }}
              >
                H{hoveredColumn.column + 1}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getMainContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  });

  const getHeaderStyle = (): React.CSSProperties => ({
    display: 'flex',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    width: '100%',
    minWidth: '100%',
  });

  const getTeamHeaderStyle = (): React.CSSProperties => ({
    width: '120px',
    minWidth: '120px',
    padding: '12px 8px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#f1f5f9',
  });

  const getAmPmHeaderStyle = (): React.CSSProperties => ({
    width: '60px',
    minWidth: '60px',
    padding: '12px 8px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  });

  const getDayHeaderStyle = (day: CalendarDayDto): React.CSSProperties => {
    const isTodayDate = isToday(new Date(day.date));
    const isSelected = isDaySelected(new Date(day.date));
    // Dynamic column width: 250px for ≤5 days (weekly), 125px for >5 days (biweekly)
    const dynamicMinWidth = days.length <= 5 ? '250px' : '125px';

    return {
      flex: '1 1 0',
      minWidth: dynamicMinWidth,
      maxWidth: 'none',
      padding: '12px 8px',
      fontSize: '1rem',
      fontWeight: '700',
      color: isSelected ? '#ffffff' : (isTodayDate ? '#1d4ed8' : '#374151'),
      textAlign: 'center',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: isSelected
        ? '#3b82f6'
        : (isTodayDate ? '#dbeafe' : '#f1f5f9'),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50px',
      cursor: isReadOnly ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
      border: isSelected ? '2px solid #1d4ed8' : 'none',
      boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    };
  };

  const getContentStyle = (): React.CSSProperties => ({
    display: 'flex',
    flex: 1,
    overflow: 'auto',
    width: '100%',
    minWidth: '100%',
    transition: 'opacity 0.2s ease-in-out',
    opacity: 1,
  });

  const getEmployeeRowStyle = (): React.CSSProperties => ({
    display: 'flex',
    height: '130px',
    borderBottom: '1px solid #e5e7eb',
    overflow: 'hidden'
  });

  const getEmployeeCellStyle = (): React.CSSProperties => ({
    width: '120px',
    minWidth: '120px',
    borderRight: '2px solid #e5e7eb',
  });

  const getAmPmCellStyle = (): React.CSSProperties => ({
    width: '60px',
    minWidth: '60px',
    borderRight: '2px solid #e5e7eb',
    backgroundColor: '#1e40af',
    display: 'flex',
    flexDirection: 'column',
  });

  const getAmPmLabelStyle = (isAM: boolean = false): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderBottom: '1px solid #1d4ed8',
    backgroundColor: isAM ? '#60a5fa' : '#1e40af',
  });

  const getDayCellStyle = (): React.CSSProperties => {
    // Dynamic column width: 250px for ≤5 days (weekly), 125px for >5 days (biweekly)
    const dynamicMinWidth = days.length <= 5 ? '250px' : '125px';
    return {
      flex: '1 1 0',
      minWidth: dynamicMinWidth,
      maxWidth: 'none',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
    };
  };

  const getTimeSlotStyle = (isAM: boolean): React.CSSProperties => ({
    height: '65px',
    backgroundColor: isAM ? '#ffffff' : '#e6f3ff',
    borderBottom: isAM ? '1px solid #e5e7eb' : 'none',
    display: 'flex',
    position: 'relative',
    overflow: 'hidden'
  });

  return (
    <div style={getMainContainerStyle()}>
      {/* Header Row */}
      <div style={getHeaderStyle()}>
        <div
          style={{
            ...getTeamHeaderStyle(),
            cursor: isReadOnly ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: teamHeaderHovered ? '#e2e8f0' : '#f1f5f9',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={() => !isReadOnly && setTeamHeaderHovered(true)}
          onMouseLeave={() => setTeamHeaderHovered(false)}
          onContextMenu={createTeamHeaderContextMenu}
          title={isReadOnly ? 'Team' : 'Right-click for team management options'}
        >
          <span>Team</span>
          {selectedTeamFilters.length > 0 && (
            <div style={{
              fontSize: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              marginLeft: '6px'
            }}>
              {selectedTeamFilters.length}
            </div>
          )}
          {!isReadOnly && (
            <div style={{
              fontSize: '0.6875rem',
              color: '#9ca3af',
              marginLeft: 'auto',
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: teamHeaderHovered ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }}>
              ⋯
            </div>
          )}
        </div>
        <div style={getAmPmHeaderStyle()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>
        </div>
        {days.map((day) => (
          <div
            key={day.date}
            style={getDayHeaderStyle(day)}
            data-day-header="true"
            onClick={(e) => {
              if (!isReadOnly) {
                console.log('Day header clicked:', day.date, 'Ctrl:', e.ctrlKey);
                onDayClick?.(new Date(day.date), e);
              }
            }}
            onMouseEnter={(e) => {
              if (!isReadOnly) {
                const isTodayDate = isToday(new Date(day.date));
                const isSelected = isDaySelected(new Date(day.date));
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isTodayDate ? '#bfdbfe' : '#e2e8f0';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!isReadOnly) {
                const isTodayDate = isToday(new Date(day.date));
                const isSelected = isDaySelected(new Date(day.date));
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isTodayDate ? '#dbeafe' : '#f1f5f9';
                }
              }
            }}
            onContextMenu={(e) => {
              if (isReadOnly) return;
              e.preventDefault();

              // Remove existing context menus
              document.querySelectorAll('[data-context-menu]').forEach(menu => {
                if (document.body.contains(menu)) {
                  document.body.removeChild(menu);
                }
              });

              const contextMenu = document.createElement('div');
              contextMenu.setAttribute('data-context-menu', 'true');
              contextMenu.style.position = 'fixed';
              contextMenu.style.left = e.clientX + 'px';
              contextMenu.style.top = e.clientY + 'px';
              contextMenu.style.backgroundColor = 'white';
              contextMenu.style.border = '1px solid #ccc';
              contextMenu.style.borderRadius = '6px';
              contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              contextMenu.style.zIndex = '10000';
              contextMenu.style.padding = '4px 0';
              contextMenu.style.fontSize = '14px';
              contextMenu.style.minWidth = '180px';

              const dayDate = new Date(day.date);

              // Check if there are any blocking items on this day
              const hasBlocking = employees.some(emp => {
                const dayAssignment = emp.dayAssignments.find(assignment =>
                  new Date(assignment.date).toDateString() === dayDate.toDateString()
                );
                return dayAssignment?.isHoliday ||
                       dayAssignment?.leave ||
                       dayAssignment?.morningSlot?.leave ||
                       dayAssignment?.afternoonSlot?.leave;
              });

              // Check if this day is selected and determine count for context menu
              const isDayCurrentlySelected = isDaySelected(dayDate);
              let daysCount = 1; // Default to 1 (just this day)

              if (selectedDays && selectedDays.length > 0) {
                if (isDayCurrentlySelected) {
                  // This day is part of selection - show count for all selected days
                  daysCount = selectedDays.length;
                } else {
                  // This day is NOT in selection - will only process this day
                  daysCount = 1;
                }
              }

              const menuItems = [
                {
                  label: `📊 View Day Details`,
                  action: () => onDayViewDetails?.(dayDate, day),
                  description: 'View comprehensive statistics and breakdown for this day'
                },
                {
                  label: `🏦 Set Bank Holiday${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onSetBankHoliday?.(dayDate),
                  description: daysCount > 1
                    ? `Block all slots for all team members on ${daysCount} selected days`
                    : 'Block all slots for all team members on this day'
                },
                {
                  label: `✈️ Set Leave${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onSetLeave?.(dayDate),
                  description: daysCount > 1
                    ? `Set leave for specific team members on ${daysCount} selected days`
                    : 'Set leave for specific team members'
                },
                ...(hasBlocking ? [{
                  label: `🧹 Clear Blocking${daysCount > 1 ? ` (${daysCount})` : ''}`,
                  action: () => onClearBlocking?.(dayDate),
                  description: daysCount > 1
                    ? `Remove all leave and holidays from ${daysCount} selected days`
                    : 'Remove all leave and holidays from this day'
                }] : [])
              ];

              menuItems.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.padding = '8px 16px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.borderBottom = index < menuItems.length - 1 ? '1px solid #eee' : 'none';
                menuItem.style.whiteSpace = 'nowrap';

                // Add hover effects
                menuItem.onmouseenter = () => {
                  menuItem.style.backgroundColor = '#f5f5f5';
                };
                menuItem.onmouseleave = () => {
                  menuItem.style.backgroundColor = 'white';
                };

                menuItem.onclick = () => {
                  item.action();
                  document.body.removeChild(contextMenu);
                };

                // Add tooltip on hover
                menuItem.title = item.description;

                contextMenu.appendChild(menuItem);
              });

              document.body.appendChild(contextMenu);

              // Remove context menu when clicking elsewhere
              const removeMenu = (event: MouseEvent) => {
                if (!contextMenu.contains(event.target as Node)) {
                  if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                  }
                  document.removeEventListener('click', removeMenu);
                }
              };
              setTimeout(() => document.addEventListener('click', removeMenu), 0);
            }}
          >
            {formatDayHeader(day)}
          </div>
        ))}
      </div>

      {/* Content Rows */}
      <div style={getContentStyle()}>
        <div style={{ flex: 1, width: '100%', minWidth: '100%' }}>
          {employees.map((employee) => (
            <div key={employee.employeeId} style={getEmployeeRowStyle()}>
              {/* Employee Info */}
              <div style={getEmployeeCellStyle()}>
                <SimplifiedEmployeeRow
                  employee={employee}
                  onEmployeeView={onEmployeeView}
                  onEmployeeEdit={onEmployeeEdit}
                  onEmployeeDelete={onEmployeeDelete}
                />
              </div>

              {/* AM/PM Labels */}
              <div style={getAmPmCellStyle()}>
                <div style={getAmPmLabelStyle(true)}>AM</div>
                <div style={getAmPmLabelStyle(false)}>PM</div>
              </div>

              {/* Day Columns */}
              {days.map((day) => (
                <div key={day.date} style={getDayCellStyle()}>
                  {/* AM Slot */}
                  <div style={getTimeSlotStyle(true)}>
                    {renderTasksInSlot(employee, day, true)}
                  </div>
                  
                  {/* PM Slot */}
                  <div style={getTimeSlotStyle(false)}>
                    {renderTasksInSlot(employee, day, false)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          isOpen={showTeamDetailsModal}
          onClose={() => {
            setShowTeamDetailsModal(false);
            setSelectedTeam(null);
          }}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          teamMembers={selectedTeam.members}
        />
      )}
    </div>
  );
};

export default DayBasedCalendarGrid;