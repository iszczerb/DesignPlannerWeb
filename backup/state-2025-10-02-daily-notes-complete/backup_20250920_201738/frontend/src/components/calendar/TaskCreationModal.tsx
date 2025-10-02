import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Slot, TaskPriority, TaskStatus, CreateAssignmentDto } from '../../types/schedule';
import projectService, { ClientOption, ProjectOption, TaskTypeOption } from '../../services/projectService';

interface TaskCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assignment: CreateAssignmentDto) => Promise<void>;
  initialDate: Date;
  initialSlot: Slot;
  employeeId: number;
  employeeName: string;
}


const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialDate,
  initialSlot,
  employeeId,
  employeeName,
}) => {
  const [formData, setFormData] = useState({
    client: null as ClientOption | null,
    project: null as ProjectOption | null,
    taskType: null as TaskTypeOption | null,
    description: '',
    priority: null as TaskPriority | null,
    status: TaskStatus.NotStarted as TaskStatus, // Default to Not Started
    dueDate: null as Dayjs | null, // Default to blank
    notes: '',
  });
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        client: null,
        project: null,
        taskType: null,
        description: '',
        priority: null,
        status: TaskStatus.NotStarted,
        dueDate: null,
        notes: '',
      });
      setErrors({});
      setProjects([]);
    }
  }, [open, initialDate]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [clientsData, taskTypesData] = await Promise.all([
        projectService.getClients(),
        projectService.getTaskTypes()
      ]);
      setClients(clientsData);
      setTaskTypes(taskTypesData);
    } catch (error) {
      console.error('Error loading clients and task types:', error);
      setErrors({ submit: 'Failed to load project data. Please try again.' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleClientChange = async (newClient: ClientOption | null) => {
    setFormData({ 
      ...formData, 
      client: newClient,
      project: null,
      taskType: null
    });
    
    if (newClient) {
      try {
        const projectsData = await projectService.getProjectsByClient(newClient.id);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
  };

  const handleProjectChange = async (newProject: ProjectOption | null) => {
    setFormData({ 
      ...formData, 
      project: newProject,
      taskType: null
    });
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client) {
      newErrors.client = 'Client is required';
    }
    if (!formData.project) {
      newErrors.project = 'Project is required';
    }
    if (!formData.taskType) {
      newErrors.taskType = 'Task type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Format date without timezone conversion to avoid day shift issues
      const year = initialDate.getFullYear();
      const month = String(initialDate.getMonth() + 1).padStart(2, '0');
      const day = String(initialDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00`;

      const assignment: CreateAssignmentDto = {
        taskId: 0, // Will be created by backend
        employeeId: employeeId,
        assignedDate: dateString,
        slot: initialSlot,
        projectId: formData.project!.id,
        taskTypeId: formData.taskType!.id,
        title: formData.description || `${formData.taskType!.name} - ${formData.project!.name}`,
        description: formData.description || undefined,
        priority: formData.priority || undefined,
        status: formData.status || undefined,
        notes: formData.notes || undefined,
      };

      console.log('📤 Sending assignment data:', assignment);
      await onSubmit(assignment);
      onClose();
    } catch (error) {
      console.error('Error creating task assignment:', error);
      setErrors({ submit: 'Failed to create task assignment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const slotLabel = initialSlot === Slot.Morning ? 'Morning' : 'Afternoon';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Create New Task Assignment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {employeeName} • {initialDate.toLocaleDateString()} • {slotLabel}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Client Selection */}
            <Autocomplete
              value={formData.client}
              onChange={(_, newValue) => handleClientChange(newValue)}
              options={clients}
              loading={dataLoading}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Client"
                  error={!!errors.client}
                  helperText={errors.client}
                  required
                />
              )}
            />

            {/* Project Selection */}
            <Autocomplete
              value={formData.project}
              onChange={(_, newValue) => handleProjectChange(newValue)}
              options={projects}
              disabled={!formData.client}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project"
                  error={!!errors.project}
                  helperText={errors.project || (!formData.client ? 'Select a client first' : '')}
                  required
                />
              )}
            />

            {/* Task Type Selection */}
            <Autocomplete
              value={formData.taskType}
              onChange={(_, newValue) => setFormData({ ...formData, taskType: newValue })}
              options={taskTypes}
              disabled={!formData.project}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description || 'Task type'}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Task Type"
                  error={!!errors.taskType}
                  helperText={errors.taskType || (!formData.project ? 'Select a project first' : '')}
                  required
                />
              )}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              placeholder="Optional task description..."
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Priority */}
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Priority (Optional)</InputLabel>
                <Select
                  value={formData.priority || ''}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority || null })}
                  label="Priority (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={TaskPriority.Low}>
                    <Chip label="Low" color="default" size="small" />
                  </MenuItem>
                  <MenuItem value={TaskPriority.Medium}>
                    <Chip label="Medium" color="primary" size="small" />
                  </MenuItem>
                  <MenuItem value={TaskPriority.High}>
                    <Chip label="High" color="warning" size="small" />
                  </MenuItem>
                  <MenuItem value={TaskPriority.Critical}>
                    <Chip label="Critical" color="error" size="small" />
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Status */}
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  label="Status"
                >
                  <MenuItem value={TaskStatus.NotStarted}>Not Started</MenuItem>
                  <MenuItem value={TaskStatus.InProgress}>In Progress</MenuItem>
                  <MenuItem value={TaskStatus.Done}>Done</MenuItem>
                  <MenuItem value={TaskStatus.OnHold}>On Hold</MenuItem>
                  <MenuItem value={TaskStatus.Blocked}>Blocked</MenuItem>
                </Select>
              </FormControl>

              {/* Due Date */}
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(newValue) => setFormData({ ...formData, dueDate: newValue ? (dayjs.isDayjs(newValue) ? newValue : dayjs(newValue)) : null })}
                sx={{ flex: 1 }}
                minDate={dayjs()}
              />
            </Box>

            {/* Notes */}
            <TextField
              label="Assignment Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
              placeholder="Optional notes for this assignment..."
            />

            {/* Error Display */}
            {errors.submit && (
              <Typography color="error" variant="body2">
                {errors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskCreationModal;