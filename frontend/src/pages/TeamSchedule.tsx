import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '../components/layout/AppHeader';
import DayBasedCalendarGrid from '../components/calendar/DayBasedCalendarGrid';
import TaskCreationModal from '../components/calendar/TaskCreationModal';
import TaskDetailsModal from '../components/calendar/TaskDetailsModal';
import SetLeaveModal from '../components/calendar/SetLeaveModal';
import BulkEditModal, { BulkEditData } from '../components/calendar/BulkEditModal';
import QuickEditTaskType from '../components/calendar/QuickEditTaskType';
import QuickEditStatus from '../components/calendar/QuickEditStatus';
import QuickEditPriority from '../components/calendar/QuickEditPriority';
import QuickEditDueDate from '../components/calendar/QuickEditDueDate';
import QuickEditNotes from '../components/calendar/QuickEditNotes';
import ConfirmationDialog from '../components/calendar/ConfirmationDialog';
import NotificationManager from '../components/common/NotificationManager';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { TeamViewMode } from '../components/calendar/TeamToggle';
import {
  CalendarViewType,
  CalendarViewDto,
  AssignmentTaskDto,
  Slot,
  ScheduleRequestDto,
  CreateAssignmentDto,
  BulkUpdateAssignmentDto,
  LeaveType,
  LeaveDuration,
  TaskPriority,
  TaskStatus,
  TaskType
} from '../types/schedule';
import { DragItem } from '../types/dragDrop';
import teamService, { TeamInfo } from '../services/teamService';
import scheduleService from '../services/scheduleService';

// Mock user context (in real app, this would come from auth context)
interface UserContext {
  id: number;
  role: string;
  name: string;
}

// Leave data persistence helpers
interface StoredLeaveData {
  employeeId: number;
  date: string; // YYYY-MM-DD format
  leaveType?: LeaveType;
  duration?: LeaveDuration;
  slot?: Slot;
  isHoliday?: boolean;
  holidayName?: string;
}

const saveLeaveDataToStorage = (leaveData: StoredLeaveData[]) => {
  localStorage.setItem('persistentLeaveData', JSON.stringify(leaveData));
  console.log('💾 Saved leave data to localStorage:', leaveData);
};

const loadLeaveDataFromStorage = (): StoredLeaveData[] => {
  const stored = localStorage.getItem('persistentLeaveData');
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    console.log('📂 Loaded leave data from localStorage:', parsed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing stored leave data:', error);
    return [];
  }
};

const addLeaveToStorage = (employeeId: number, date: Date, leaveType: LeaveType, duration: LeaveDuration, slot?: Slot) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const existing = loadLeaveDataFromStorage();

  // Remove any existing leave for this employee on this date
  const filtered = existing.filter(item =>
    !(item.employeeId === employeeId && item.date === dateStr)
  );

  // Add new leave data
  filtered.push({
    employeeId,
    date: dateStr,
    leaveType,
    duration,
    slot
  });

  saveLeaveDataToStorage(filtered);
};

const addHolidayToStorage = (date: Date, holidayName: string = 'Bank Holiday') => {
  const dateStr = date.toISOString().split('T')[0];
  const existing = loadLeaveDataFromStorage();

  // Remove any existing data for this date (holiday affects all employees)
  const filtered = existing.filter(item => item.date !== dateStr);

  // Add holiday for all employees (we'll need to get employee list)
  // For now, we'll add a special holiday marker and merge it properly later
  filtered.push({
    employeeId: -1, // Special marker for holidays
    date: dateStr,
    isHoliday: true,
    holidayName
  });

  saveLeaveDataToStorage(filtered);
};

const removeLeaveFromStorage = (date: Date, employeeId?: number) => {
  const dateStr = date.toISOString().split('T')[0];
  const existing = loadLeaveDataFromStorage();

  let filtered;
  if (employeeId) {
    // Remove leave for specific employee
    filtered = existing.filter(item =>
      !(item.employeeId === employeeId && item.date === dateStr)
    );
  } else {
    // Remove all leave/holiday data for this date
    filtered = existing.filter(item => item.date !== dateStr);
  }

  saveLeaveDataToStorage(filtered);
};

const mergeStoredLeaveData = (calendarData: CalendarViewDto): CalendarViewDto => {
  const storedLeaves = loadLeaveDataFromStorage();
  if (storedLeaves.length === 0) return calendarData;

  console.log('🔄 Merging stored leave data into calendar data');

  const updatedData = { ...calendarData };
  updatedData.employees = calendarData.employees.map(employee => {
    return {
      ...employee,
      dayAssignments: employee.dayAssignments.map(dayAssignment => {
        const dayDate = dayAssignment.date;
        const dayDateObj = new Date(dayDate);
        const dayDateStr = dayDateObj.toISOString().split('T')[0];

        // Find stored leave data for this employee and date
        const employeeLeave = storedLeaves.find(leave =>
          leave.employeeId === employee.employeeId && leave.date === dayDateStr
        );

        // Find holiday data for this date
        const holidayData = storedLeaves.find(leave =>
          leave.employeeId === -1 && leave.date === dayDateStr && leave.isHoliday
        );

        if (holidayData) {
          // Apply holiday to this day
          return {
            ...dayAssignment,
            isHoliday: true,
            holidayName: holidayData.holidayName,
            leave: undefined,
            morningSlot: dayAssignment.morningSlot ? {
              ...dayAssignment.morningSlot,
              leave: undefined,
              tasks: [] // Clear tasks on holidays
            } : undefined,
            afternoonSlot: dayAssignment.afternoonSlot ? {
              ...dayAssignment.afternoonSlot,
              leave: undefined,
              tasks: [] // Clear tasks on holidays
            } : undefined
          };
        }

        if (employeeLeave && !employeeLeave.isHoliday) {
          // Apply individual leave
          const leaveInfo = {
            leaveType: employeeLeave.leaveType!,
            duration: employeeLeave.duration!,
            slot: employeeLeave.slot,
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            startDate: dayAssignment.date
          };

          if (employeeLeave.duration === LeaveDuration.FullDay) {
            // Full day leave
            return {
              ...dayAssignment,
              leave: leaveInfo,
              morningSlot: dayAssignment.morningSlot ? {
                ...dayAssignment.morningSlot,
                tasks: [],
                leave: undefined
              } : undefined,
              afternoonSlot: dayAssignment.afternoonSlot ? {
                ...dayAssignment.afternoonSlot,
                tasks: [],
                leave: undefined
              } : undefined
            };
          } else {
            // Half day leave
            const isAM = employeeLeave.slot === Slot.Morning;

            return {
              ...dayAssignment,
              leave: undefined,
              morningSlot: isAM ? {
                slot: Slot.Morning,
                tasks: [],
                availableCapacity: 0,
                isOverbooked: false,
                leave: leaveInfo
              } : (dayAssignment.morningSlot || {
                slot: Slot.Morning,
                tasks: [],
                availableCapacity: 0,
                isOverbooked: false
              }),
              afternoonSlot: !isAM ? {
                slot: Slot.Afternoon,
                tasks: [],
                availableCapacity: 0,
                isOverbooked: false,
                leave: leaveInfo
              } : (dayAssignment.afternoonSlot || {
                slot: Slot.Afternoon,
                tasks: [],
                availableCapacity: 0,
                isOverbooked: false
              })
            };
          }
        }

        return dayAssignment;
      })
    };
  });

  return updatedData;
};

// Mock leave data function to test visual styling
const addMockLeaveData = (data: CalendarViewDto): CalendarViewDto => {
  if (!data.employees || data.employees.length === 0 || !data.days || data.days.length === 0) {
    return data;
  }

  const mockData = JSON.parse(JSON.stringify(data)); // Deep copy

  // Add some mock leave data for testing
  if (mockData.employees.length > 0 && mockData.days.length > 1) {
    // First employee - Annual Leave (full day) on second day
    const firstEmployee = mockData.employees[0];
    const secondDay = mockData.days[1];

    if (firstEmployee.dayAssignments) {
      const dayAssignment = firstEmployee.dayAssignments.find(
        (assignment: any) => assignment.date === secondDay.date
      );

      if (dayAssignment) {
        dayAssignment.leave = {
          leaveType: LeaveType.AnnualLeave,
          duration: LeaveDuration.FullDay,
          employeeId: firstEmployee.employeeId,
          employeeName: firstEmployee.employeeName,
          startDate: secondDay.date
        };
      }
    }

    // Second employee - Sick Day (morning only) on third day (if exists)
    if (mockData.employees.length > 1 && mockData.days.length > 2) {
      const secondEmployee = mockData.employees[1];
      const thirdDay = mockData.days[2];

      const dayAssignment = secondEmployee.dayAssignments?.find(
        (assignment: any) => assignment.date === thirdDay.date
      );

      if (dayAssignment && dayAssignment.morningSlot) {
        dayAssignment.morningSlot.leave = {
          leaveType: LeaveType.SickDay,
          duration: LeaveDuration.HalfDay,
          slot: Slot.Morning,
          employeeId: secondEmployee.employeeId,
          employeeName: secondEmployee.employeeName,
          startDate: thirdDay.date
        };
      }
    }

    // Third employee - Training (afternoon only) on first day (if exists)
    if (mockData.employees.length > 2) {
      const thirdEmployee = mockData.employees[2];
      const firstDay = mockData.days[0];

      const dayAssignment = thirdEmployee.dayAssignments?.find(
        (assignment: any) => assignment.date === firstDay.date
      );

      if (dayAssignment && dayAssignment.afternoonSlot) {
        dayAssignment.afternoonSlot.leave = {
          leaveType: LeaveType.Training,
          duration: LeaveDuration.HalfDay,
          slot: Slot.Afternoon,
          employeeId: thirdEmployee.employeeId,
          employeeName: thirdEmployee.employeeName,
          startDate: firstDay.date
        };
      }
    }

    // Add a bank holiday on the last day for all employees
    if (mockData.days.length > 3) {
      const lastDay = mockData.days[mockData.days.length - 1];

      mockData.employees.forEach((employee: any) => {
        const dayAssignment = employee.dayAssignments?.find(
          (assignment: any) => assignment.date === lastDay.date
        );

        if (dayAssignment) {
          dayAssignment.isHoliday = true;
          dayAssignment.holidayName = 'Test Bank Holiday';
        }
      });
    }
  }

  return mockData;
};

const TeamScheduleContent: React.FC<{ showNotification: (notification: any) => void }> = ({ showNotification }) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [windowStartDate, setWindowStartDate] = useState(new Date()); // Track window start for day navigation
  const [lastNavigatedDate, setLastNavigatedDate] = useState<Date | null>(null); // Track navigation direction
  const [viewType, setViewType] = useState(CalendarViewType.Week);
  const [teamViewMode, setTeamViewMode] = useState(TeamViewMode.MyTeam);
  const [calendarData, setCalendarData] = useState<CalendarViewDto | undefined>();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Task creation modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalData, setTaskModalData] = useState<{
    date: Date;
    slot: Slot;
    employeeId: number;
    employeeName: string;
  } | null>(null);

  // Task details modal state
  const [taskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<AssignmentTaskDto[]>([]);
  const [taskDetailsMode, setTaskDetailsMode] = useState<'view' | 'edit'>('view');
  const [slotTasks, setSlotTasks] = useState<AssignmentTaskDto[]>([]);

  // Add debugging to track when selectedTasks changes
  useEffect(() => {
    console.log('🔍 selectedTasks changed:', selectedTasks.map(t => t.assignmentId));
  }, [selectedTasks]);

  // Clipboard state for copy/paste functionality
  const [copiedTask, setCopiedTask] = useState<AssignmentTaskDto | null>(null);

  // Selected slots state for multi-selection and keyboard shortcuts (updated)
  const [selectedSlots, setSelectedSlots] = useState<Array<{
    date: Date;
    slot: Slot;
    employeeId: number;
  }>>([]);

  // Helper to check if a slot is selected
  const isSlotSelected = useCallback((date: Date, slot: Slot, employeeId: number): boolean => {
    return selectedSlots.some(selected =>
      selected.date.toDateString() === date.toDateString() &&
      selected.slot === slot &&
      selected.employeeId === employeeId
    );
  }, [selectedSlots]);

  // Helper to check if a task is selected
  const isTaskSelected = useCallback((taskId: number): boolean => {
    return selectedTasks.some(task => task.assignmentId === taskId);
  }, [selectedTasks]);

  // Helper to toggle task selection
  const toggleTaskSelection = useCallback((task: AssignmentTaskDto, ctrlKey: boolean = false) => {
    if (ctrlKey) {
      // Multi-selection with Ctrl
      setSelectedTasks(prev => {
        const isCurrentlySelected = prev.some(t => t.assignmentId === task.assignmentId);
        if (isCurrentlySelected) {
          // Remove from selection
          return prev.filter(t => t.assignmentId !== task.assignmentId);
        } else {
          // Add to selection
          return [...prev, task];
        }
      });
    } else {
      // Single selection without Ctrl
      setSelectedTasks(prev => {
        const isCurrentlySelected = prev.some(t => t.assignmentId === task.assignmentId);
        if (isCurrentlySelected && prev.length === 1) {
          // Deselect if it's the only selected task
          return [];
        } else {
          // Select only this task
          return [task];
        }
      });
    }
  }, []);

  // Helper to toggle slot selection
  const toggleSlotSelection = useCallback((date: Date, slot: Slot, employeeId: number, isCtrlPressed: boolean = false) => {
    const slotKey = { date, slot, employeeId };
    const isCurrentlySelected = isSlotSelected(date, slot, employeeId);

    if (isCtrlPressed) {
      // Multi-selection with Ctrl
      if (isCurrentlySelected) {
        // Remove from selection
        setSelectedSlots(prev => prev.filter(selected =>
          !(selected.date.toDateString() === date.toDateString() &&
            selected.slot === slot &&
            selected.employeeId === employeeId)
        ));
      } else {
        // Add to selection
        setSelectedSlots(prev => [...prev, slotKey]);
      }
    } else {
      // Single selection (clear others)
      if (isCurrentlySelected && selectedSlots.length === 1) {
        // If only one slot selected and it's this one, deselect
        setSelectedSlots([]);
      } else {
        // Select only this slot
        setSelectedSlots([slotKey]);
      }
    }
  }, [selectedSlots, isSlotSelected]);

  // Set Leave modal state
  const [setLeaveModalOpen, setSetLeaveModalOpen] = useState(false);
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<Date | null>(null);

  // Bulk Edit modal state
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

  // Quick Edit modals state
  const [quickEditTaskTypeOpen, setQuickEditTaskTypeOpen] = useState(false);
  const [quickEditStatusOpen, setQuickEditStatusOpen] = useState(false);
  const [quickEditPriorityOpen, setQuickEditPriorityOpen] = useState(false);
  const [quickEditDueDateOpen, setQuickEditDueDateOpen] = useState(false);
  const [quickEditNotesOpen, setQuickEditNotesOpen] = useState(false);
  const [currentQuickEditTask, setCurrentQuickEditTask] = useState<AssignmentTaskDto | null>(null);

  // Captured tasks for quick edit (to preserve selection when modal opens)
  const [capturedQuickEditTasks, setCapturedQuickEditTasks] = useState<AssignmentTaskDto[]>([]);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Mock user context
  const [userContext] = useState<UserContext>({
    id: 1,
    role: 'Manager', // or 'Admin', 'TeamMember'
    name: 'John Manager'
  });

  // Navigation and user menu handlers
  const handleNavigation = (page: string) => {
    console.log('Navigate to:', page);
    // TODO: Implement navigation logic
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleProfile = () => {
    console.log('Open profile');
    // TODO: Implement profile functionality
  };

  const handleSettings = () => {
    console.log('Open settings');
    // TODO: Implement settings functionality
  };

  const handleLogout = () => {
    console.log('Logout');
    // TODO: Implement logout functionality
  };

  // Derived state
  const managedTeam = teams.find(team => team.isManaged);
  const managedTeamId = managedTeam?.id;
  const currentTeamName = managedTeam?.name;

  /**
   * Get all tasks in the same slot as the given task
   */
  const getSlotTasks = useCallback((task: AssignmentTaskDto): AssignmentTaskDto[] => {
    if (!calendarData) return [];
    
    const targetEmployee = calendarData.employees.find(emp => emp.employeeId === task.employeeId);
    if (!targetEmployee) return [];
    
    const targetDate = new Date(task.assignedDate).toDateString();
    const targetDayAssignment = targetEmployee.dayAssignments.find(day => 
      new Date(day.date).toDateString() === targetDate
    );
    
    if (!targetDayAssignment) return [];
    
    const slotKey = task.slot === 1 ? 'morningSlot' : 'afternoonSlot';
    const slot = targetDayAssignment[slotKey];
    
    return slot?.tasks || [];
  }, [calendarData]);

  /**
   * Load teams based on user role and permissions
   */
  const loadTeams = useCallback(async () => {
    try {
      setError(null);
      
      if (userContext.role === 'Manager' || userContext.role === 'Admin') {
        const allTeams = await teamService.getAllTeamsWithManagedStatus();
        setTeams(allTeams);
      } else {
        // For regular team members, we might load just their team
        setTeams([]);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError('Failed to load team information');
      setTeams([]);
    }
  }, [userContext.role]);

  /**
   * Load calendar data based on current view mode and parameters
   */
  const loadCalendarData = useCallback(async (teamId?: number, mode?: TeamViewMode) => {
    try {
      setIsLoading(true);
      setError(null);

      const request: ScheduleRequestDto = {
        startDate: windowStartDate, // Use window start instead of current date
        viewType: viewType,
        includeInactive: false
      };

      console.log('🔍 loadCalendarData: Sending request with windowStartDate:', windowStartDate);
      console.log('🔍 loadCalendarData: Request viewType:', viewType);

      let data: CalendarViewDto;

      const currentMode = mode || teamViewMode;

      if (currentMode === TeamViewMode.MyTeam && teamId) {
        // Load specific team data
        request.teamId = teamId;
        data = await teamService.getTeamCalendarView(teamId, request);
      } else if (currentMode === TeamViewMode.AllTeams) {
        // Load global view with all teams
        const globalView = await teamService.getGlobalCalendarView(request);
        data = teamService.transformGlobalViewToCalendarData(globalView);
      } else {
        // Fallback to regular calendar view
        data = await scheduleService.getCalendarView(request);
      }

      console.log('🔍 loadCalendarData: Received calendar data:', data);
      console.log('🔍 loadCalendarData: Days in response:', data.days?.map(d => ({ date: d.date, dayName: d.dayName, displayDate: d.displayDate })));

      // Always merge stored leave data (this persists through navigation and refresh!)
      const dataWithStoredLeaves = mergeStoredLeaveData(data);

      // Only add mock data in development and if no real leave data exists
      const shouldAddMockData = process.env.NODE_ENV === 'development' && !localStorage.getItem('hasUserCreatedLeave') && loadLeaveDataFromStorage().length === 0;
      const finalData = shouldAddMockData ? addMockLeaveData(dataWithStoredLeaves) : dataWithStoredLeaves;

      console.log('🔍 loadCalendarData: Final data with persistent leaves:', finalData);
      setCalendarData(finalData);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load schedule data');
      setCalendarData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [windowStartDate, viewType, teamViewMode]); // Changed dependency from currentDate to windowStartDate

  /**
   * Handle team view mode changes
   */
  const handleTeamViewChange = useCallback((mode: TeamViewMode) => {
    setTeamViewMode(mode);
    loadCalendarData(
      mode === TeamViewMode.MyTeam ? managedTeamId : undefined, 
      mode
    );
  }, [loadCalendarData, managedTeamId]);

  /**
   * Handle data fetching requests
   */
  const handleFetchTeamData = useCallback((teamId?: number, mode?: TeamViewMode) => {
    loadCalendarData(teamId, mode);
  }, [loadCalendarData]);

  /**
   * Handle task clicks - disabled for now (use right-click context menu instead)
   */
  const handleTaskClick = useCallback((task: AssignmentTaskDto, event?: React.MouseEvent) => {
    console.log('Task clicked:', task, 'Ctrl:', event?.ctrlKey);

    // Clear slot selections when clicking on tasks
    setSelectedSlots([]);

    // Handle multi-task selection
    toggleTaskSelection(task, event?.ctrlKey || false);
  }, [toggleTaskSelection]);

  /**
   * Handle slot clicks - create new task
   */
  const handleSlotClick = useCallback((date: Date, slot: Slot, employeeId: number) => {
    console.log('Slot clicked:', { date, slot, employeeId });

    // Find employee name from calendar data
    let employeeName = 'Employee';
    if (calendarData?.employees) {
      const employee = calendarData.employees.find(emp => emp.employeeId === employeeId);
      employeeName = employee?.employeeName || `Employee ${employeeId}`;
    }

    // Set modal data and open
    setTaskModalData({
      date,
      slot,
      employeeId,
      employeeName,
    });
    setTaskModalOpen(true);
  }, [calendarData]);

  // Handle slot focus for selection (separate from creating tasks)
  const handleSlotFocus = useCallback((date: Date, slot: Slot, employeeId: number, event?: React.MouseEvent) => {
    const isCtrlPressed = event?.ctrlKey || false;
    console.log('Slot focus:', { date, slot, employeeId, isCtrlPressed });

    // Toggle slot selection
    toggleSlotSelection(date, slot, employeeId, isCtrlPressed);
  }, [toggleSlotSelection]);

  /**
   * Handle task drag and drop
   */
  const handleTaskDrop = useCallback(async (
    dragItem: DragItem, 
    targetDate: Date, 
    targetSlot: Slot, 
    targetEmployeeId: number
  ) => {
    try {
      console.log('Task drop:', { dragItem, targetDate, targetSlot, targetEmployeeId });
      
      // Format the target date as YYYY-MM-DD for API
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const targetDateString = `${year}-${month}-${day}`;
      
      // Move the assignment using the schedule service
      await scheduleService.moveAssignment(
        dragItem.task.assignmentId,
        targetEmployeeId,
        targetDateString,
        targetSlot
      );
      
      console.log('Task moved successfully');
      
      // Refresh the calendar data to show the moved task
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
      
    } catch (error) {
      console.error('Error moving task:', error);
      alert('Failed to move task. Please try again.');
    }
  }, [teamViewMode, managedTeamId, loadCalendarData]);

  // WPF-style navigation helper functions
  const getNextBusinessDay = useCallback((date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  }, []);

  const getPreviousBusinessDay = useCallback((date: Date): Date => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    while (prevDay.getDay() === 0 || prevDay.getDay() === 6) {
      prevDay.setDate(prevDay.getDate() - 1);
    }
    return prevDay;
  }, []);

  /**
   * WPF-style NavigateToDay logic - shifts window by one working day
   */
  const navigateToDay = useCallback((targetDate: Date) => {
    console.log('=== NavigateToDay DEBUG ===');
    console.log('NavigateToDay: Called with target date', targetDate);
    console.log('NavigateToDay: Current window start is', windowStartDate);
    console.log('NavigateToDay: Last navigated date was', lastNavigatedDate);

    // Only work in Weekly and Biweekly views
    if (viewType !== CalendarViewType.Week && viewType !== CalendarViewType.BiWeek) {
      console.log('NavigateToDay: Not in Weekly/Biweekly view, ignoring');
      return;
    }

    // Calculate window end (5 days for weekly, 10 for biweekly)
    const windowDays = viewType === CalendarViewType.Week ? 5 : 10;
    let windowEnd = new Date(windowStartDate);
    for (let i = 0; i < windowDays - 1; i++) {
      windowEnd = getNextBusinessDay(windowEnd);
    }
    console.log('NavigateToDay: Current window spans', windowStartDate, 'to', windowEnd);

    // Determine navigation direction
    const isNavigatingBackward = lastNavigatedDate && targetDate < lastNavigatedDate;
    console.log('NavigateToDay: Navigating', isNavigatingBackward ? 'backward' : 'forward', 'from', lastNavigatedDate, 'to', targetDate);

    // Calculate new window start using exact WPF logic
    let newWindowStart: Date;
    
    if (targetDate < windowStartDate) {
      console.log('NavigateToDay: ✓ TARGET IS BEFORE CURRENT START - shifting backward by one working day');
      newWindowStart = getPreviousBusinessDay(windowStartDate);
    } else if (targetDate > windowEnd) {
      console.log('NavigateToDay: ✓ TARGET IS AFTER WINDOW END - shifting forward by one working day');
      newWindowStart = getNextBusinessDay(windowStartDate);
    } else if (isNavigatingBackward) {
      console.log('NavigateToDay: ✓ TARGET IS WITHIN WINDOW BUT NAVIGATING BACKWARD - shifting backward by one working day');
      newWindowStart = getPreviousBusinessDay(windowStartDate);
    } else {
      console.log('NavigateToDay: ✓ TARGET IS WITHIN WINDOW BUT NAVIGATING FORWARD - shifting forward by one working day');
      newWindowStart = getNextBusinessDay(windowStartDate);
    }

    console.log('NavigateToDay: Final calculated window start:', newWindowStart);

    // Only update if window actually changes
    if (newWindowStart.toDateString() !== windowStartDate.toDateString()) {
      console.log('NavigateToDay: ✓ UPDATING window start from', windowStartDate, 'to', newWindowStart);
      setWindowStartDate(newWindowStart);
      setCurrentDate(targetDate);
      // Calendar data will reload via useEffect dependency on windowStartDate
    } else {
      console.log('NavigateToDay: ✗ NO CHANGE - window start unchanged');
      // Still update currentDate even if window doesn't change
      setCurrentDate(targetDate);
    }

    // Remember this date for next navigation
    setLastNavigatedDate(targetDate);
    console.log('NavigateToDay: Stored last navigated date as', targetDate);
    console.log('=== NavigateToDay END ===');
  }, [windowStartDate, lastNavigatedDate, viewType, getNextBusinessDay, getPreviousBusinessDay]);

  /**
   * Handle date changes - now uses WPF NavigateToDay logic
   */
  const handleDateChange = useCallback((date: Date) => {
    navigateToDay(date);
  }, [navigateToDay]);

  /**
   * Handle task assignment creation
   */
  const handleTaskAssignmentCreate = useCallback(async (assignment: CreateAssignmentDto) => {
    try {
      console.log('Creating task assignment:', assignment);
      
      // Call the real API to create the assignment
      const createdAssignment = await scheduleService.createAssignment(assignment);
      console.log('Assignment created successfully:', createdAssignment);
      
      // Refresh the calendar data using the same logic as loadCalendarData
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
      
    } catch (error) {
      console.error('Error creating task assignment:', error);
      throw error; // Re-throw so modal can show error
    }
  }, [teamViewMode, managedTeamId, loadCalendarData]);

  /**
   * Handle task edit - edit existing task assignment
   */
  const handleTaskEdit = useCallback((task: AssignmentTaskDto) => {
    console.log('Edit task:', task);
    const tasksInSlot = getSlotTasks(task);
    setSelectedTasks([task]);
    setSlotTasks(tasksInSlot);
    setTaskDetailsMode('edit');
    setTaskDetailsModalOpen(true);
  }, [getSlotTasks]);

  /**
   * Handle task delete - delete task assignment
   */
  const handleTaskDelete = useCallback(async (assignmentId: number) => {
    try {
      console.log('Delete assignment:', assignmentId);
      await scheduleService.deleteAssignment(assignmentId);
      
      // Refresh calendar data
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  }, [teamViewMode, managedTeamId, loadCalendarData]);

  /**
   * Handle task view - view task details
   */
  const handleTaskView = useCallback((task: AssignmentTaskDto) => {
    console.log('View task details:', task);
    const tasksInSlot = getSlotTasks(task);
    setSelectedTasks([task]);
    setSlotTasks(tasksInSlot);
    setTaskDetailsMode('view');
    setTaskDetailsModalOpen(true);
  }, [getSlotTasks]);

  /**
   * Handle task copy - copy task to create duplicate
   */
  const handleTaskCopy = useCallback((task: AssignmentTaskDto) => {
    console.log('Copy task:', task);
    setCopiedTask(task);
  }, []);

  /**
   * Handle task paste - paste copied task to a new slot
   */
  const handleTaskPaste = useCallback(async (date: Date, slot: Slot, employeeId: number) => {
    if (!copiedTask) {
      console.log('No copied task available');
      return;
    }

    try {
      // Format date for API
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const assignment: CreateAssignmentDto = {
        taskId: copiedTask.taskId,
        employeeId: employeeId,
        assignedDate: dateStr,
        slot: slot,
        notes: copiedTask.notes || undefined,
      };

      await scheduleService.createAssignment(assignment);
      
      // Refresh calendar data
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    } catch (error) {
      console.error('Error pasting task:', error);
      alert('Failed to paste task. Please try again.');
    }
  }, [copiedTask, teamViewMode, managedTeamId, loadCalendarData]);

  /**
   * Handle paste to multiple selected slots (used by DayBasedCalendarGrid)
   */
  const handleTaskPasteMultiple = useCallback(async () => {
    if (!copiedTask || selectedSlots.length === 0) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Paste to all selected slots
    for (const slot of selectedSlots) {
      try {
        await handleTaskPaste(slot.date, slot.slot, slot.employeeId);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      showNotification({
        type: 'success',
        title: `Task${successCount > 1 ? 's' : ''} Pasted`,
        message: `"${copiedTask.taskTitle || copiedTask.taskName}" pasted to ${successCount} slot${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`
      });

      // Clear selections after successful paste
      setSelectedSlots([]);
    } else if (errorCount > 0) {
      showNotification({
        type: 'error',
        title: 'Paste Failed',
        message: 'Failed to paste task to any of the selected slots. Please try again.'
      });
    }
  }, [copiedTask, selectedSlots, handleTaskPaste, showNotification]);

  /**
   * Handle bulk edit operations
   */
  const handleBulkEdit = useCallback(async (updates: BulkEditData) => {
    if (selectedTasks.length === 0) return;

    try {
      // Create bulk update object with only changed fields
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: selectedTasks.map(task => task.assignmentId),
        updates: {}
      };

      // Only include fields that were actually changed
      if (updates.taskType !== undefined) {
        bulkUpdate.updates.taskId = updates.taskType?.id;
      }
      if (updates.priority !== undefined) {
        bulkUpdate.updates.priority = updates.priority;
      }
      if (updates.status !== undefined) {
        bulkUpdate.updates.taskStatus = updates.status;
      }
      if (updates.dueDate !== undefined) {
        bulkUpdate.updates.dueDate = updates.dueDate;
      }
      if (updates.notes !== undefined) {
        bulkUpdate.updates.notes = updates.notes;
      }

      // Call the bulk update API
      await scheduleService.bulkUpdateAssignments(bulkUpdate);

      // Refresh the calendar data
      await loadCalendarData();

      // Clear selections
      setSelectedTasks([]);

      // Show success notification
      showNotification({
        type: 'success',
        title: 'Bulk Update Successful',
        message: `${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} updated successfully.`
      });

    } catch (error) {
      console.error('Error updating tasks:', error);
      showNotification({
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'Failed to update tasks. Please try again.'
      });
    }
  }, [selectedTasks, loadCalendarData, showNotification]);

  /**
   * Update multiple tasks in calendar data without full reload
   */
  const updateTasksInCalendarData = useCallback((updatedTasks: AssignmentTaskDto[]) => {
    if (!calendarData || updatedTasks.length === 0) return;

    console.log('Updating tasks in calendar data:', updatedTasks);

    // Create a map for faster lookup
    const updatedTasksMap = new Map(updatedTasks.map(task => [task.assignmentId, task]));

    setCalendarData(prevData => {
      if (!prevData) return prevData;

      const updatedData = { ...prevData };
      updatedData.employees = prevData.employees.map(employee => {
        return {
          ...employee,
          dayAssignments: employee.dayAssignments.map(dayAssignment => {
            const updatedDayAssignment = { ...dayAssignment };

            // Update morning slot if it exists
            if (updatedDayAssignment.morningSlot) {
              updatedDayAssignment.morningSlot = {
                ...updatedDayAssignment.morningSlot,
                tasks: updatedDayAssignment.morningSlot.tasks.map(task => {
                  const updatedTask = updatedTasksMap.get(task.assignmentId);
                  return updatedTask || task;
                })
              };
            }

            // Update afternoon slot if it exists
            if (updatedDayAssignment.afternoonSlot) {
              updatedDayAssignment.afternoonSlot = {
                ...updatedDayAssignment.afternoonSlot,
                tasks: updatedDayAssignment.afternoonSlot.tasks.map(task => {
                  const updatedTask = updatedTasksMap.get(task.assignmentId);
                  return updatedTask || task;
                })
              };
            }

            return updatedDayAssignment;
          })
        };
      });

      console.log('Calendar data updated successfully');
      return updatedData;
    });
  }, [calendarData]);

  /**
   * Update specific task in calendar data without full reload (single task convenience method)
   */
  const updateTaskInCalendarData = useCallback((updatedTask: AssignmentTaskDto) => {
    updateTasksInCalendarData([updatedTask]);
  }, [updateTasksInCalendarData]);


  /**
   * Quick Edit Handlers
   */
  const handleQuickEditTaskType = useCallback(async (taskTypeId: number) => {
    // Use captured tasks directly (like handleTaskPasteMultiple does)
    console.log('handleQuickEditTaskType - Using captured tasks:', capturedQuickEditTasks.map(t => t.assignmentId));

    if (capturedQuickEditTasks.length === 0) return;

    try {
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: capturedQuickEditTasks.map(task => task.assignmentId),
        updates: { taskTypeId: taskTypeId }
      };

      const updatedTasks = await scheduleService.bulkUpdateAssignments(bulkUpdate);

      // Update all affected tasks in calendar data
      updateTasksInCalendarData(updatedTasks);
      setCurrentQuickEditTask(null);
      setCapturedQuickEditTasks([]);

      const taskCount = capturedQuickEditTasks.length;
      showNotification({
        type: 'success',
        title: 'Task Type Updated',
        message: `Task type updated for ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      });

    } catch (error) {
      console.error('Error updating task type:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task type. Please try again.'
      });
    }
  }, [capturedQuickEditTasks, updateTasksInCalendarData, showNotification]);

  const handleQuickEditStatus = useCallback(async (status: TaskStatus | null) => {
    console.log('handleQuickEditStatus - Using captured tasks:', capturedQuickEditTasks.map(t => t.assignmentId));

    if (capturedQuickEditTasks.length === 0) return;

    try {
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: capturedQuickEditTasks.map(task => task.assignmentId),
        updates: { taskStatus: status || undefined }
      };

      const updatedTasks = await scheduleService.bulkUpdateAssignments(bulkUpdate);

      updateTasksInCalendarData(updatedTasks);
      setCurrentQuickEditTask(null);
      setCapturedQuickEditTasks([]);

      const taskCount = capturedQuickEditTasks.length;
      showNotification({
        type: 'success',
        title: status ? 'Status Updated' : 'Status Cleared',
        message: `Status ${status ? 'updated' : 'cleared'} for ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      });

    } catch (error) {
      console.error('Error updating status:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update status. Please try again.'
      });
    }
  }, [capturedQuickEditTasks, updateTasksInCalendarData, showNotification]);

  const handleQuickEditPriority = useCallback(async (priority: TaskPriority | null) => {
    console.log('handleQuickEditPriority - Using captured tasks:', capturedQuickEditTasks.map(t => t.assignmentId));

    if (capturedQuickEditTasks.length === 0) return;

    try {
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: capturedQuickEditTasks.map(task => task.assignmentId),
        updates: { priority: priority || undefined }
      };

      const updatedTasks = await scheduleService.bulkUpdateAssignments(bulkUpdate);

      updateTasksInCalendarData(updatedTasks);
      setCurrentQuickEditTask(null);
      setCapturedQuickEditTasks([]);

      const taskCount = capturedQuickEditTasks.length;
      showNotification({
        type: 'success',
        title: priority ? 'Priority Updated' : 'Priority Cleared',
        message: `Priority ${priority ? 'updated' : 'cleared'} for ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      });

    } catch (error) {
      console.error('Error updating priority:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update priority. Please try again.'
      });
    }
  }, [capturedQuickEditTasks, updateTasksInCalendarData, showNotification]);

  const handleQuickEditDueDate = useCallback(async (dueDate: string | null) => {
    console.log('handleQuickEditDueDate - Using captured tasks:', capturedQuickEditTasks.map(t => t.assignmentId));

    if (capturedQuickEditTasks.length === 0) return;

    try {
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: capturedQuickEditTasks.map(task => task.assignmentId),
        updates: { dueDate: dueDate }
      };

      const updatedTasks = await scheduleService.bulkUpdateAssignments(bulkUpdate);

      updateTasksInCalendarData(updatedTasks);
      setCurrentQuickEditTask(null);
      setCapturedQuickEditTasks([]);

      const taskCount = capturedQuickEditTasks.length;
      showNotification({
        type: 'success',
        title: dueDate ? 'Due Date Updated' : 'Due Date Cleared',
        message: `Due date ${dueDate ? 'updated' : 'cleared'} for ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      });

    } catch (error) {
      console.error('Error updating due date:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update due date. Please try again.'
      });
    }
  }, [capturedQuickEditTasks, updateTasksInCalendarData, showNotification]);

  const handleQuickEditNotes = useCallback(async (notes: string | null) => {
    console.log('handleQuickEditNotes - Using captured tasks:', capturedQuickEditTasks.map(t => t.assignmentId));

    if (capturedQuickEditTasks.length === 0) return;

    try {
      const bulkUpdate: BulkUpdateAssignmentDto = {
        assignmentIds: capturedQuickEditTasks.map(task => task.assignmentId),
        updates: { notes: notes }
      };

      const updatedTasks = await scheduleService.bulkUpdateAssignments(bulkUpdate);

      updateTasksInCalendarData(updatedTasks);
      setCurrentQuickEditTask(null);
      setCapturedQuickEditTasks([]);

      const taskCount = capturedQuickEditTasks.length;
      showNotification({
        type: 'success',
        title: notes ? 'Notes Updated' : 'Notes Cleared',
        message: `Notes ${notes ? 'updated' : 'cleared'} for ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      });

    } catch (error) {
      console.error('Error updating notes:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update notes. Please try again.'
      });
    }
  }, [capturedQuickEditTasks, updateTasksInCalendarData, showNotification]);

  /**
   * Detect all task conflicts for bank holiday setting
   */
  const detectBankHolidayConflicts = useCallback((date: Date): { hasConflicts: boolean; conflicts: string[] } => {
    if (!calendarData) {
      return { hasConflicts: false, conflicts: [] };
    }

    const conflicts: string[] = [];
    const targetDateStr = date.toDateString();

    calendarData.employees.forEach(employee => {
      const dayAssignment = employee.dayAssignments.find(day =>
        new Date(day.date).toDateString() === targetDateStr
      );

      if (!dayAssignment) return;

      // Check both morning and afternoon slots for all employees
      const morningTasks = dayAssignment.morningSlot?.tasks || [];
      const afternoonTasks = dayAssignment.afternoonSlot?.tasks || [];

      if (morningTasks.length > 0) {
        morningTasks.forEach(task => {
          conflicts.push(`${employee.employeeName}: Morning - ${task.taskName}`);
        });
      }

      if (afternoonTasks.length > 0) {
        afternoonTasks.forEach(task => {
          conflicts.push(`${employee.employeeName}: Afternoon - ${task.taskName}`);
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }, [calendarData]);

  /**
   * Helper function to update calendar data with bank holiday
   */
  const addBankHolidayToCalendarData = useCallback((date: Date, holidayName: string = 'Bank Holiday') => {
    if (!calendarData) return;

    const targetDateStr = date.toDateString();

    setCalendarData(prevData => {
      if (!prevData) return prevData;

      const updatedData = { ...prevData };
      updatedData.employees = prevData.employees.map(employee => ({
        ...employee,
        dayAssignments: employee.dayAssignments.map(dayAssignment => {
          const assignmentDateStr = new Date(dayAssignment.date).toDateString();
          if (assignmentDateStr === targetDateStr) {
            return {
              ...dayAssignment,
              isHoliday: true,
              holidayName: holidayName,
              // Clear any existing leave data
              leave: undefined,
              // Clear slot leave data
              morningSlot: dayAssignment.morningSlot ? {
                ...dayAssignment.morningSlot,
                leave: undefined,
                tasks: [] // Remove tasks on holiday
              } : undefined,
              afternoonSlot: dayAssignment.afternoonSlot ? {
                ...dayAssignment.afternoonSlot,
                leave: undefined,
                tasks: [] // Remove tasks on holiday
              } : undefined
            };
          }
          return dayAssignment;
        })
      }));

      return updatedData;
    });
  }, [calendarData]);

  /**
   * Helper function to update calendar data with leave
   */
  const addLeaveToCalendarData = useCallback((leaveData: {
    employeeIds: number[];
    leaveType: number;
    duration: number;
    slot?: number;
    date: Date;
  }) => {
    if (!calendarData) return;

    const targetDateStr = leaveData.date.toDateString();

    setCalendarData(prevData => {
      if (!prevData) return prevData;

      const updatedData = { ...prevData };
      updatedData.employees = prevData.employees.map(employee => {
        // Only update selected employees
        if (!leaveData.employeeIds.includes(employee.employeeId)) {
          return employee;
        }

        return {
          ...employee,
          dayAssignments: employee.dayAssignments.map(dayAssignment => {
            const assignmentDateStr = new Date(dayAssignment.date).toDateString();
            if (assignmentDateStr === targetDateStr) {
              const leaveInfo = {
                leaveType: leaveData.leaveType as LeaveType,
                duration: leaveData.duration as LeaveDuration,
                slot: leaveData.slot as Slot | undefined,
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                startDate: dayAssignment.date
              };

              if (leaveData.duration === LeaveDuration.FullDay) {
                // Full day leave
                return {
                  ...dayAssignment,
                  leave: leaveInfo,
                  // Clear tasks on both slots
                  morningSlot: dayAssignment.morningSlot ? {
                    ...dayAssignment.morningSlot,
                    tasks: [],
                    leave: undefined
                  } : undefined,
                  afternoonSlot: dayAssignment.afternoonSlot ? {
                    ...dayAssignment.afternoonSlot,
                    tasks: [],
                    leave: undefined
                  } : undefined
                };
              } else {
                // Half day leave
                const isAM = leaveData.slot === Slot.Morning;
                console.log('🔍 Half day leave - isAM:', isAM, 'slot:', leaveData.slot, 'Slot.Morning:', Slot.Morning);

                return {
                  ...dayAssignment,
                  leave: undefined, // Clear day-level leave
                  morningSlot: isAM ? {
                    slot: Slot.Morning,
                    tasks: dayAssignment.morningSlot?.tasks || [],
                    availableCapacity: dayAssignment.morningSlot?.availableCapacity || 0,
                    isOverbooked: dayAssignment.morningSlot?.isOverbooked || false,
                    leave: leaveInfo
                  } : (dayAssignment.morningSlot || {
                    slot: Slot.Morning,
                    tasks: [],
                    availableCapacity: 0,
                    isOverbooked: false
                  }),
                  afternoonSlot: !isAM ? {
                    slot: Slot.Afternoon,
                    tasks: dayAssignment.afternoonSlot?.tasks || [],
                    availableCapacity: dayAssignment.afternoonSlot?.availableCapacity || 0,
                    isOverbooked: dayAssignment.afternoonSlot?.isOverbooked || false,
                    leave: leaveInfo
                  } : (dayAssignment.afternoonSlot || {
                    slot: Slot.Afternoon,
                    tasks: [],
                    availableCapacity: 0,
                    isOverbooked: false
                  })
                };
              }
            }
            return dayAssignment;
          })
        };
      });

      return updatedData;
    });
  }, [calendarData]);

  /**
   * Helper function to clear leave/holiday from calendar data
   */
  const clearBlockingFromCalendarData = useCallback((date: Date) => {
    if (!calendarData) return;

    const targetDateStr = date.toDateString();

    setCalendarData(prevData => {
      if (!prevData) return prevData;

      const updatedData = { ...prevData };
      updatedData.employees = prevData.employees.map(employee => ({
        ...employee,
        dayAssignments: employee.dayAssignments.map(dayAssignment => {
          const assignmentDateStr = new Date(dayAssignment.date).toDateString();
          if (assignmentDateStr === targetDateStr) {
            return {
              ...dayAssignment,
              isHoliday: false,
              holidayName: undefined,
              leave: undefined,
              morningSlot: dayAssignment.morningSlot ? {
                ...dayAssignment.morningSlot,
                leave: undefined
              } : undefined,
              afternoonSlot: dayAssignment.afternoonSlot ? {
                ...dayAssignment.afternoonSlot,
                leave: undefined
              } : undefined
            };
          }
          return dayAssignment;
        })
      }));

      return updatedData;
    });
  }, [calendarData]);

  /**
   * Handle bank holiday creation - blocks all slots for all team members on selected date
   */
  const handleSetBankHoliday = useCallback(async (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Detect task conflicts first
    const conflictCheck = detectBankHolidayConflicts(date);

    let confirmMessage = `Are you sure you want to set ${dayName} as a Bank Holiday?\n\nThis will block all slots for ALL team members on this day`;

    if (conflictCheck.hasConflicts) {
      const conflictList = conflictCheck.conflicts.join('\n• ');
      confirmMessage += ` and delete the following existing tasks:\n\n• ${conflictList}`;
    }

    confirmMessage += '\n\nDo you want to proceed?';

    // Show custom confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Set Bank Holiday',
      message: confirmMessage,
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          console.log('Setting bank holiday for:', date);

          // Mark that user has created leave (to disable mock data)
          localStorage.setItem('hasUserCreatedLeave', 'true');

          // Save to persistent storage first
          addHolidayToStorage(date, 'Bank Holiday');

          // Update calendar data immediately (this will be redundant after refresh, but needed for immediate UI update)
          addBankHolidayToCalendarData(date, 'Bank Holiday');

          // Show success notification
          const conflictMessage = conflictCheck.hasConflicts
            ? `${conflictCheck.conflicts.length} existing task(s) were deleted.`
            : '';

          showNotification({
            type: 'success',
            title: 'Bank Holiday Set Successfully',
            message: `${dayName} has been set as a Bank Holiday.${conflictMessage ? '\n' + conflictMessage : ''}`
          });

        } catch (error) {
          console.error('Error setting bank holiday:', error);
          showNotification({
            type: 'error',
            title: 'Error Setting Bank Holiday',
            message: 'Failed to set bank holiday. Please try again.'
          });
        }
      }
    });
  }, [detectBankHolidayConflicts, showNotification, confirmDialog, addBankHolidayToCalendarData]);

  /**
   * Handle leave creation - opens modal to select team members and leave type
   */
  const handleSetLeave = useCallback(async (date: Date) => {
    console.log('Setting leave for:', date);
    setSelectedLeaveDate(date);
    setSetLeaveModalOpen(true);
  }, []);

  /**
   * Handle clearing leave/holiday from a date
   */
  const handleClearBlocking = useCallback(async (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    setConfirmDialog({
      isOpen: true,
      title: 'Clear Blocking Day',
      message: `Are you sure you want to clear all leave and holidays from ${dayName}?\n\nThis will remove any blocking slots and make the day available for tasks again.`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          console.log('Clearing blocking for:', date);

          // Remove from persistent storage first
          removeLeaveFromStorage(date);

          // Clear from calendar data (immediate UI update)
          clearBlockingFromCalendarData(date);

          showNotification({
            type: 'success',
            title: 'Blocking Cleared',
            message: `All leave and holidays have been cleared from ${dayName}.`
          });

        } catch (error) {
          console.error('Error clearing blocking:', error);
          showNotification({
            type: 'error',
            title: 'Error Clearing Blocking',
            message: 'Failed to clear blocking. Please try again.'
          });
        }
      }
    });
  }, [confirmDialog, clearBlockingFromCalendarData, showNotification]);

  /**
   * Detect task conflicts for leave setting
   */
  const detectTaskConflicts = useCallback((leaveData: {
    employeeIds: number[];
    duration: number;
    slot?: number;
    date: Date;
  }): { hasConflicts: boolean; conflicts: string[] } => {
    if (!calendarData) {
      return { hasConflicts: false, conflicts: [] };
    }

    const conflicts: string[] = [];
    const targetDateStr = leaveData.date.toDateString();

    leaveData.employeeIds.forEach(employeeId => {
      const employee = calendarData.employees.find(emp => emp.employeeId === employeeId);
      if (!employee) return;

      const dayAssignment = employee.dayAssignments.find(day =>
        new Date(day.date).toDateString() === targetDateStr
      );

      if (!dayAssignment) return;

      // Check conflicts based on leave duration
      if (leaveData.duration === 1) {
        // Full day leave - check both slots
        const morningTasks = dayAssignment.morningSlot?.tasks || [];
        const afternoonTasks = dayAssignment.afternoonSlot?.tasks || [];

        if (morningTasks.length > 0) {
          morningTasks.forEach(task => {
            conflicts.push(`${employee.employeeName}: Morning - ${task.taskName}`);
          });
        }

        if (afternoonTasks.length > 0) {
          afternoonTasks.forEach(task => {
            conflicts.push(`${employee.employeeName}: Afternoon - ${task.taskName}`);
          });
        }
      } else {
        // Half day leave - check specific slot
        const slotKey = leaveData.slot === 1 ? 'morningSlot' : 'afternoonSlot';
        const slotTasks = dayAssignment[slotKey]?.tasks || [];

        if (slotTasks.length > 0) {
          const slotName = leaveData.slot === 1 ? 'Morning' : 'Afternoon';
          slotTasks.forEach(task => {
            conflicts.push(`${employee.employeeName}: ${slotName} - ${task.taskName}`);
          });
        }
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }, [calendarData]);

  /**
   * Handle leave submission from the modal
   */
  const handleLeaveSubmit = useCallback(async (leaveData: {
    employeeIds: number[];
    leaveType: number;
    duration: number;
    slot?: number;
    date: Date;
  }) => {
    try {
      console.log('Submitting leave data:', leaveData);

      // Detect task conflicts first
      const conflictCheck = detectTaskConflicts(leaveData);

      if (conflictCheck.hasConflicts) {
        const leaveTypeNames = {
          1: 'Annual Leave',
          2: 'Sick Day',
          3: 'Training'
        };

        const employeeNames = leaveData.employeeIds.map(id => {
          const employee = calendarData?.employees.find(emp => emp.employeeId === id);
          return employee?.employeeName || `Employee ${id}`;
        }).join(', ');

        const duration = leaveData.duration === 1 ? 'Full Day' :
                        `Half Day (${leaveData.slot === 1 ? 'Morning' : 'Afternoon'})`;

        const conflictList = conflictCheck.conflicts.join('\n• ');

        // Show custom confirmation dialog for conflicts
        setConfirmDialog({
          isOpen: true,
          title: 'Task Conflicts Detected',
          message: `Setting ${leaveTypeNames[leaveData.leaveType as keyof typeof leaveTypeNames]} (${duration}) for:\n${employeeNames}\nDate: ${leaveData.date.toLocaleDateString()}\n\nThe following tasks will be DELETED:\n\n• ${conflictList}\n\nDo you want to proceed with setting the leave and deleting these tasks?`,
          type: 'warning',
          onConfirm: async () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            proceedWithLeaveCreation();
          }
        });
        return; // Exit here, confirmation will handle the rest
      }

      // No conflicts, proceed directly
      proceedWithLeaveCreation();

      function proceedWithLeaveCreation() {
        try {
          console.log('Creating leave:', leaveData);

          // Mark that user has created leave (to disable mock data)
          localStorage.setItem('hasUserCreatedLeave', 'true');

          // Save to persistent storage first
          leaveData.employeeIds.forEach(employeeId => {
            addLeaveToStorage(
              employeeId,
              leaveData.date,
              leaveData.leaveType as LeaveType,
              leaveData.duration as LeaveDuration,
              leaveData.slot as Slot | undefined
            );
          });

          // Update calendar data immediately (this will be redundant after refresh, but needed for immediate UI update)
          addLeaveToCalendarData(leaveData);

          // Prepare success message
          const leaveTypeNames = {
            1: 'Annual Leave',
            2: 'Sick Day',
            3: 'Training'
          };

          const employeeNames = leaveData.employeeIds.map(id => {
            const employee = calendarData?.employees.find(emp => emp.employeeId === id);
            return employee?.employeeName || `Employee ${id}`;
          }).join(', ');

          const duration = leaveData.duration === 1 ? 'Full Day' :
                          `Half Day (${leaveData.slot === 1 ? 'Morning' : 'Afternoon'})`;

          const conflictMessage = conflictCheck.hasConflicts
            ? `${conflictCheck.conflicts.length} conflicting task(s) were deleted.`
            : '';

          const leaveDetails = `Employees: ${employeeNames}
Type: ${leaveTypeNames[leaveData.leaveType as keyof typeof leaveTypeNames]}
Duration: ${duration}
Date: ${leaveData.date.toLocaleDateString()}`;

          showNotification({
            type: 'success',
            title: 'Leave Set Successfully',
            message: `${leaveDetails}${conflictMessage ? '\n\n' + conflictMessage : ''}`
          });

          // Show persistence warning for first-time users
          const isFirstLeave = !localStorage.getItem('hasShownPersistenceWarning');
          if (isFirstLeave) {
            localStorage.setItem('hasShownPersistenceWarning', 'true');
            setTimeout(() => {
              showNotification({
                type: 'info',
                title: 'Note: Temporary Data',
                message: 'Leave data is currently stored locally and will be lost on page refresh. Full backend integration coming soon!'
              });
            }, 2000);
          }

          // Close modal
          setSetLeaveModalOpen(false);
          setSelectedLeaveDate(null);

        } catch (error) {
          console.error('Error setting leave:', error);
          showNotification({
            type: 'error',
            title: 'Error Setting Leave',
            message: 'Failed to set leave. Please try again.'
          });
        }
      }
    } catch (error) {
      console.error('Error setting leave:', error);
      showNotification({
        type: 'error',
        title: 'Error Setting Leave',
        message: 'Failed to set leave. Please try again.'
      });
    }
  }, [calendarData, detectTaskConflicts, showNotification, confirmDialog, addLeaveToCalendarData]);

  /**
   * Handle task update from details modal
   */
  const handleTaskUpdate = useCallback(async (updatedTask: AssignmentTaskDto) => {
    console.log('TaskSchedule handleTaskUpdate called with:', updatedTask);
    console.log('Current calendar data:', calendarData);
    
    // Update only the specific task in the calendar data instead of reloading everything
    setCalendarData(prevData => {
      if (!prevData) {
        console.log('Calendar data not loaded yet, will trigger reload instead');
        // If calendar data isn't loaded yet, trigger a reload
        loadCalendarData();
        return prevData;
      }
      
      return {
        ...prevData,
        employees: prevData.employees.map(employee => {
          if (employee.employeeId === updatedTask.employeeId) {
            return {
              ...employee,
              dayAssignments: employee.dayAssignments.map(dayAssignment => {
                const taskDate = new Date(updatedTask.assignedDate).toDateString();
                const dayDate = new Date(dayAssignment.date).toDateString();
                
                if (taskDate === dayDate) {
                  const slotKey = updatedTask.slot === 1 ? 'morningSlot' : 'afternoonSlot';
                  const slot = dayAssignment[slotKey];
                  
                  if (slot) {
                    return {
                      ...dayAssignment,
                      [slotKey]: {
                        ...slot,
                        tasks: slot.tasks.map(task => 
                          task.assignmentId === updatedTask.assignmentId ? updatedTask : task
                        )
                      }
                    };
                  }
                }
                return dayAssignment;
              })
            };
          }
          return employee;
        })
      };
    });
    
    console.log('TaskSchedule handleTaskUpdate completed - new calendar data should update UI');
  }, []);

  /**
   * Handle view type changes
   */
  const handleViewTypeChange = useCallback((newViewType: CalendarViewType) => {
    setViewType(newViewType);
    // Calendar data will be reloaded by useEffect
  }, []);

  /**
   * Handle refresh button
   */
  const handleRefresh = useCallback(() => {
    loadTeams();
    loadCalendarData(
      teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
      teamViewMode
    );
  }, [loadTeams, loadCalendarData, teamViewMode, managedTeamId]);

  // Initialize window start date when component mounts
  useEffect(() => {
    // Set initial window start to proper business day
    const getBusinessDayWindowStart = (date: Date): Date => {
      const today = new Date(date);
      
      // If today is weekend, move to next Monday
      if (today.getDay() === 0) { // Sunday
        today.setDate(today.getDate() + 1); // Move to Monday
      } else if (today.getDay() === 6) { // Saturday
        today.setDate(today.getDate() + 2); // Move to Monday
      }
      
      // For business days, find the Monday of current week
      const dayOfWeek = today.getDay(); // 1=Monday, 2=Tuesday, ..., 5=Friday
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek - 1)); // Go back to Monday
      
      return monday;
    };
    
    const initialWindowStart = getBusinessDayWindowStart(currentDate);
    console.log('🎯 Initial window start set to:', initialWindowStart, '(', initialWindowStart.toLocaleDateString('en-US', { weekday: 'long' }), ')');
    setWindowStartDate(initialWindowStart);
    
    loadTeams();
  }, []); // Only run once on mount

  // Load calendar data when dependencies change
  useEffect(() => {
    if (teams.length > 0 || teamViewMode === TeamViewMode.AllTeams) {
      loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    }
  }, [loadCalendarData, teams.length, managedTeamId, teamViewMode, windowStartDate, viewType]); // Changed dependency from currentDate to windowStartDate

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ESC - Clear copied task and selections
      if (e.key === 'Escape') {
        let clearedItems = [];
        if (copiedTask) {
          setCopiedTask(null);
          clearedItems.push('copied task');
        }
        if (selectedSlots.length > 0) {
          setSelectedSlots([]);
          clearedItems.push(`${selectedSlots.length} selected slot${selectedSlots.length > 1 ? 's' : ''}`);
        }
        if (selectedTasks.length > 0) {
          setSelectedTasks([]);
          clearedItems.push(`${selectedTasks.length} selected task${selectedTasks.length > 1 ? 's' : ''}`);
        }

        if (clearedItems.length > 0) {
          showNotification({
            type: 'info',
            title: 'Selections Cleared',
            message: `Cleared: ${clearedItems.join(', ')}.`
          });
        }
        return;
      }

      // Ctrl+C - Copy selected task (only works with single selection)
      if (e.ctrlKey && e.key === 'c') {
        if (selectedTasks.length === 1) {
          e.preventDefault();
          const task = selectedTasks[0];
          console.log('🔗 Ctrl+C pressed - copying task:', task.taskTitle);
          handleTaskCopy(task);
          showNotification({
            type: 'success',
            title: 'Task Copied',
            message: `"${task.taskTitle}" copied to clipboard. Use Ctrl+V to paste or right-click on a slot.`
          });
        } else if (selectedTasks.length > 1) {
          showNotification({
            type: 'warning',
            title: 'Multiple Tasks Selected',
            message: 'Copy only works with a single selected task. Please select one task to copy.'
          });
        } else {
          console.log('⚠️ Ctrl+C pressed but no task selected');
          showNotification({
            type: 'warning',
            title: 'No Task Selected',
            message: 'Click on a task first to select it, then use Ctrl+C to copy.'
          });
        }
        return;
      }

      // Ctrl+V - Paste copied task to selected slots
      if (e.ctrlKey && e.key === 'v') {
        if (copiedTask && selectedSlots.length > 0) {
          e.preventDefault();

          let successCount = 0;
          let errorCount = 0;

          // Paste to all selected slots
          for (const slot of selectedSlots) {
            try {
              handleTaskPaste(slot.date, slot.slot, slot.employeeId);
              successCount++;
            } catch (error) {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showNotification({
              type: 'success',
              title: `Task${successCount > 1 ? 's' : ''} Pasted`,
              message: `"${copiedTask.taskTitle || copiedTask.taskName}" pasted to ${successCount} slot${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`
            });

            // Clear selections after successful paste
            setSelectedSlots([]);
          } else {
            showNotification({
              type: 'error',
              title: 'Paste Failed',
              message: 'Failed to paste to selected slots. Check if slots are available.'
            });
          }
        } else if (!copiedTask) {
          showNotification({
            type: 'warning',
            title: 'No Task Copied',
            message: 'No task to paste. Copy a task first using Ctrl+C or the copy button.'
          });
        } else if (selectedSlots.length === 0) {
          showNotification({
            type: 'warning',
            title: 'No Slots Selected',
            message: 'Click on slot(s) to select them, then use Ctrl+V to paste.'
          });
        }
        return;
      }

      // Del - Delete selected task
      if (e.key === 'Delete') {
        if (selectedTasks.length > 0) {
          e.preventDefault();

          if (selectedTasks.length === 1) {
            const task = selectedTasks[0];
            // Show confirmation dialog for single task
            setConfirmDialog({
              isOpen: true,
              title: 'Delete Task',
              message: `Are you sure you want to delete this task?\n\n${task.taskTitle || task.taskName}`,
              type: 'danger',
              onConfirm: () => {
                handleTaskDelete(task.assignmentId);
                setSelectedTasks([]);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                showNotification({
                  type: 'success',
                  title: 'Task Deleted',
                  message: `"${task.taskTitle || task.taskName}" has been deleted.`
                });
              }
            });
          } else {
            // Show confirmation dialog for multiple tasks
            setConfirmDialog({
              isOpen: true,
              title: 'Delete Multiple Tasks',
              message: `Are you sure you want to delete ${selectedTasks.length} selected tasks?\n\nThis action cannot be undone.`,
              type: 'danger',
              onConfirm: () => {
                // Delete all selected tasks
                selectedTasks.forEach(task => {
                  handleTaskDelete(task.assignmentId);
                });
                setSelectedTasks([]);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                showNotification({
                  type: 'success',
                  title: 'Tasks Deleted',
                  message: `${selectedTasks.length} tasks have been deleted.`
                });
              }
            });
          }
        } else {
          showNotification({
            type: 'warning',
            title: 'No Task Selected',
            message: 'Select a task first by clicking on it, then press Delete.'
          });
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copiedTask, selectedTasks, selectedSlots, handleTaskCopy, handleTaskPaste, handleTaskDelete, showNotification]);

  // Transform teams for UI components
  const teamsForUI = teamService.transformTeamsForUI(teams);

  // Global click handler to clear selections when LEFT clicking elsewhere
  const handleGlobalClick = useCallback((e: React.MouseEvent) => {
    // Only clear on LEFT click (button 0), not right-click (button 2)
    if (e.button !== 0) {
      return;
    }

    // Don't clear if clicking on a task or within a context menu
    const target = e.target as HTMLElement;
    const isTaskClick = target.closest('[data-task-card]') || target.closest('[data-context-menu]');

    if (!isTaskClick) {
      setSelectedTasks([]);
    }
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
      }}
      onClick={handleGlobalClick}
    >
      {/* New App Header */}
      <AppHeader
        currentPage="dashboard"
        onNavigate={handleNavigation}
        onSearch={handleSearch}
        userName={userContext.name}
        userRole={userContext.role}
        onProfile={handleProfile}
        onSettings={handleSettings}
        onLogout={handleLogout}
        // Date navigation props for keyboard navigation
        currentDate={currentDate}
        onDateChange={handleDateChange}
        currentViewType={viewType === CalendarViewType.Week ? 'Weekly' : 
                         viewType === CalendarViewType.BiWeek ? 'Biweekly' : 
                         viewType === CalendarViewType.Day ? 'Daily' : 'Monthly'}
        onViewTypeChange={(newViewType) => {
          const calendarViewType = newViewType === 'Weekly' ? CalendarViewType.Week : 
                                   newViewType === 'Biweekly' ? CalendarViewType.BiWeek :
                                   newViewType === 'Daily' ? CalendarViewType.Day : 
                                   CalendarViewType.Month;
          handleViewTypeChange(calendarViewType);
        }}
      />

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          fontSize: '0.875rem',
          border: '1px solid #fecaca',
          borderRadius: '0',
        }}>
          {error}
        </div>
      )}

      {/* Day-Based Calendar Grid */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#6b7280' 
          }}>
            Loading...
          </div>
        ) : calendarData ? (
          <DayBasedCalendarGrid
            key={`${windowStartDate.getTime()}-${calendarData.days[0]?.date || ''}`}
            employees={calendarData.employees}
            days={calendarData.days}
            onTaskClick={handleTaskClick}
            onSlotClick={handleSlotClick}
            onTaskDrop={handleTaskDrop}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onTaskView={handleTaskView}
            onTaskCopy={handleTaskCopy}
            onTaskPaste={handleTaskPaste}
            onTaskPasteMultiple={handleTaskPasteMultiple}
            hasCopiedTask={!!copiedTask}
            isReadOnly={userContext.role === 'TeamMember'}
            onSetBankHoliday={handleSetBankHoliday}
            onSetLeave={handleSetLeave}
            onClearBlocking={handleClearBlocking}
            selectedTaskIds={selectedTasks.map(task => task.assignmentId)}
            selectedSlots={selectedSlots}
            onSlotFocus={handleSlotFocus}
            onBulkEdit={() => setBulkEditModalOpen(true)}
            onQuickEditTaskType={(task) => {
              console.log('QuickEdit TaskType clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // CAPTURE selection immediately (like handleTaskPasteMultiple does)
              let tasksToEdit: AssignmentTaskDto[] = [];
              if (selectedTasks.length > 0) {
                // Check if clicked task is in the selection
                const isCurrentInSelection = selectedTasks.some(t => t.assignmentId === task.assignmentId);
                if (isCurrentInSelection) {
                  // Edit all selected tasks
                  tasksToEdit = [...selectedTasks];
                } else {
                  // Edit only clicked task
                  tasksToEdit = [task];
                }
              } else {
                // No selection - edit only clicked task
                tasksToEdit = [task];
              }

              console.log('🎯 Captured tasks for edit:', tasksToEdit.map(t => t.assignmentId));
              setCapturedQuickEditTasks(tasksToEdit);
              setCurrentQuickEditTask(task);
              setQuickEditTaskTypeOpen(true);
            }}
            onQuickEditStatus={(task) => {
              console.log('QuickEdit Status clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // CAPTURE selection immediately
              let tasksToEdit: AssignmentTaskDto[] = [];
              if (selectedTasks.length > 0) {
                const isCurrentInSelection = selectedTasks.some(t => t.assignmentId === task.assignmentId);
                if (isCurrentInSelection) {
                  tasksToEdit = [...selectedTasks];
                } else {
                  tasksToEdit = [task];
                }
              } else {
                tasksToEdit = [task];
              }

              console.log('🎯 Captured tasks for edit:', tasksToEdit.map(t => t.assignmentId));
              setCapturedQuickEditTasks(tasksToEdit);
              setCurrentQuickEditTask(task);
              setQuickEditStatusOpen(true);
            }}
            onQuickEditPriority={(task) => {
              console.log('QuickEdit Priority clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // CAPTURE selection immediately
              let tasksToEdit: AssignmentTaskDto[] = [];
              if (selectedTasks.length > 0) {
                const isCurrentInSelection = selectedTasks.some(t => t.assignmentId === task.assignmentId);
                if (isCurrentInSelection) {
                  tasksToEdit = [...selectedTasks];
                } else {
                  tasksToEdit = [task];
                }
              } else {
                tasksToEdit = [task];
              }

              console.log('🎯 Captured tasks for edit:', tasksToEdit.map(t => t.assignmentId));
              setCapturedQuickEditTasks(tasksToEdit);
              setCurrentQuickEditTask(task);
              setQuickEditPriorityOpen(true);
            }}
            onQuickEditDueDate={(task) => {
              console.log('QuickEdit DueDate clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // CAPTURE selection immediately
              let tasksToEdit: AssignmentTaskDto[] = [];
              if (selectedTasks.length > 0) {
                const isCurrentInSelection = selectedTasks.some(t => t.assignmentId === task.assignmentId);
                if (isCurrentInSelection) {
                  tasksToEdit = [...selectedTasks];
                } else {
                  tasksToEdit = [task];
                }
              } else {
                tasksToEdit = [task];
              }

              console.log('🎯 Captured tasks for edit:', tasksToEdit.map(t => t.assignmentId));
              setCapturedQuickEditTasks(tasksToEdit);
              setCurrentQuickEditTask(task);
              setQuickEditDueDateOpen(true);
            }}
            onQuickEditNotes={(task) => {
              console.log('QuickEdit Notes clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // CAPTURE selection immediately
              let tasksToEdit: AssignmentTaskDto[] = [];
              if (selectedTasks.length > 0) {
                const isCurrentInSelection = selectedTasks.some(t => t.assignmentId === task.assignmentId);
                if (isCurrentInSelection) {
                  tasksToEdit = [...selectedTasks];
                } else {
                  tasksToEdit = [task];
                }
              } else {
                tasksToEdit = [task];
              }

              console.log('🎯 Captured tasks for edit:', tasksToEdit.map(t => t.assignmentId));
              setCapturedQuickEditTasks(tasksToEdit);
              setCurrentQuickEditTask(task);
              setQuickEditNotesOpen(true);
            }}
            onBulkDelete={(taskIds: number[]) => {
              setConfirmationDialog({
                isOpen: true,
                title: 'Delete Tasks',
                message: `Are you sure you want to delete ${taskIds.length} selected task${taskIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger',
                onConfirm: () => {
                  taskIds.forEach(taskId => {
                    const employees = calendarData?.employees || [];
                    const taskToDelete = employees.flatMap(emp =>
                      emp.dayAssignments.flatMap(day => [
                        ...(day.morningSlot?.tasks || []),
                        ...(day.afternoonSlot?.tasks || [])
                      ])
                    ).find(t => t.assignmentId === taskId);
                    if (taskToDelete) {
                      handleTaskDelete(taskToDelete.assignmentId);
                    }
                  });
                }
              });
            }}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#6b7280' 
          }}>
            No schedule data available
          </div>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}>
          Debug: View Mode: {teamViewMode}, Teams: {teams.length}, 
          Managed Team: {currentTeamName || 'None'}, 
          Employees: {calendarData?.employees.length || 0}
        </div>
      )}

      {/* Task Creation Modal */}
      {taskModalData && (
        <TaskCreationModal
          open={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setTaskModalData(null);
          }}
          onSubmit={handleTaskAssignmentCreate}
          initialDate={taskModalData.date}
          initialSlot={taskModalData.slot}
          employeeId={taskModalData.employeeId}
          employeeName={taskModalData.employeeName}
        />
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={taskDetailsModalOpen}
        onClose={() => {
          setTaskDetailsModalOpen(false);
          setSelectedTasks([]);
          setSlotTasks([]);
        }}
        task={selectedTasks[0] || null}
        onUpdate={handleTaskUpdate}
        mode={taskDetailsMode}
        slotTasks={slotTasks}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={bulkEditModalOpen}
        selectedTasks={selectedTasks}
        onClose={() => setBulkEditModalOpen(false)}
        onSave={handleBulkEdit}
        taskTypes={calendarData?.taskTypes || []}
      />

      {/* Quick Edit Modals */}
      <QuickEditTaskType
        isOpen={quickEditTaskTypeOpen}
        selectedTasks={capturedQuickEditTasks}
        taskTypes={calendarData?.taskTypes || []}
        onClose={() => { setQuickEditTaskTypeOpen(false); setCurrentQuickEditTask(null); setCapturedQuickEditTasks([]); }}
        onSave={handleQuickEditTaskType}
      />

      <QuickEditStatus
        isOpen={quickEditStatusOpen}
        selectedTasks={capturedQuickEditTasks}
        onClose={() => { setQuickEditStatusOpen(false); setCurrentQuickEditTask(null); setCapturedQuickEditTasks([]); }}
        onSave={handleQuickEditStatus}
      />

      <QuickEditPriority
        isOpen={quickEditPriorityOpen}
        selectedTasks={capturedQuickEditTasks}
        onClose={() => { setQuickEditPriorityOpen(false); setCurrentQuickEditTask(null); setCapturedQuickEditTasks([]); }}
        onSave={handleQuickEditPriority}
      />

      <QuickEditDueDate
        isOpen={quickEditDueDateOpen}
        selectedTasks={capturedQuickEditTasks}
        onClose={() => { setQuickEditDueDateOpen(false); setCurrentQuickEditTask(null); setCapturedQuickEditTasks([]); }}
        onSave={handleQuickEditDueDate}
      />

      <QuickEditNotes
        isOpen={quickEditNotesOpen}
        selectedTasks={capturedQuickEditTasks}
        onClose={() => { setQuickEditNotesOpen(false); setCurrentQuickEditTask(null); setCapturedQuickEditTasks([]); }}
        onSave={handleQuickEditNotes}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        type={confirmationDialog.type}
        onConfirm={() => {
          confirmationDialog.onConfirm();
          setConfirmationDialog({ ...confirmationDialog, isOpen: false });
        }}
        onCancel={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
      />

      {/* Set Leave Modal */}
      {selectedLeaveDate && (
        <SetLeaveModal
          isOpen={setLeaveModalOpen}
          onClose={() => {
            setSetLeaveModalOpen(false);
            setSelectedLeaveDate(null);
          }}
          selectedDate={selectedLeaveDate}
          employees={calendarData?.employees || []}
          onSubmit={handleLeaveSubmit}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        confirmText="Proceed"
        cancelText="Cancel"
      />
    </div>
  );
};

const TeamSchedule: React.FC = () => {
  return (
    <NotificationManager>
      {(showNotification) => (
        <TeamScheduleContent showNotification={showNotification} />
      )}
    </NotificationManager>
  );
};

export default TeamSchedule;