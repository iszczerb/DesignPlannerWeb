import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { AssignmentTaskDto, TaskPriority, TaskStatus, PRIORITY_LABELS, STATUS_LABELS } from '../../types/schedule';
import scheduleService from '../../services/scheduleService';
import { formatHours, calculateTaskHours } from '../../utils/hoursCalculator';
import { calculateActualHours } from '../../utils/taskLayoutHelpers';
import projectService, { ClientOption, ProjectOption, ProjectTaskOption } from '../../services/projectService';

interface TaskDetailsModalProps {
  open: boolean;
  onClose: () => void;
  task: AssignmentTaskDto | null;
  onUpdate?: (updatedTask: AssignmentTaskDto) => void;
  mode?: 'view' | 'edit';
  slotTasks?: AssignmentTaskDto[]; // Other tasks in the same slot for validation
}

// Helper function to get actual task hours based on visual column occupancy
const getTaskActualHours = (task: AssignmentTaskDto, taskIndex: number, slotTasks: AssignmentTaskDto[]): string => {
  const actualHours = calculateActualHours(task, taskIndex, slotTasks.length);
  return `${actualHours}h`;
};

// Helper function to get just the task type name for display
const getTaskTypeName = (task: AssignmentTaskDto): string => {
  return task.taskTypeName;
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  open,
  onClose,
  task,
  onUpdate,
  mode: initialMode = 'view',
  slotTasks = [],
}) => {
  const [mode, setMode] = useState(initialMode);
  const [editedTask, setEditedTask] = useState<Partial<AssignmentTaskDto & { taskStatus?: TaskStatus }>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Options for dropdowns
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTaskOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [preserveTaskTypeName, setPreserveTaskTypeName] = useState<string | null>(null);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [clientsData] = await Promise.all([
          projectService.getClients()
        ]);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      }
    };

    if (open && mode === 'edit') {
      loadDropdownData();
    }
  }, [open, mode]);

  // Load projects when client is selected
  useEffect(() => {
    const loadProjects = async () => {
      if (selectedClientId) {
        try {
          const projectsData = await projectService.getProjectsByClient(selectedClientId);
          setProjects(projectsData);
        } catch (error) {
          console.error('Error loading projects:', error);
        }
      } else {
        setProjects([]);
      }
    };

    loadProjects();
  }, [selectedClientId]);

  // Load project tasks when project is selected
  useEffect(() => {
    const loadProjectTasks = async () => {
      if (selectedProjectId) {
        try {
          const tasksData = await projectService.getProjectTasks(selectedProjectId);
          setProjectTasks(tasksData);
        } catch (error) {
          console.error('Error loading project tasks:', error);
        }
      } else {
        setProjectTasks([]);
      }
    };

    loadProjectTasks();
  }, [selectedProjectId]);

  // Auto-select task with matching task type when changing projects
  useEffect(() => {
    if (preserveTaskTypeName && projectTasks.length > 0) {
      const matchingTask = projectTasks.find(task => task.taskTypeName === preserveTaskTypeName);
      if (matchingTask) {
        setSelectedTaskId(matchingTask.id);
      }
      // Clear the preserve flag after attempting to match
      setPreserveTaskTypeName(null);
    }
  }, [projectTasks, preserveTaskTypeName]);

  // Reset when task changes or modal opens
  useEffect(() => {
    if (task && open) {
      setEditedTask({
        notes: task.notes || '',
        description: task.description || '',
        dueDate: task.dueDate,
        priority: task.priority,
        taskStatus: task.taskStatus,
      });
      
      setMode(initialMode);
      setErrors({});
    }
  }, [task, open, initialMode, slotTasks]);

  // Auto-select client when clients are loaded and task is available
  useEffect(() => {
    if (task && clients.length > 0) {
      const currentClient = clients.find(c => c.name === task.clientName);
      if (currentClient) {
        setSelectedClientId(currentClient.id);
      }
    }
  }, [task, clients]);

  // Auto-select project when projects are loaded
  useEffect(() => {
    if (task && projects.length > 0) {
      const currentProject = projects.find(p => p.name === task.projectName);
      if (currentProject) {
        setSelectedProjectId(currentProject.id);
      }
    }
  }, [task, projects]);

  // Auto-select task when project tasks are loaded
  useEffect(() => {
    if (task && projectTasks.length > 0) {
      setSelectedTaskId(task.taskId);
    }
  }, [task, projectTasks]);

  const handleEdit = () => {
    setMode('edit');
  };

  const handleCancel = () => {
    if (task) {
      setEditedTask({
        notes: task.notes || '',
        description: task.description || '',
        dueDate: task.dueDate,
        priority: task.priority,
        taskStatus: task.taskStatus,
      });
      
      // Reset selected values to original task values
      const currentClient = clients.find(c => c.name === task.clientName);
      if (currentClient) {
        setSelectedClientId(currentClient.id);
      }
      
      const currentProject = projects.find(p => p.name === task.projectName);
      if (currentProject) {
        setSelectedProjectId(currentProject.id);
      }
      
      setSelectedTaskId(task.taskId);
    }
    setMode('view');
    setErrors({});
  };

  const handleSave = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const updateData = {
        assignmentId: task.assignmentId,
        taskId: selectedTaskId || task.taskId, // Use selectedTaskId if available, otherwise keep original
        notes: editedTask.notes !== undefined ? editedTask.notes : task.notes,
        description: editedTask.description !== undefined ? editedTask.description : task.description,
        dueDate: editedTask.dueDate || undefined,
        priority: editedTask.priority !== undefined ? editedTask.priority : undefined,
        taskStatus: editedTask.taskStatus !== undefined ? editedTask.taskStatus : undefined,
      };
      
      console.log('Updating task with data:', updateData);

      const updatedTask = await scheduleService.updateAssignment(updateData);
      
      console.log('Task updated:', updatedTask);
      
      if (onUpdate) {
        onUpdate(updatedTask);
      }
      
      setMode('view');
      setErrors({});
    } catch (error) {
      console.error('Error updating task:', error);
      setErrors({ save: 'Failed to update task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.Low: return 'default';
      case TaskPriority.Medium: return 'primary';
      case TaskPriority.High: return 'warning';
      case TaskPriority.Critical: return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#6b7280'; // Not Started - Gray
      case 2: return '#f59e0b'; // In Progress - Yellow
      case 3: return '#10b981'; // Completed - Green
      case 4: return '#ef4444'; // On Hold - Red
      default: return '#6b7280';
    }
  };

  if (!task) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            {mode === 'edit' ? '✏️ Edit Task' : '👁️ Task Details'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assignment ID: {task.assignmentId} {mode === 'edit' && '• Editing Mode'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Task Overview Card */}
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {selectedProjectId ?
                    (projects.find(p => p.id === selectedProjectId)?.name || task.projectName)
                    : task.projectName
                  } - {selectedTaskId ?
                    (projectTasks.find(t => t.id === selectedTaskId)?.taskTypeName || getTaskTypeName(task))
                    : getTaskTypeName(task)
                  }
                </Typography>

                {/* Enhanced Task Type Information */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`Category: ${getTaskTypeName(task)}`}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={`ID: ${task.taskId}`}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  {task.taskTitle && task.taskTitle !== getTaskTypeName(task) && (
                    <Chip
                      label={`Title: ${task.taskTitle}`}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Client
                    </Typography>
                    {mode === 'edit' ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedClientId || ''}
                          onChange={(e) => {
                            const clientId = e.target.value as number;
                            setSelectedClientId(clientId);
                            setSelectedProjectId(null);
                            setSelectedTaskId(null);
                          }}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select Client</em>
                          </MenuItem>
                          {clients.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                              {client.code} - {client.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body1" fontWeight="medium">
                        {selectedClientId ? 
                          clients.find(c => c.id === selectedClientId)?.name || task.clientName
                          : task.clientName
                        }
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Project
                    </Typography>
                    {mode === 'edit' ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedProjectId || ''}
                          onChange={(e) => {
                            const projectId = e.target.value as number;
                            
                            // Preserve task type name if a task is currently selected
                            const currentTaskTypeName = selectedTaskId ? 
                              projectTasks.find(t => t.id === selectedTaskId)?.taskTypeName || task?.taskTypeName
                              : task?.taskTypeName;
                            
                            if (currentTaskTypeName) {
                              setPreserveTaskTypeName(currentTaskTypeName);
                            }
                            
                            setSelectedProjectId(projectId);
                            setSelectedTaskId(null);
                          }}
                          disabled={!selectedClientId}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select Project</em>
                          </MenuItem>
                          {projects.map((project) => (
                            <MenuItem key={project.id} value={project.id}>
                              {project.code} - {project.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body1" fontWeight="medium">
                        {selectedProjectId ? 
                          projects.find(p => p.id === selectedProjectId)?.name || task.projectName
                          : task.projectName
                        }
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Task Details
                    </Typography>
                    {mode === 'edit' ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedTaskId || ''}
                          onChange={(e) => setSelectedTaskId(e.target.value as number)}
                          disabled={!selectedProjectId}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select Task</em>
                          </MenuItem>
                          {projectTasks.map((projectTask) => (
                            <MenuItem key={projectTask.id} value={projectTask.id}>
                              {projectTask.title} ({projectTask.taskTypeName})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body1" fontWeight="medium">
                        {selectedTaskId ?
                          projectTasks.find(t => t.id === selectedTaskId)?.taskTypeName || getTaskTypeName(task)
                          : getTaskTypeName(task)
                        }
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Assigned Employee
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {task.employeeName}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Task Hours
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {task ? getTaskActualHours(task, slotTasks.findIndex(t => t.assignmentId === task.assignmentId), slotTasks) : '0h'}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Status
                    </Typography>
                    {mode === 'edit' ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editedTask.taskStatus || task.taskStatus}
                          onChange={(e) => setEditedTask({ 
                            ...editedTask, 
                            taskStatus: e.target.value as TaskStatus 
                          })}
                          displayEmpty
                        >
                          <MenuItem value={1}>Not Started</MenuItem>
                          <MenuItem value={2}>In Progress</MenuItem>
                          <MenuItem value={3}>Done</MenuItem>
                          <MenuItem value={4}>On Hold</MenuItem>
                          <MenuItem value={5}>Blocked</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(editedTask.taskStatus !== undefined ? editedTask.taskStatus : task.taskStatus),
                          }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {STATUS_LABELS[editedTask.taskStatus !== undefined ? editedTask.taskStatus : task.taskStatus]}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Priority
                    </Typography>
                    {mode === 'edit' ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editedTask.priority || task.priority}
                          onChange={(e) => setEditedTask({ 
                            ...editedTask, 
                            priority: e.target.value as TaskPriority 
                          })}
                          displayEmpty
                        >
                          <MenuItem value={1}>Low</MenuItem>
                          <MenuItem value={2}>Medium</MenuItem>
                          <MenuItem value={3}>High</MenuItem>
                          <MenuItem value={4}>Critical</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip 
                        label={PRIORITY_LABELS[editedTask.priority !== undefined ? editedTask.priority : task.priority]}
                        color={getPriorityColor(editedTask.priority !== undefined ? editedTask.priority : task.priority)}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Task Description Section */}
            {task.description && (
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Task Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {task.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Divider />

            {/* Editable Fields */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Assignment Details
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Due Date
                  </Typography>
                  {mode === 'edit' ? (
                    <DatePicker
                      label="Due Date"
                      value={editedTask.dueDate ? dayjs(editedTask.dueDate) : null}
                      onChange={(newValue) => 
                        setEditedTask({ 
                          ...editedTask, 
                          dueDate: newValue?.format('YYYY-MM-DD') || undefined 
                        })
                      }
                      sx={{ width: '100%' }}
                      minDate={dayjs()}
                    />
                  ) : (
                    <Typography variant="body1">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Schedule
                  </Typography>
                  <Typography variant="body1">
                    {task.assignedDate ? (() => {
                      try {
                        // Handle both ISO string format and simple date strings
                        const date = new Date(task.assignedDate);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString();
                        }
                        // Fallback: try parsing as YYYY-MM-DD format
                        const dateParts = task.assignedDate.split('T')[0].split('-');
                        if (dateParts.length === 3) {
                          const fallbackDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                          return fallbackDate.toLocaleDateString();
                        }
                        return task.assignedDate;
                      } catch {
                        return task.assignedDate;
                      }
                    })() : 'No date set'} • {task.slot === 1 ? 'Morning' : 'Afternoon'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Task Hours
                  </Typography>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {task ? getTaskActualHours(task, slotTasks.findIndex(t => t.assignmentId === task.assignmentId), slotTasks) : '0h'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Based on visual column occupancy
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Task Description
                  </Typography>
                  {mode === 'edit' ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={editedTask.description || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      placeholder="Enter task description..."
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {task.description || 'No description provided'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Assignment Notes
                  </Typography>
                  {mode === 'edit' ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={editedTask.notes || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                      placeholder="Add assignment notes..."
                    />
                  ) : (
                    <Typography variant="body1" sx={{ minHeight: '60px' }}>
                      {task.notes || 'No notes added'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Error Display */}
            {errors.save && (
              <Typography color="error" variant="body2">
                {errors.save}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          {mode === 'view' ? (
            <>
              <Button onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleEdit} variant="contained" startIcon={<EditIcon />}>
                Edit Task
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancel} startIcon={<CancelIcon />} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskDetailsModal;