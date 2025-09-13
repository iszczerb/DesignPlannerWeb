import React, { useState, useEffect, useCallback } from 'react';
import TeamCalendarView from '../components/calendar/TeamCalendarView';
import TaskCreationModal from '../components/calendar/TaskCreationModal';
import TaskDetailsModal from '../components/calendar/TaskDetailsModal';
import { TeamViewMode } from '../components/calendar/TeamToggle';
import { 
  CalendarViewType, 
  CalendarViewDto,
  AssignmentTaskDto,
  Slot,
  ScheduleRequestDto,
  CreateAssignmentDto
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

const TeamSchedule: React.FC = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
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
  const [selectedTask, setSelectedTask] = useState<AssignmentTaskDto | null>(null);
  const [taskDetailsMode, setTaskDetailsMode] = useState<'view' | 'edit'>('view');
  const [slotTasks, setSlotTasks] = useState<AssignmentTaskDto[]>([]);

  // Clipboard state for copy/paste functionality
  const [copiedTask, setCopiedTask] = useState<AssignmentTaskDto | null>(null);

  // Mock user context
  const [userContext] = useState<UserContext>({
    id: 1,
    role: 'Manager', // or 'Admin', 'TeamMember'
    name: 'John Manager'
  });

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
        startDate: currentDate,
        viewType: viewType,
        includeInactive: false
      };

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

      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load schedule data');
      setCalendarData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, viewType, teamViewMode]);

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
  const handleTaskClick = useCallback((task: AssignmentTaskDto) => {
    console.log('Task clicked:', task);
    // Disabled: Use right-click context menu instead
  }, []);

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

  /**
   * Handle date changes
   */
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    // Calendar data will be reloaded by useEffect
  }, []);

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
    setSelectedTask(task);
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
    setSelectedTask(task);
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
   * Handle task update from details modal
   */
  const handleTaskUpdate = useCallback(async (updatedTask: AssignmentTaskDto) => {
    console.log('Task updated:', updatedTask);
    
    // Update only the specific task in the calendar data instead of reloading everything
    setCalendarData(prevData => {
      if (!prevData) return prevData;
      
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

  // Load initial data
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Load calendar data when dependencies change
  useEffect(() => {
    if (teams.length > 0 || teamViewMode === TeamViewMode.AllTeams) {
      loadCalendarData(
        teamViewMode === TeamViewMode.MyTeam ? managedTeamId : undefined,
        teamViewMode
      );
    }
  }, [loadCalendarData, teams.length, managedTeamId, teamViewMode, currentDate, viewType]);

  // Transform teams for UI components
  const teamsForUI = teamService.transformTeamsForUI(teams);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f9fafb',
    }}>
      {/* Page Header */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0,
          }}>
            Team Schedule Management
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '4px 0 0',
          }}>
            Welcome back, {userContext.name} ({userContext.role})
          </p>
        </div>
        
        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '0.875rem',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Team Calendar View */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TeamCalendarView
          currentDate={currentDate}
          viewType={viewType}
          onDateChange={handleDateChange}
          onViewTypeChange={handleViewTypeChange}
          calendarData={calendarData}
          teams={teamsForUI}
          isLoading={isLoading}
          userRole={userContext.role}
          managedTeamId={managedTeamId}
          currentTeamName={currentTeamName}
          onRefresh={handleRefresh}
          onTaskClick={handleTaskClick}
          onSlotClick={handleSlotClick}
          onTaskDrop={handleTaskDrop}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onTaskView={handleTaskView}
          onTaskCopy={handleTaskCopy}
          onTaskPaste={handleTaskPaste}
          hasCopiedTask={!!copiedTask}
          onTeamViewChange={handleTeamViewChange}
          onFetchTeamData={handleFetchTeamData}
        />
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
          setSelectedTask(null);
          setSlotTasks([]);
        }}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        mode={taskDetailsMode}
        slotTasks={slotTasks}
      />
    </div>
  );
};

export default TeamSchedule;