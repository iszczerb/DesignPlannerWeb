import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppHeader from '../components/layout/AppHeader';
import DayBasedCalendarGrid from '../components/calendar/DayBasedCalendarGrid';
import TaskCreationModal from '../components/calendar/TaskCreationModal';
import TaskDetailsModal from '../components/calendar/TaskDetailsModal';
import DayDetailsModal from '../components/calendar/DayDetailsModal';
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
import DatabaseManagementModal from '../components/database/DatabaseManagementModal';
import AnalyticsDashboardModal from '../components/analytics/AnalyticsDashboardModal';
import AbsenceManagementModal from '../components/leave/AbsenceManagementModal';
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
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  TeamMemberDto
} from '../types/schedule';
import { DragItem } from '../types/dragDrop';
import teamService, { TeamInfo } from '../services/teamService';
import scheduleService from '../services/scheduleService';
import { employeeService } from '../services/employeeService';
import projectService, { TaskTypeOption } from '../services/projectService';
import { CreateEmployeeRequest } from '../types/employee';
import { UserRole, User } from '../types/auth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import signalRService from '../services/signalRService';
import { absenceService } from '../services/absenceService';

// User context interface for local component usage
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
  // console.log('💾 Saved leave data to localStorage:', leaveData);
};

const loadLeaveDataFromStorage = (): StoredLeaveData[] => {
  const stored = localStorage.getItem('persistentLeaveData');
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    // console.log('📂 Loaded leave data from localStorage:', parsed);
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
  // Fix timezone issue - use local date instead of UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const existing = loadLeaveDataFromStorage();

  console.log(`🗑️ removeLeaveFromStorage: Input date: ${date.toLocaleDateString()}`);
  console.log(`🗑️ removeLeaveFromStorage: Converted to dateStr: ${dateStr}, employeeId: ${employeeId}`);
  console.log(`🗑️ Before removal, localStorage has ${existing.length} items:`, existing);

  // Debug each item's date format
  existing.forEach((item, index) => {
    console.log(`🗑️ Item ${index}: date="${item.date}", employeeId=${item.employeeId}, type=${item.leaveType}`);
    console.log(`🗑️ Comparison: "${item.date}" !== "${dateStr}" = ${item.date !== dateStr}`);
  });

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

  console.log(`🗑️ After filtering, will save ${filtered.length} items:`, filtered);
  saveLeaveDataToStorage(filtered);

  // Verify the save worked
  const afterSave = loadLeaveDataFromStorage();
  console.log(`🗑️ After save, localStorage now has ${afterSave.length} items:`, afterSave);
};

const mergeStoredLeaveData = (calendarData: CalendarViewDto): CalendarViewDto => {
  const storedLeaves = loadLeaveDataFromStorage();
  console.log(`🔄 mergeStoredLeaveData: Found ${storedLeaves.length} stored leaves:`, storedLeaves);
  if (storedLeaves.length === 0) return calendarData;

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
          leaveType: LeaveType.OtherLeave,
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

  // DO NOT MODIFY EMPLOYEE DATA - use only database values

  return mockData;
};

const TeamScheduleContent: React.FC<{ showNotification: (notification: any) => void }> = ({ showNotification }) => {
  // Redux hooks
  const dispatch = useAppDispatch();

  // State management
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [windowStartDate, setWindowStartDate] = useState(() => {
    // Initialize with a stable date - not "now" which changes on every render
    const today = new Date();
    const day = today.getDay();
    // If weekend, move to Monday
    if (day === 0) { // Sunday
      today.setDate(today.getDate() + 1);
    } else if (day === 6) { // Saturday
      today.setDate(today.getDate() + 2);
    }
    // Set to start of day to avoid time drift
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [lastNavigatedDate, setLastNavigatedDate] = useState<Date | null>(null); // Track navigation direction
  const [viewType, setViewType] = useState(CalendarViewType.Week);
  const [teamViewMode, setTeamViewMode] = useState(TeamViewMode.MyTeam);
  const [calendarData, setCalendarData] = useState<CalendarViewDto | undefined>();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamFilters, setTeamFilters] = useState<string[]>([]); // empty array = show all teams
  
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


  // Clipboard state for copy/paste functionality
  const [copiedTask, setCopiedTask] = useState<AssignmentTaskDto | null>(null);

  // Selected slots state for multi-selection and keyboard shortcuts (updated)
  const [selectedSlots, setSelectedSlots] = useState<Array<{
    date: Date;
    slot: Slot;
    employeeId: number;
  }>>([]);

  // Selected days state for multi-day selection (like multi-select tasks)
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);

  // Captured days for multi-day actions (to preserve selection when modal opens)
  const [capturedMultiDays, setCapturedMultiDays] = useState<Date[]>([]);

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

  // Helper to check if a day is selected
  const isDaySelected = useCallback((date: Date): boolean => {
    return selectedDays.some(selectedDay =>
      selectedDay.toDateString() === date.toDateString()
    );
  }, [selectedDays]);

  // Helper to toggle day selection
  const toggleDaySelection = useCallback((date: Date, ctrlKey: boolean = false) => {
    if (ctrlKey) {
      // Multi-selection with Ctrl
      setSelectedDays(prev => {
        const isCurrentlySelected = prev.some(d => d.toDateString() === date.toDateString());
        if (isCurrentlySelected) {
          // Remove from selection
          return prev.filter(d => d.toDateString() !== date.toDateString());
        } else {
          // Add to selection
          return [...prev, new Date(date)];
        }
      });
    } else {
      // Single selection without Ctrl
      setSelectedDays(prev => {
        const isCurrentlySelected = prev.some(d => d.toDateString() === date.toDateString());
        if (isCurrentlySelected && prev.length === 1) {
          // Deselect if it's the only selected day
          return [];
        } else {
          // Select only this day
          return [new Date(date)];
        }
      });
    }
  }, []);

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
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [databaseRefreshTrigger, setDatabaseRefreshTrigger] = useState(0);

  // Day Details modal state
  const [dayDetailsModalOpen, setDayDetailsModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ date: Date; day: any } | null>(null);

  // Task types for Quick Edit modals
  const [taskTypes, setTaskTypes] = useState<TaskTypeOption[]>([]);

  // Captured tasks for quick edit (to preserve selection when modal opens)
  const [capturedQuickEditTasks, setCapturedQuickEditTasks] = useState<AssignmentTaskDto[]>([]);




  // ✅ DATABASE ONLY - Use pure database employees without enhancement
  const enhancedEmployees = useMemo(() => {
    if (!calendarData?.employees) return [];
    return calendarData.employees; // Pure database data only
  }, [calendarData?.employees]);


  // Team member editing/creation removed - DATABASE-ONLY operations
  const handleEmployeeEdit = useCallback((employee: any) => {
    console.log('🔍 Employee edit disabled - schedule view is read-only');
  }, []);

  const handleTeamAddMember = useCallback((teamId: number) => {
    console.log('🔍 Team member creation disabled - schedule view is read-only');
  }, []);

  const handleTeamManage = useCallback((teamId: number) => {
    console.log('🔍 Team management disabled - schedule view is read-only');
  }, []);

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

  // Get real user context from Redux auth state
  const authUser = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  // Convert Redux auth user to local UserContext format
  const userContext = useMemo<UserContext | null>(() => {
    if (!authUser || !isAuthenticated) return null;

    // Convert numeric UserRole enum to string
    const roleString = {
      [UserRole.Admin]: 'Admin',
      [UserRole.Manager]: 'Manager',
      [UserRole.TeamMember]: 'TeamMember'
    }[authUser.role] || 'Unknown';

    // Create initials from firstName and lastName
    const initials = `${authUser.firstName.charAt(0).toUpperCase()} ${authUser.lastName.charAt(0).toUpperCase()}`;

    return {
      id: authUser.id,
      role: roleString,
      name: initials
    };
  }, [authUser, isAuthenticated]);

  // Early return if user is not authenticated
  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the schedule.</p>
        </div>
      </div>
    );
  }

  // Filter employees based on selected team
  const filteredEmployees = useMemo(() => {
    if (!calendarData?.employees) {
      console.log('🔍 filteredEmployees: No calendar data or employees');
      return [];
    }

    // console.log('🔍 filteredEmployees: Total employees:', calendarData.employees.length);
    // console.log('🔍 filteredEmployees: teamFilters:', teamFilters);
    // console.log('🔍 filteredEmployees: Employee teams:', calendarData.employees.map(emp => emp.team));

    if (teamFilters.length === 0) {
      // console.log('🔍 filteredEmployees: No filters, showing all employees');
      return calendarData.employees; // Show all if no filters
    }

    const filtered = calendarData.employees.filter(employee => teamFilters.includes(employee.team));
    // console.log('🔍 filteredEmployees: After filtering:', filtered.length, 'employees');
    return filtered;
  }, [calendarData?.employees, teamFilters]);

  // Team filter callback for multi-selection
  const handleTeamFilter = useCallback((action: 'toggle' | 'clear', teamName?: string) => {
    if (action === 'clear') {
      setTeamFilters([]);
    } else if (action === 'toggle' && teamName) {
      setTeamFilters(prev => {
        if (prev.includes(teamName)) {
          // Remove team from filters
          return prev.filter(t => t !== teamName);
        } else {
          // Add team to filters
          return [...prev, teamName];
        }
      });
    }
  }, []);

  // Navigation and user menu handlers
  const handleNavigation = (page: string) => {
    console.log('Navigate to:', page);

    if (page === 'database') {
      setShowDatabaseModal(true);
    } else if (page === 'dashboard') {
      setShowAnalyticsModal(true);
    } else if (page === 'absence') {
      setShowAbsenceModal(true);
    } else {
      // TODO: Implement other navigation logic
    }
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out user...');
      await dispatch(logout()).unwrap();
      console.log('✅ Logout successful');

      // Optionally show a success notification
      showNotification({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been logged out successfully.'
      });

      // The AuthProvider will handle redirecting to login page
      // when isAuthenticated becomes false
    } catch (error) {
      console.error('❌ Logout failed:', error);
      showNotification({
        type: 'error',
        title: 'Logout Error',
        message: 'An error occurred while logging out. Please try again.'
      });
    }
  };

  // Derived state - Smart team selection based on user role
  const getDefaultTeamForUser = () => {
    if (userContext.role === 'Admin') {
      // Admin users should see ALL teams - return null to indicate "show all"
      return null;
    } else if (userContext.role === 'Manager') {
      // For Manager users, use their first managed team
      const managedTeam = teams.find(team => team.isManaged);
      return managedTeam;
    } else if (userContext.role === 'TeamMember') {
      // For TeamMember users, they don't manage teams - they belong to a team
      // Since TeamMembers only see their own schedule, we don't need team filtering
      // The backend regular calendar endpoint handles this via employeeId filtering
      return null;
    }
    return null;
  };

  // Get all managed teams for multiple team support
  const managedTeams = teamService.getUserManagedTeams(teams);
  const managedTeam = getDefaultTeamForUser();

  // CRITICAL FIX: Admin, Manager, and TeamMember users should NOT have a managedTeamId - backend handles filtering
  // For Managers: Backend already filters to only managed teams, so no need for teamId filter
  // For Admins: Should see all teams
  // For TeamMembers: Backend regular calendar endpoint filters by employeeId, not teamId
  const managedTeamId = undefined; // Always undefined - let backend handle all filtering

  // Show summary of all managed teams for managers
  const currentTeamName = userContext.role === 'Admin'
    ? 'All Teams'
    : userContext.role === 'Manager' && managedTeams.length > 0
      ? teamService.getManagedTeamsSummary(teams)
      : (managedTeam?.name || 'No Team');

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
      console.log('🏢 LoadTeams called for role:', userContext.role);

      if (userContext.role === 'Admin') {
        console.log('🏢 ADMIN: Calling getAllTeamsWithManagedStatus...');
        const allTeams = await teamService.getAllTeamsWithManagedStatus();
        console.log('🏢 ADMIN: Teams received:', allTeams);
        setTeams(allTeams);
        console.log('🏢 ADMIN: Teams state updated');
      } else if (userContext.role === 'Manager') {
        console.log('🏢 MANAGER: Calling getManagerTeams (only managed teams)...');
        const managedTeams = await teamService.getManagerTeams();
        console.log('🏢 MANAGER: Managed teams received:', managedTeams);
        setTeams(managedTeams);
        console.log('🏢 MANAGER: Teams state updated');
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
   * Load task types for Quick Edit modals
   */
  const loadTaskTypes = useCallback(async () => {
    try {
      const taskTypesData = await projectService.getTaskTypes();
      setTaskTypes(taskTypesData);
    } catch (error) {
      console.error('Failed to load task types:', error);
      setTaskTypes([]);
    }
  }, []);

  /**
   * Load calendar data based on current view mode and parameters
   */
  const loadCalendarData = useCallback(async (teamId?: number, mode?: TeamViewMode) => {
    // console.log('🚨🚨🚨🚨🚨 loadCalendarData CALLED! 🚨🚨🚨🚨🚨');
    try {
      setIsLoading(true);
      setError(null);

      // Fix UTC timezone issue - use local date instead of UTC
      const year = windowStartDate.getFullYear();
      const month = String(windowStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(windowStartDate.getDate()).padStart(2, '0');
      const startDateString = `${year}-${month}-${day}`;

      const request: ScheduleRequestDto = {
        startDate: startDateString,
        viewType: viewType,
        includeInactive: false
      };

      console.log('🔍 loadCalendarData: windowStartDate in local timezone:', windowStartDate, '(', windowStartDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), ')');
      console.log('🔍 loadCalendarData: windowStartDate.toISOString():', windowStartDate.toISOString());
      console.log('🔍 loadCalendarData: Sending startDate string to API:', startDateString);
      console.log('🔍 loadCalendarData: Request viewType:', viewType);
      console.log('📅 LoadCalendarData called with:', { teamId, mode });
      console.log('📅 Current teamViewMode:', teamViewMode);
      console.log('📅 DEBUG: userContext.role:', userContext.role);
      console.log('🚨🚨🚨 CACHE BUSTER 12345 - NEW ROLE LOGIC IMPLEMENTED! 🚨🚨🚨');

      let data: CalendarViewDto;

      const currentMode = mode || teamViewMode;

      // EXACT ROLE-BASED ACCESS CONTROL:
      // Admin = ALL TeamMember users from ALL teams (global view)
      // Manager = Only TeamMember users from all their managed teams
      // TeamMember = ONLY THEIR OWN ROW (not their whole team!)


      if (userContext.role === 'Admin') {
        // Admin users always get global view with ALL TeamMember users from ALL teams
        const globalView = await teamService.getGlobalCalendarView(request);
        data = teamService.transformGlobalViewToCalendarData(globalView);
      } else if (userContext.role === 'Manager') {
        // Manager users see TeamMember users from ALL their managed teams (using global view)
        console.log('📅 ✅ MANAGER USER: Loading TeamMember users from ALL managed teams');
        const globalView = await teamService.getGlobalCalendarView(request);
        data = teamService.transformGlobalViewToCalendarData(globalView);
      } else if (userContext.role === 'TeamMember') {
        // TeamMember users see ONLY THEIR OWN ROW
        console.log('📅 ✅ TEAMMEMBER USER: Loading ONLY own schedule row');
        data = await scheduleService.getCalendarView(request);
      } else {
        // Fallback for unknown roles
        console.log('📅 ❌ UNKNOWN ROLE: Using fallback calendar view');
        data = await scheduleService.getCalendarView(request);
      }

      console.log('🔍 loadCalendarData: Received calendar data:', data);
      console.log('🔍 loadCalendarData: Days in response:', data.days?.map(d => ({ date: d.date, dayName: d.dayName, displayDate: d.displayDate })));
      // console.log('🔍 loadCalendarData: Employee team IDs:', data.employees?.map(e => ({ name: e.fullName, teamId: e.teamId })));

      // 🚨 FIXED: Only merge localStorage when explicitly needed, not always!
      // const dataWithStoredLeaves = mergeStoredLeaveData(data);

      // ✅ DATABASE ONLY - No localStorage leave merging for pure database mode
      console.log('🔍 Using PURE DATABASE DATA - localStorage leave merging DISABLED');

      // 🧹 Clear any existing localStorage leave data to prevent flashing (ONLY on first load)
      const existingLeaves = loadLeaveDataFromStorage();
      if (existingLeaves.length > 0) {
        console.log(`🧹 Clearing ${existingLeaves.length} localStorage leave items to prevent conflicts`);
        localStorage.removeItem('leaveData');
        console.log('🧹 LocalStorage leave data cleared - calendar now uses pure database data');
      }

      const finalData = data; // Use pure database data without localStorage contamination
      const dataWithTeamChanges = finalData;

      // No more local task assignments - all tasks come from backend
      const dataWithLocalAssignments = dataWithTeamChanges;


      // Ensure employees are sorted alphabetically by first name
      const finalDataWithSorting = {
        ...dataWithLocalAssignments,
        employees: [...dataWithLocalAssignments.employees].sort((a, b) => a.employeeName.localeCompare(b.employeeName))
      };

      setCalendarData(finalDataWithSorting);
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
   * Handle employee deletion - DATABASE ONLY
   */
  const handleEmployeeDelete = useCallback(async (employeeId: number) => {
    try {
      // Only handle real database employees - no fake IDs or localStorage
      console.log('🔍 Deleting database employee with ID:', employeeId);
      await employeeService.deleteEmployee(employeeId);

      // Reload calendar data to reflect changes
      await loadCalendarData();

      showNotification({ type: 'success', title: 'Success', message: 'Team member deleted successfully!' });
    } catch (error) {
      console.error('Error deleting team member:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to delete team member. Please try again.' });
    }
  }, [loadCalendarData, showNotification]);

  /**
   * Handle data fetching requests
   */
  const handleFetchTeamData = useCallback((teamId?: number, mode?: TeamViewMode) => {
    // CRITICAL FIX: Admin users should never pass teamId
    const effectiveTeamId = userContext.role === 'Admin' ? undefined : teamId;
    const effectiveMode = mode || (userContext.role === 'Admin' ? TeamViewMode.AllTeams : teamViewMode);
    loadCalendarData(effectiveTeamId, effectiveMode);
  }, [loadCalendarData, userContext.role, teamViewMode]);

  /**
   * Handle database data changes (e.g., client color updates)
   */
  const handleDatabaseDataChange = useCallback(() => {
    // Refresh calendar data when database changes occur (e.g., client colors updated)
    loadCalendarData(
      teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
      teamViewMode
    );
  }, [loadCalendarData, teamViewMode, managedTeamId]);

  /**
   * Trigger database refresh for Projects tab when calendar tasks change
   */
  const triggerDatabaseRefresh = useCallback(() => {
    console.log('🔄 TEAM SCHEDULE - Triggering database refresh for Projects tab');
    setDatabaseRefreshTrigger(prev => prev + 1);
  }, []);

  /**
   * Handle logo click - go to current week
   */
  const handleLogoClick = useCallback(() => {
    console.log('🏠 TEAM SCHEDULE - Logo clicked, navigating to current week');
    const today = new Date();

    // Calculate business day window start for current week
    const getBusinessDayWindowStart = (date: Date): Date => {
      const targetDate = new Date(date);

      // If today is weekend, move to next Monday
      if (targetDate.getDay() === 0) { // Sunday
        targetDate.setDate(targetDate.getDate() + 1); // Move to Monday
      } else if (targetDate.getDay() === 6) { // Saturday
        targetDate.setDate(targetDate.getDate() + 2); // Move to Monday
      }

      return targetDate;
    };

    // Set view to Weekly and go to current week
    setViewType(CalendarViewType.Week);
    setCurrentDate(today);

    // Calculate window start for the current week
    const windowStart = getBusinessDayWindowStart(today);
    setWindowStartDate(windowStart);
    setLastNavigatedDate(today);

    console.log('🎯 Navigated to current week:', today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

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
   * Handle day header clicks - for multi-day selection
   */
  const handleDayClick = useCallback((date: Date, event?: React.MouseEvent) => {
    console.log('Day clicked:', date, 'Ctrl:', event?.ctrlKey);

    // Clear slot and task selections when clicking on days
    setSelectedSlots([]);
    setSelectedTasks([]);

    // Handle multi-day selection
    toggleDaySelection(date, event?.ctrlKey || false);
  }, [toggleDaySelection]);

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
   * Left-pack remaining tasks in source slot after a task is removed
   */
  const leftPackSourceSlot = useCallback(async (
    employeeId: number,
    date: Date,
    slot: Slot,
    removedTaskId: number
  ) => {
    try {
      console.log('🔍 Finding remaining tasks in source slot for left-packing...');

      // Use existing calendar data instead of making a fresh API call to avoid triggering view changes
      if (!calendarData || !calendarData.employees) {
        console.log('❌ No calendar data available for left-packing');
        return;
      }

      console.log('✅ Using existing calendar data for left-packing');

      // Find all tasks in the source slot (excluding the removed task) using existing data
      const dateStr = date.toDateString();
      const employee = calendarData.employees.find(emp => emp.employeeId === employeeId);
      if (!employee) {
        console.log('❌ Employee not found for left-packing');
        return;
      }

      const dayAssignment = employee.dayAssignments.find(day =>
        new Date(day.date).toDateString() === dateStr
      );
      if (!dayAssignment) {
        console.log('❌ Day assignment not found for left-packing');
        return;
      }

      const slotData = slot === Slot.Morning ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
      if (!slotData || !slotData.tasks) {
        console.log('❌ Slot data not found for left-packing');
        return;
      }

      // Get remaining tasks (exclude the removed task)
      const remainingTasks = slotData.tasks.filter(task => task.assignmentId !== removedTaskId);

      console.log('🔍 LEFT-PACK ULTRA-DEBUG:', {
        employeeId,
        slotType: slot === Slot.Morning ? 'Morning' : 'Afternoon',
        removedTaskId,
        dateStr,
        allTasksInSlot: slotData.tasks.map(t => ({
          id: t.assignmentId,
          column: t.columnStart,
          hours: t.hours,
          title: t.taskTitle?.substring(0, 20)
        })),
        remainingAfterFilter: remainingTasks.map(t => ({
          id: t.assignmentId,
          column: t.columnStart,
          hours: t.hours,
          title: t.taskTitle?.substring(0, 20)
        })),
        totalRemaining: remainingTasks.length,
        calendarDataTimestamp: new Date().toISOString()
      });

      // ULTRA-SAFETY: Double-check by looking at ALL employees and slots using current data
      console.log('🔍 ULTRA-SAFETY CHECK - All slots for this employee on this date (CURRENT DATA):');
      const targetEmployee = calendarData.employees.find(emp => emp.employeeId === employeeId);
      if (targetEmployee) {
        const targetDay = targetEmployee.dayAssignments.find(day =>
          new Date(day.date).toDateString() === dateStr
        );
        if (targetDay) {
          console.log('📊 MORNING SLOT (FRESH):', targetDay.morningSlot?.tasks?.map(t => ({
            id: t.assignmentId,
            col: t.columnStart,
            hrs: t.hours,
            title: t.taskTitle?.substring(0, 15)
          })) || 'NONE');
          console.log('📊 AFTERNOON SLOT (FRESH):', targetDay.afternoonSlot?.tasks?.map(t => ({
            id: t.assignmentId,
            col: t.columnStart,
            hrs: t.hours,
            title: t.taskTitle?.substring(0, 15)
          })) || 'NONE');
        }
      }

      if (remainingTasks.length === 0) {
        console.log('✅ No remaining tasks to left-pack');
        return;
      }

      // Import the left-pack function (positioning only, no resizing)
      const { leftPackOnly } = await import('../utils/columnDropHelpers');

      // Apply pure left-packing (no resizing, just positioning)
      const leftPackedTasks = leftPackOnly(remainingTasks);

      console.log('📦 Left-packed arrangement:', {
        tasks: leftPackedTasks.map(t => ({ id: t.assignmentId, column: t.columnStart, hours: t.hours }))
      });

      // Update each task's position
      for (const task of leftPackedTasks) {
        console.log(`📦 UPDATING task ${task.assignmentId}: column ${task.columnStart}, hours ${task.hours}`);

        await scheduleService.updateAssignment({
          assignmentId: task.assignmentId,
          columnStart: task.columnStart,
          hours: task.hours
        });
      }

      console.log('✅ Source slot left-packing completed');

      // Calendar data will refresh automatically via useEffect dependencies

    } catch (error) {
      console.error('❌ Error during source slot left-packing:', error);
    }
  }, [calendarData, teamViewMode, managedTeamId]);

  /**
   * Left-pack tasks directly from captured task data
   */
  const leftPackSourceSlotDirect = useCallback(async (remainingTasks: any[]) => {
    try {
      if (remainingTasks.length === 0) {
        console.log('✅ No remaining tasks to left-pack');
        return;
      }

      console.log('🔍 Left-packing captured tasks:', {
        totalRemaining: remainingTasks.length,
        tasks: remainingTasks.map(t => ({ id: t.assignmentId, column: t.columnStart, hours: t.hours }))
      });

      // Import the left-pack function (positioning only, no resizing)
      const { leftPackOnly } = await import('../utils/columnDropHelpers');

      // Apply pure left-packing (no resizing, just positioning)
      const leftPackedTasks = leftPackOnly(remainingTasks);

      console.log('📦 Left-packed arrangement:', {
        tasks: leftPackedTasks.map(t => ({ id: t.assignmentId, column: t.columnStart, hours: t.hours }))
      });

      // Update each task's position
      for (const task of leftPackedTasks) {
        console.log(`📦 UPDATING task ${task.assignmentId}: column ${task.columnStart}, hours ${task.hours}`);

        await scheduleService.updateAssignment({
          assignmentId: task.assignmentId,
          columnStart: task.columnStart,
          hours: task.hours
        });
      }

      console.log('✅ Direct left-packing completed');

      // Calendar data will refresh automatically via useEffect dependencies

    } catch (error) {
      console.error('❌ Error during direct left-packing:', error);
    }
  }, [loadCalendarData, teamViewMode, managedTeamId]);

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
      console.log('Task drop:', {
        dragItem,
        targetDate,
        targetSlot,
        targetEmployeeId,
        columnStart: dragItem.task.columnStart,
        hours: dragItem.task.hours,
        currentWindowStartDate: windowStartDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      });

      // Detect if task is moving to a different slot
      const originalDate = new Date(dragItem.task.assignedDate);
      const isMovingToNewSlot = (
        dragItem.task.employeeId !== targetEmployeeId ||
        originalDate.toDateString() !== targetDate.toDateString() ||
        dragItem.task.slot !== targetSlot
      );

      console.log('🔍 Movement detection:', {
        originalEmployee: dragItem.task.employeeId,
        targetEmployee: targetEmployeeId,
        originalDate: originalDate.toDateString(),
        targetDate: targetDate.toDateString(),
        originalSlot: dragItem.task.slot,
        targetSlot: targetSlot,
        isMovingToNewSlot
      });

      // Store source slot info for left-packing AFTER the move
      let sourceSlotInfo: { employeeId: number; date: Date; slot: Slot } | null = null;
      if (isMovingToNewSlot) {
        sourceSlotInfo = {
          employeeId: dragItem.task.employeeId,
          date: originalDate,
          slot: dragItem.task.slot
        };
        console.log('🔍 Storing source slot info for post-move left-packing:', sourceSlotInfo);
      }

      // Format the target date as YYYY-MM-DD for API
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const targetDateString = `${year}-${month}-${day}`;

      // Update the assignment with its new position and column placement
      await scheduleService.updateAssignment({
        assignmentId: dragItem.task.assignmentId,
        employeeId: targetEmployeeId,
        assignedDate: targetDateString,
        slot: targetSlot,
        // CRITICAL: Preserve column position from drag operation
        columnStart: dragItem.task.columnStart,
        hours: dragItem.task.hours
      });

      console.log('Task moved successfully with column position');
      console.log('🔍 BEFORE loadCalendarData - windowStartDate is:', windowStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

      // Refresh calendar data immediately without changing window position
      // IMPORTANT: We need to reload to ensure the UI is in sync, but we must preserve window position
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );

      console.log('🔍 AFTER loadCalendarData - windowStartDate is:', windowStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

      // If task moved to a different slot, left-pack the remaining tasks in the source slot
      if (isMovingToNewSlot && sourceSlotInfo) {
        console.log('🔄 Left-packing source slot after task move...');

        // Small delay to ensure all database updates are complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use the same approach as deletion - find remaining tasks AFTER the move
        await leftPackSourceSlot(
          sourceSlotInfo.employeeId,
          sourceSlotInfo.date,
          sourceSlotInfo.slot,
          dragItem.task.assignmentId
        );
      }

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
    // console.log('NavigateToDay: Current window spans', windowStartDate, 'to', windowEnd);

    // Determine navigation direction
    const isNavigatingBackward = lastNavigatedDate && targetDate < lastNavigatedDate;
    // console.log('NavigateToDay: Navigating', isNavigatingBackward ? 'backward' : 'forward', 'from', lastNavigatedDate, 'to', targetDate);

    // Calculate new window start using exact WPF logic
    let newWindowStart: Date;
    
    if (targetDate < windowStartDate) {
      // console.log('NavigateToDay: ✓ TARGET IS BEFORE CURRENT START - shifting backward by one working day');
      newWindowStart = getPreviousBusinessDay(windowStartDate);
    } else if (targetDate > windowEnd) {
      // console.log('NavigateToDay: ✓ TARGET IS AFTER WINDOW END - shifting forward by one working day');
      newWindowStart = getNextBusinessDay(windowStartDate);
    } else if (isNavigatingBackward) {
      // console.log('NavigateToDay: ✓ TARGET IS WITHIN WINDOW BUT NAVIGATING BACKWARD - shifting backward by one working day');
      newWindowStart = getPreviousBusinessDay(windowStartDate);
    } else {
      // console.log('NavigateToDay: ✓ TARGET IS WITHIN WINDOW BUT NAVIGATING FORWARD - shifting forward by one working day');
      newWindowStart = getNextBusinessDay(windowStartDate);
    }

    // console.log('NavigateToDay: Final calculated window start:', newWindowStart);

    // Only update if window actually changes
    if (newWindowStart.toDateString() !== windowStartDate.toDateString()) {
      // console.log('NavigateToDay: ✓ UPDATING window start from', windowStartDate, 'to', newWindowStart);
      setWindowStartDate(newWindowStart);
      setCurrentDate(targetDate);
      // Calendar data will reload via useEffect dependency on windowStartDate
    } else {
      // console.log('NavigateToDay: ✗ NO CHANGE - window start unchanged');
      // Still update currentDate even if window doesn't change
      setCurrentDate(targetDate);
    }

    // Remember this date for next navigation
    setLastNavigatedDate(targetDate);
    // console.log('NavigateToDay: Stored last navigated date as', targetDate);
    console.log('=== NavigateToDay END ===');
  }, [windowStartDate, lastNavigatedDate, viewType, getNextBusinessDay, getPreviousBusinessDay]);

  /**
   * Handle date changes - proper day-by-day navigation
   */
  const handleDateChange = useCallback((date: Date) => {
    if (viewType === CalendarViewType.Week) {
      // For Week view, shift the window start by one business day
      const currentWindowStart = new Date(windowStartDate);
      const targetDate = new Date(date);
      const currentDateCopy = new Date(currentDate);

      // Calculate the difference in days between old and new currentDate
      const diffTime = targetDate.getTime() - currentDateCopy.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      console.log('🔍 Week navigation: Current window start:', currentWindowStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      console.log('🔍 Week navigation: Current date was:', currentDateCopy.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      console.log('🔍 Week navigation: New date is:', targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      console.log('🔍 Week navigation: Shifting by', diffDays, 'days');

      // Simple shift: move window start by one business day
      let newWindowStart: Date;
      if (diffDays > 0) {
        // Moving forward - get next business day from window start
        newWindowStart = getNextBusinessDay(currentWindowStart);
      } else if (diffDays < 0) {
        // Moving backward - get previous business day from window start
        newWindowStart = getPreviousBusinessDay(currentWindowStart);
      } else {
        // No change
        newWindowStart = currentWindowStart;
      }

      console.log('🔍 Week navigation: New window start:', newWindowStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      setWindowStartDate(newWindowStart);
      setCurrentDate(date);

    } else if (viewType === CalendarViewType.BiWeek) {
      // For BiWeek view, find the Monday of the target week
      const targetDay = new Date(date);
      const dayOfWeek = targetDay.getDay();

      // Calculate days to subtract to get to Monday
      let daysToMonday = dayOfWeek - 1; // 1 = Monday
      if (dayOfWeek === 0) daysToMonday = 6; // Sunday -> go back 6 days

      const monday = new Date(targetDay);
      monday.setDate(targetDay.getDate() - daysToMonday);

      console.log('🔍 BiWeek navigation: Setting window to Monday:', monday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
      setWindowStartDate(monday);
      setCurrentDate(date);

    } else {
      // For Day view, use the existing navigateToDay logic
      navigateToDay(date);
    }
  }, [navigateToDay, viewType, windowStartDate, currentDate, getNextBusinessDay, getPreviousBusinessDay]);

  /**
   * Handle task assignment creation
   */
  const handleTaskAssignmentCreate = useCallback(async (assignment: CreateAssignmentDto) => {
    try {

      // Call the real API to create the assignment
      const createdAssignment = await scheduleService.createAssignment(assignment);

      // Refresh the calendar data using the same logic as loadCalendarData
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );

    } catch (error) {
      console.error('❌ [DEBUG] Error creating task assignment:', error);
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

      // IMPORTANT: Get task data before deleting for left-packing
      let taskData: { employeeId: number; date: Date; slot: Slot } | null = null;

      // Find the task in calendar data before deletion
      for (const employee of calendarData.employees) {
        for (const dayAssignment of employee.dayAssignments) {
          const date = new Date(dayAssignment.date);

          // Check morning slot
          if (dayAssignment.morningSlot?.tasks) {
            const task = dayAssignment.morningSlot.tasks.find(t => t.assignmentId === assignmentId);
            if (task) {
              taskData = { employeeId: employee.employeeId, date, slot: Slot.Morning };
              break;
            }
          }

          // Check afternoon slot
          if (dayAssignment.afternoonSlot?.tasks) {
            const task = dayAssignment.afternoonSlot.tasks.find(t => t.assignmentId === assignmentId);
            if (task) {
              taskData = { employeeId: employee.employeeId, date, slot: Slot.Afternoon };
              break;
            }
          }
        }
        if (taskData) break;
      }

      console.log('🔍 Task found for deletion:', taskData);

      // Delete the task
      await scheduleService.deleteAssignment(assignmentId);

      // Left-pack the slot after deletion
      if (taskData) {
        console.log('🔄 Left-packing slot after task deletion...');
        await leftPackSourceSlot(taskData.employeeId, taskData.date, taskData.slot, assignmentId);
      }

      // Refresh calendar data
      await loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  }, [teamViewMode, managedTeamId, loadCalendarData, calendarData, leftPackSourceSlot]);

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
        bulkUpdate.updates.priority = updates.priority || undefined;
      }
      if (updates.status !== undefined) {
        bulkUpdate.updates.taskStatus = updates.status || undefined;
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

  const handleDayViewDetails = useCallback((date: Date, day: any) => {
    setSelectedDayData({ date, day });
    setDayDetailsModalOpen(true);
  }, []);

  /**
   * Detect all task conflicts for bank holiday setting
   */
  const detectBankHolidayConflicts = useCallback((date: Date): {
    hasConflicts: boolean;
    conflicts: string[];
    conflictingAssignmentIds: number[]
  } => {
    if (!calendarData) {
      return { hasConflicts: false, conflicts: [], conflictingAssignmentIds: [] };
    }

    const conflicts: string[] = [];
    const conflictingAssignmentIds: number[] = [];
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
          conflictingAssignmentIds.push(task.assignmentId);
        });
      }

      if (afternoonTasks.length > 0) {
        afternoonTasks.forEach(task => {
          conflicts.push(`${employee.employeeName}: Afternoon - ${task.taskName}`);
          conflictingAssignmentIds.push(task.assignmentId);
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      conflictingAssignmentIds
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
   * Handle bank holiday creation - blocks all slots for all team members on selected date(s)
   */
  const handleSetBankHoliday = useCallback(async (clickedDate: Date) => {
    // CAPTURE multi-day selection immediately (like handleTaskPasteMultiple pattern)
    let daysToProcess: Date[] = [];
    if (selectedDays.length > 0) {
      // Check if clicked day is in the selection
      const isCurrentInSelection = selectedDays.some(d => d.toDateString() === clickedDate.toDateString());
      if (isCurrentInSelection) {
        // Clicked day is part of selection - process all selected days
        daysToProcess = [...selectedDays];
      } else {
        // Clicked day is NOT in selection - only process this day
        daysToProcess = [clickedDate];
      }
    } else {
      // No selection - process only clicked day
      daysToProcess = [clickedDate];
    }

    console.log('🎯 Setting bank holiday for days:', daysToProcess.map(d => d.toLocaleDateString()));
    setCapturedMultiDays(daysToProcess);

    const dayName = daysToProcess.length === 1
      ? daysToProcess[0].toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : `${daysToProcess.length} selected days`;

    // Detect task conflicts for all days
    let allConflicts: string[] = [];
    let allConflictingAssignmentIds: number[] = [];
    let totalConflictCount = 0;

    daysToProcess.forEach(date => {
      const conflictCheck = detectBankHolidayConflicts(date);
      if (conflictCheck.hasConflicts) {
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayConflicts = conflictCheck.conflicts.map(conflict => `${dayStr}: ${conflict}`);
        allConflicts.push(...dayConflicts);
        allConflictingAssignmentIds.push(...conflictCheck.conflictingAssignmentIds);
        totalConflictCount += conflictCheck.conflicts.length;
      }
    });

    let confirmMessage = `Are you sure you want to set ${dayName} as Bank Holiday${daysToProcess.length > 1 ? 's' : ''}?\n\nThis will block all slots for ALL team members on ${daysToProcess.length > 1 ? 'these days' : 'this day'}`;

    if (allConflicts.length > 0) {
      const conflictList = allConflicts.join('\n• ');
      confirmMessage += ` and delete the following existing tasks:\n\n• ${conflictList}`;
    }

    confirmMessage += '\n\nDo you want to proceed?';

    // Show custom confirmation dialog - CAPTURE the days in the closure!
    setConfirmDialog({
      isOpen: true,
      title: `Set Bank Holiday${daysToProcess.length > 1 ? 's' : ''}`,
      message: confirmMessage,
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          console.log('🎯 Setting bank holidays for captured days:', daysToProcess.map(d => d.toLocaleDateString()));

          // Mark that user has created leave (to disable mock data)
          localStorage.setItem('hasUserCreatedLeave', 'true');

          // ✅ STEP 1: Delete conflicting tasks FIRST (before creating bank holidays)
          if (allConflictingAssignmentIds.length > 0) {
            console.log(`🗑️ Deleting ${allConflictingAssignmentIds.length} conflicting assignments:`, allConflictingAssignmentIds);

            for (const assignmentId of allConflictingAssignmentIds) {
              try {
                await scheduleService.deleteAssignment(assignmentId);
                console.log(`✅ Deleted assignment ${assignmentId}`);
              } catch (error) {
                console.error(`❌ Failed to delete assignment ${assignmentId}:`, error);
                // Continue with other deletions, don't abort the whole process
              }
            }
            console.log('✅ All conflicting tasks deleted successfully');
          }

          // ✅ STEP 2: DATABASE-BASED bank holiday creation
          // Process all captured days (use daysToProcess from closure, not state!)
          for (const date of daysToProcess) {
            try {
              // Create bank holiday for ALL team members using absence records
              const allEmployees = calendarData?.employees || [];
              console.log(`🏦 Creating bank holiday for ${date.toLocaleDateString()} for ${allEmployees.length} employees`);

              for (const employee of allEmployees) {
                // Fix timezone issue - use local date instead of UTC
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const bankHolidayRecord = {
                  employeeId: employee.employeeId,
                  startDate: dateStr,
                  endDate: dateStr,
                  absenceType: 4, // BankHoliday = 4
                  hours: 8, // Full day
                  notes: 'Bank Holiday'
                  // Note: Backend auto-approves records (IsApproved = true)
                };

                await absenceService.createAbsenceRecord(bankHolidayRecord);
                console.log(`✅ Created bank holiday for employee ${employee.employeeName} on ${date.toLocaleDateString()}`);
              }
            } catch (error) {
              console.error(`❌ Failed to create bank holiday for ${date.toLocaleDateString()}:`, error);
              throw error; // Re-throw to show error notification
            }
          }

          // Refresh calendar data to show new bank holidays
          await loadCalendarData();

          // Clear selections after successful operation
          setSelectedDays([]);
          setCapturedMultiDays([]);

          // Show success notification
          const conflictMessage = totalConflictCount > 0
            ? `${totalConflictCount} existing task(s) were deleted.`
            : '';

          const successDayName = daysToProcess.length === 1
            ? daysToProcess[0].toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : `${daysToProcess.length} days`;

          showNotification({
            type: 'success',
            title: `Bank Holiday${daysToProcess.length > 1 ? 's' : ''} Set Successfully`,
            message: `${successDayName} ${daysToProcess.length > 1 ? 'have' : 'has'} been set as Bank Holiday${daysToProcess.length > 1 ? 's' : ''}.${conflictMessage ? '\n' + conflictMessage : ''}`
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
  }, [selectedDays, detectBankHolidayConflicts, showNotification, confirmDialog, addBankHolidayToCalendarData]);

  /**
   * Handle leave creation - opens modal to select team members and leave type for selected date(s)
   */
  const handleSetLeave = useCallback(async (clickedDate: Date) => {
    // CAPTURE multi-day selection immediately (like handleTaskPasteMultiple pattern)
    let daysToProcess: Date[] = [];
    if (selectedDays.length > 0) {
      // Check if clicked day is in the selection
      const isCurrentInSelection = selectedDays.some(d => d.toDateString() === clickedDate.toDateString());
      if (isCurrentInSelection) {
        // Clicked day is part of selection - process all selected days
        daysToProcess = [...selectedDays];
      } else {
        // Clicked day is NOT in selection - only process this day
        daysToProcess = [clickedDate];
      }
    } else {
      // No selection - process only clicked day
      daysToProcess = [clickedDate];
    }

    console.log('🎯 Setting leave for days:', daysToProcess.map(d => d.toLocaleDateString()));
    setCapturedMultiDays(daysToProcess);

    // For multi-day leave, we use the first selected day as the "primary" date for the modal
    setSelectedLeaveDate(daysToProcess[0]);
    setSetLeaveModalOpen(true);
  }, [selectedDays]);

  /**
   * Handle clearing leave/holiday from a date
   */
  const handleClearBlocking = useCallback(async (clickedDate: Date) => {
    // CAPTURE multi-day selection immediately (like handleTaskPasteMultiple pattern)
    let daysToProcess: Date[] = [];
    if (selectedDays.length > 0) {
      // Check if clicked day is in the selection
      const isCurrentInSelection = selectedDays.some(d => d.toDateString() === clickedDate.toDateString());
      if (isCurrentInSelection) {
        // Clicked day is part of selection - process all selected days
        daysToProcess = [...selectedDays];
      } else {
        // Clicked day is NOT in selection - only process this day
        daysToProcess = [clickedDate];
      }
    } else {
      // No selection - process only clicked day
      daysToProcess = [clickedDate];
    }

    console.log('🎯 Clearing blocking for days:', daysToProcess.map(d => d.toLocaleDateString()));

    const dayName = daysToProcess.length === 1
      ? daysToProcess[0].toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : `${daysToProcess.length} selected days`;

    setConfirmDialog({
      isOpen: true,
      title: `Clear Blocking ${daysToProcess.length > 1 ? 'Days' : 'Day'}`,
      message: `Are you sure you want to clear all leave and holidays from ${dayName}?\n\nThis will remove any blocking slots and make ${daysToProcess.length > 1 ? 'these days' : 'the day'} available for tasks again.`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          console.log('🎯 Clearing blocking for captured days:', daysToProcess.map(d => d.toLocaleDateString()));

          // Process all captured days (use daysToProcess from closure, not state!)
          for (const date of daysToProcess) {
            // Clear from calendar data (immediate UI update)
            clearBlockingFromCalendarData(date);

            // Clear only leave-related data - DO NOT delete regular tasks
            try {
              console.log(`🗑️ Clearing leave data for ${date.toLocaleDateString()}`);

              // Delete absence records (annual leave, sick days, training, bank holidays)
              const recordsResult = await absenceService.deleteAbsenceRecordsByDate(date);
              console.log(`🗑️ Deleted ${recordsResult.deletedCount} absence records for ${date.toLocaleDateString()}`);

              // Clear assignments that have AbsenceType set (leave-related assignments)
              const assignmentsResult = await absenceService.clearAbsenceAssignmentsByDate(date);
              console.log(`🗑️ Cleared ${assignmentsResult.clearedCount} absence assignments for ${date.toLocaleDateString()}`);

              // Delete assignments with leave-related task types
              const leaveTasksResult = await absenceService.deleteLeaveTasksByDate(date);
              console.log(`🗑️ Deleted ${leaveTasksResult.deletedCount} leave task assignments for ${date.toLocaleDateString()}`);
            } catch (error) {
              console.warn(`Failed to delete absence data from backend for ${date.toLocaleDateString()}:`, error);
              // Don't fail the whole operation if backend deletion fails
            }

            // Remove from persistent storage AFTER database deletion to prevent re-merging
            removeLeaveFromStorage(date);
          }

          // Clear selections after successful operation
          setSelectedDays([]);

          const successDayName = daysToProcess.length === 1
            ? daysToProcess[0].toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : `${daysToProcess.length} days`;

          showNotification({
            type: 'success',
            title: `Blocking Cleared${daysToProcess.length > 1 ? ` (${daysToProcess.length} days)` : ''}`,
            message: `All leave and holidays have been cleared from ${successDayName}.`
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
  }, [selectedDays, confirmDialog, clearBlockingFromCalendarData, showNotification]);

  /**
   * Detect task conflicts for leave setting
   */
  const detectTaskConflicts = useCallback((leaveData: {
    employeeIds: number[];
    duration: number;
    slot?: number;
    date: Date;
  }): { hasConflicts: boolean; conflicts: string[]; conflictingAssignmentIds: number[] } => {
    if (!calendarData) {
      return { hasConflicts: false, conflicts: [], conflictingAssignmentIds: [] };
    }

    const conflicts: string[] = [];
    const conflictingAssignmentIds: number[] = [];
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
            conflictingAssignmentIds.push(task.assignmentId);
          });
        }

        if (afternoonTasks.length > 0) {
          afternoonTasks.forEach(task => {
            conflicts.push(`${employee.employeeName}: Afternoon - ${task.taskName}`);
            conflictingAssignmentIds.push(task.assignmentId);
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
            conflictingAssignmentIds.push(task.assignmentId);
          });
        }
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      conflictingAssignmentIds
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

      async function proceedWithLeaveCreation() {
        try {
          console.log('Creating leave:', leaveData);

          // ✅ STEP 1: Delete conflicting tasks FIRST (before creating leave)
          if (conflictCheck.conflictingAssignmentIds.length > 0) {
            console.log(`🗑️ Deleting ${conflictCheck.conflictingAssignmentIds.length} conflicting assignments:`, conflictCheck.conflictingAssignmentIds);

            for (const assignmentId of conflictCheck.conflictingAssignmentIds) {
              try {
                await scheduleService.deleteAssignment(assignmentId);
                console.log(`✅ Deleted assignment ${assignmentId}`);
              } catch (error) {
                console.error(`❌ Failed to delete assignment ${assignmentId}:`, error);
                // Continue with other deletions, don't abort the whole process
              }
            }
            console.log('✅ All conflicting tasks deleted successfully');
          }

          // Process all captured days (for multi-day leave)
          const daysToProcess = capturedMultiDays.length > 0 ? capturedMultiDays : [leaveData.date];

          console.log('🎯 Processing leave for captured days:', daysToProcess.map(d => d.toLocaleDateString()));

          // Create AbsenceRecords for each employee and each day
          for (const date of daysToProcess) {
            for (const employeeId of leaveData.employeeIds) {
              // Format date for API
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const startDate = `${year}-${month}-${day}`;
              const endDate = startDate; // Single day leave

              // Calculate hours based on duration
              const hours = leaveData.duration === 1 ? 8 : 4; // Full day = 8 hours, Half day = 4 hours

              // Create absence record
              const absenceRecord = {
                employeeId: employeeId,
                startDate: startDate,
                endDate: endDate,
                absenceType: leaveData.leaveType,
                hours: hours,
                slot: leaveData.duration === 2 ? leaveData.slot : undefined, // Only include slot for half-day leaves
                notes: `${leaveData.leaveType === 1 ? 'Annual Leave' : leaveData.leaveType === 2 ? 'Sick Day' : 'Training'}${leaveData.duration === 2 ? ' - Half Day' : ''}`
              };

              console.log('🎯 Creating absence record:', absenceRecord);

              // Create absence record via API
              await absenceService.createAbsenceRecord(absenceRecord);

              // Also save to local storage for immediate UI update (like bank holidays)
              addLeaveToStorage(
                employeeId,
                date,
                leaveData.leaveType as LeaveType,
                leaveData.duration as LeaveDuration,
                leaveData.slot as Slot | undefined
              );
            }

            // Update calendar data immediately for each day
            addLeaveToCalendarData({ ...leaveData, date });
          }

          // Clear selections after successful operation
          setSelectedDays([]);
          setCapturedMultiDays([]);

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

          const dateInfo = daysToProcess.length === 1
            ? `Date: ${daysToProcess[0].toLocaleDateString()}`
            : `Dates: ${daysToProcess.length} selected days (${daysToProcess[0].toLocaleDateString()} - ${daysToProcess[daysToProcess.length - 1].toLocaleDateString()})`;

          const leaveDetails = `Employees: ${employeeNames}
Type: ${leaveTypeNames[leaveData.leaveType as keyof typeof leaveTypeNames]}
Duration: ${duration}
${dateInfo}`;

          showNotification({
            type: 'success',
            title: `Leave Set Successfully${daysToProcess.length > 1 ? ` (${daysToProcess.length} days)` : ''}`,
            message: `${leaveDetails}${conflictMessage ? '\n\n' + conflictMessage : ''}`
          });

          // Refresh calendar data to show new assignments
          await loadCalendarData(
            teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
            teamViewMode
          );

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
  }, [calendarData, capturedMultiDays, detectTaskConflicts, showNotification, confirmDialog, addLeaveToCalendarData]);

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
    loadTaskTypes();
  }, []); // Only run once on mount

  // Initialize SignalR connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('🔗 Initializing SignalR connection for real-time updates...');
      signalRService.start();

      // Set up schedule update listeners
      const handleAssignmentUpdate = (assignment: any) => {
        console.log('🔄 Real-time assignment update received:', assignment);
        console.log('🔍 SignalR - DISABLED auto-reload to prevent window jumping');
        // DON'T reload calendar data here - this causes window position jumping
        // The manual reload in handleTaskDrop is sufficient for immediate updates
        // SignalR updates are for other users' changes, not our own
      };

      const handleBulkAssignmentsUpdate = (assignments: any[]) => {
        console.log('🔄 Real-time bulk assignments update received:', assignments);
        // Calendar data will refresh automatically via useEffect dependencies
        // DO NOT call loadCalendarData here as it can trigger window position changes
      };

      signalRService.addListener('assignmentUpdated', handleAssignmentUpdate);
      signalRService.addListener('bulkAssignmentsUpdated', handleBulkAssignmentsUpdate);

      // Cleanup on component unmount
      return () => {
        console.log('🔗 Cleaning up SignalR listeners...');
        signalRService.removeListener('assignmentUpdated', handleAssignmentUpdate);
        signalRService.removeListener('bulkAssignmentsUpdated', handleBulkAssignmentsUpdate);
        signalRService.stop();
      };
    }
  }, []); // Only run once on mount

  // Set teamViewMode based on user role
  useEffect(() => {
    console.log('🔍 ROLE DETECTION - userContext.role:', userContext.role, 'type:', typeof userContext.role);
    if (userContext.role === 'Admin') {
      console.log('🔍 Setting Admin user to AllTeams mode');
      setTeamViewMode(TeamViewMode.AllTeams);
    } else {
      console.log('🔍 Setting non-Admin user to MyTeam mode');
      setTeamViewMode(TeamViewMode.MyTeam);
    }
  }, [userContext.role]);

  // Load calendar data when ONLY essential dependencies change (not windowStartDate or viewType!)
  useEffect(() => {
    // Load calendar data if:
    // 1. Teams are loaded (for Admin/Manager users), OR
    // 2. We're in AllTeams mode (for Admin users), OR
    // 3. We have a valid userContext and it's a TeamMember (they don't need teams loaded)
    if (teams.length > 0 || teamViewMode === TeamViewMode.AllTeams || (userContext && userContext.role === 'TeamMember')) {
      console.log('🔍 Loading calendar data due to team/mode change');
      console.log('🔍 Condition met - teams.length:', teams.length, 'teamViewMode:', teamViewMode, 'userContext.role:', userContext?.role);
      loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    } else {
      console.log('🔍 Calendar data loading skipped - teams.length:', teams.length, 'teamViewMode:', teamViewMode, 'userContext.role:', userContext?.role);
    }
  }, [loadCalendarData, teams.length, managedTeamId, teamViewMode, userContext]); // Added userContext dependency

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
        if (selectedDays.length > 0) {
          setSelectedDays([]);
          clearedItems.push(`${selectedDays.length} selected day${selectedDays.length > 1 ? 's' : ''}`);
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
  }, [copiedTask, selectedTasks, selectedSlots, selectedDays, handleTaskCopy, handleTaskPaste, handleTaskDelete, showNotification]);

  // Transform teams for UI components
  const teamsForUI = teamService.transformTeamsForUI(teams);

  // Global click handler to clear selections when LEFT clicking elsewhere
  const handleGlobalClick = useCallback((e: React.MouseEvent) => {
    // Only clear on LEFT click (button 0), not right-click (button 2)
    if (e.button !== 0) {
      return;
    }

    // Don't clear if clicking on a task, day header, or within a context menu
    const target = e.target as HTMLElement;
    const isTaskClick = target.closest('[data-task-card]') || target.closest('[data-context-menu]');
    const isDayClick = target.closest('[data-day-header]');

    if (!isTaskClick && !isDayClick) {
      setSelectedTasks([]);
      setSelectedDays([]);
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
        onLogoClick={handleLogoClick}
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
            employees={filteredEmployees}
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
            isReadOnly={false}
            onSetBankHoliday={handleSetBankHoliday}
            onSetLeave={handleSetLeave}
            onClearBlocking={handleClearBlocking}
            onDayViewDetails={handleDayViewDetails}
            selectedTaskIds={selectedTasks.map(task => task.assignmentId)}
            selectedSlots={selectedSlots}
            onSlotFocus={handleSlotFocus}
            selectedDays={selectedDays.map(d => d.toDateString())}
            onDayClick={handleDayClick}
            onBulkEdit={() => setBulkEditModalOpen(true)}
            onRefresh={loadCalendarData}
            onQuickEditTaskType={(task) => {
              console.log('QuickEdit TaskType clicked:', task.assignmentId, 'Selected tasks:', selectedTasks.map(t => t.assignmentId));

              // Reload task types to get latest from database
              loadTaskTypes();

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
            onTeamFilter={handleTeamFilter}
            selectedTeamFilters={teamFilters}
            onRefresh={handleRefresh}
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
          Total Employees: {calendarData?.employees.length || 0},
          Filtered Employees: {filteredEmployees.length},
          Team Filters: {JSON.stringify(teamFilters)}
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
          existingSlotTasks={(() => {
            // Find existing tasks in the target slot
            console.log('🔍 TEAMSCHEDULE SLOT CALCULATION:', {
              hasCalendarData: !!calendarData,
              employeeId: taskModalData.employeeId,
              slot: taskModalData.slot,
              originalDate: taskModalData.date,
              dateISO: taskModalData.date.toISOString(),
              dateFormatted: taskModalData.date.toISOString().split('T')[0],
              dateLocalString: taskModalData.date.toLocaleDateString()
            });

            if (!calendarData) {
              console.log('❌ No calendar data');
              return [];
            }

            const employee = calendarData.employees.find(emp => emp.employeeId === taskModalData.employeeId);
            console.log('👤 Found employee:', employee ? `Yes (${employee.employeeName})` : 'No');
            if (!employee) return [];

            // Fix timezone issue: use local date instead of UTC to avoid day shift
            const year = taskModalData.date.getFullYear();
            const month = String(taskModalData.date.getMonth() + 1).padStart(2, '0');
            const day = String(taskModalData.date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            console.log('📅 Looking for date:', dateStr);
            console.log('📅 Available dates in assignments:', employee.dayAssignments.map(d => ({
              original: d.date,
              formatted: d.date.split('T')[0]
            })));

            const dayAssignment = employee.dayAssignments.find(day => day.date.split('T')[0] === dateStr);
            console.log('📅 Found day assignment:', dayAssignment ? 'Yes' : 'No');
            if (!dayAssignment) return [];

            const slotData = taskModalData.slot === 1 ? dayAssignment.morningSlot : dayAssignment.afternoonSlot;
            console.log(`⏰ ${taskModalData.slot === 1 ? 'Morning' : 'Afternoon'} slot data:`, slotData);
            console.log('📋 Slot tasks:', slotData?.tasks || []);

            return slotData?.tasks || [];
          })()}
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
        taskTypes={taskTypes}
      />

      {/* Quick Edit Modals */}
      <QuickEditTaskType
        isOpen={quickEditTaskTypeOpen}
        selectedTasks={capturedQuickEditTasks}
        taskTypes={taskTypes}
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
            setCapturedMultiDays([]);
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

      {/* Database Management Modal */}
      <DatabaseManagementModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onDataChange={handleDatabaseDataChange}
        calendarRefreshTrigger={databaseRefreshTrigger}
      />

      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboardModal
        open={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      {/* Absence Management Modal */}
      <AbsenceManagementModal
        open={showAbsenceModal}
        onClose={() => setShowAbsenceModal(false)}
        onRequestProcessed={() => {
          // Refresh data after absence changes
          loadCalendarData();
        }}
      />

      {/* Day Details Modal */}
      {selectedDayData && (
        <DayDetailsModal
          isOpen={dayDetailsModalOpen}
          onClose={() => {
            setDayDetailsModalOpen(false);
            setSelectedDayData(null);
          }}
          day={selectedDayData.day}
          employees={calendarData?.employees || []}
        />
      )}
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