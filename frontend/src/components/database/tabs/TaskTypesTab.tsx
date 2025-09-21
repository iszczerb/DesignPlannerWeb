import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import TaskTypeForm from '../forms/TaskTypeForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  TaskType,
  CreateTaskTypeDto,
  UpdateTaskTypeDto,
  TableColumn,
  BulkActionType,
  BulkActionResult,
  Skill
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import { taskTypeTaskCountService, TaskTypeTaskCount } from '../../../services/taskTypeTaskCountService';

interface TaskTypesTabProps {
  onEntityCountChange: (count: number) => void;
  onTaskCountsChange?: (taskCounts: TaskTypeTaskCount[]) => void;
  refreshTrigger?: number; // External trigger to refresh task counts
}

const TaskTypesTab: React.FC<TaskTypesTabProps> = ({ onEntityCountChange, onTaskCountsChange, refreshTrigger }) => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTaskType, setDeletingTaskType] = useState<TaskType | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [liveTaskCounts, setLiveTaskCounts] = useState<Map<number, { taskCount: number; projectCount: number }>>(new Map());

  useEffect(() => {
    loadTaskTypes();
    loadLiveTaskCounts();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(taskTypes) ? taskTypes.length : 0);
  }, [taskTypes]);

  // Respond to external refresh triggers (e.g., from calendar changes)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('🔄 TASK TYPES TAB - External refresh trigger received:', refreshTrigger);
      loadLiveTaskCounts();
    }
  }, [refreshTrigger]);

  const loadTaskTypes = async () => {
    console.log('🔄 TASK TYPES TAB - loadTaskTypes called');
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 TASK TYPES TAB - calling databaseService.getTaskTypes...');
      const data = await databaseService.getTaskTypes();
      console.log('📊 TASK TYPES TAB - getTaskTypes returned:', data);
      console.log('📊 TASK TYPES TAB - data is array:', Array.isArray(data));
      console.log('📊 TASK TYPES TAB - data length:', data?.length);
      const taskTypesArray = Array.isArray(data) ? data : [];
      console.log('📋 TASK TYPES TAB - setting task types to:', taskTypesArray);
      setTaskTypes(taskTypesArray);
      console.log('✅ TASK TYPES TAB - loadTaskTypes completed successfully');
    } catch (err) {
      console.log('❌ TASK TYPES TAB - error in loadTaskTypes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task types');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveTaskCounts = async () => {
    try {
      console.log('🔄 TASK TYPES TAB - loadLiveTaskCounts called');
      const taskCounts = await taskTypeTaskCountService.getTaskTypeTaskCounts();
      console.log('📊 TASK TYPES TAB - received live task counts:', taskCounts);

      // Convert to Map for efficient lookup
      const countsMap = new Map<number, { taskCount: number; projectCount: number }>();
      taskCounts.forEach(count => {
        countsMap.set(count.taskTypeId, {
          taskCount: count.taskCount,
          projectCount: count.projectCount
        });
      });

      setLiveTaskCounts(countsMap);

      // Notify parent component if callback provided
      if (onTaskCountsChange) {
        onTaskCountsChange(taskCounts);
      }

      console.log('✅ TASK TYPES TAB - loadLiveTaskCounts completed');
    } catch (err) {
      console.error('❌ TASK TYPES TAB - error in loadLiveTaskCounts:', err);
      // On error, clear the counts
      setLiveTaskCounts(new Map());
    }
  };

  const handleCreate = () => {
    setEditingTaskType(undefined);
    setShowForm(true);
  };

  const handleEdit = (taskType: TaskType) => {
    setEditingTaskType(taskType);
    setShowForm(true);
  };

  const handleDelete = (taskType: TaskType) => {
    setDeletingTaskType(taskType);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateTaskTypeDto | UpdateTaskTypeDto) => {
    console.log('🟢 TASK TYPES TAB - handleSave called with data:', data);
    try {
      setFormLoading(true);
      if (editingTaskType) {
        console.log('📝 TASK TYPES TAB - updating existing task type');
        await databaseService.updateTaskType(data as UpdateTaskTypeDto);
      } else {
        console.log('➕ TASK TYPES TAB - creating new task type');
        console.log('🚀 TASK TYPES TAB - calling databaseService.createTaskType...');
        const result = await databaseService.createTaskType(data as CreateTaskTypeDto);
        console.log('✅ TASK TYPES TAB - createTaskType returned:', result);
      }
      setShowForm(false);
      setEditingTaskType(undefined);
      console.log('🔄 TASK TYPES TAB - reloading task types...');
      await loadTaskTypes();
      await loadLiveTaskCounts(); // Refresh live counts after changes
      console.log('✅ TASK TYPES TAB - handleSave completed successfully');
    } catch (err) {
      console.log('❌ TASK TYPES TAB - error in handleSave:', err);
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingTaskType) return;

    try {
      await databaseService.deleteTaskType(deletingTaskType.id!);
      setShowDeleteConfirm(false);
      setDeletingTaskType(undefined);
      await loadTaskTypes();
      await loadLiveTaskCounts(); // Refresh live counts after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task type');
    }
  };





  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const skills = await databaseService.getSkills();
      setAllSkills(skills);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const getSkillsBadges = (skillIds: number[]) => {
    if (!skillIds || skillIds.length === 0) {
      return <span className="text-muted">No skills required</span>;
    }

    return (
      <div className="skills-badges">
        {skillIds.slice(0, 3).map((skillId) => {
          const skill = allSkills.find(s => s.id === skillId);
          return (
            <span key={skillId} className="skill-badge">
              {skill ? skill.name : `Skill ${skillId}`}
            </span>
          );
        })}
        {skillIds.length > 3 && (
          <span className="skill-badge-more">
            +{skillIds.length - 3} more
          </span>
        )}
      </div>
    );
  };


  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const columns: TableColumn<TaskType>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      width: '250px',
      render: (value) => value || '-'
    },
    {
      key: 'skills',
      label: 'Skills',
      sortable: false,
      width: '200px',
      render: (value) => getSkillsBadges(value)
    },
    {
      key: 'projectCount',
      label: 'Projects',
      sortable: true,
      width: '80px',
      render: (value, item) => {
        // Use live project count if available, otherwise fall back to database value
        const liveCount = liveTaskCounts.get(item.id!)?.projectCount ?? value ?? 0;
        return (
          <span className="count-badge">
            {liveCount}
          </span>
        );
      }
    },
    {
      key: 'taskCount',
      label: 'Tasks',
      sortable: true,
      width: '80px',
      render: (value, item) => {
        // Use live task count from assignments
        const liveCount = liveTaskCounts.get(item.id!)?.taskCount ?? 0;
        return (
          <span className="count-badge">
            {liveCount}
          </span>
        );
      }
    }
  ];


  const quickFilters = useMemo(() => [], [taskTypes]);

  const searchFields: (keyof TaskType)[] = ['name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={taskTypes}
        loading={loading}
        error={error}
        onRefresh={() => {
          loadTaskTypes();
          loadLiveTaskCounts();
        }}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={searchFields}
        quickFilters={quickFilters}
        enableSelection={false}
        enableBulkActions={false}
        getItemKey={(item) => item.id!}
        emptyMessage="No task types found. Create your first task type to get started."
        createButtonText="Add Task Type"
        actions={[]}
      />

      {/* Task Type Form Modal */}
      <TaskTypeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTaskType(undefined);
        }}
        onSave={handleSave}
        entity={editingTaskType}
        isCreating={!editingTaskType?.id}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task Type"
        message={`Are you sure you want to delete "${deletingTaskType?.name}"? This action cannot be undone and will affect all existing tasks of this type.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingTaskType(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default TaskTypesTab;