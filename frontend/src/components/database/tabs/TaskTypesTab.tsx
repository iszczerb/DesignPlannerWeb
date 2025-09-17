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
  BulkActionResult
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface TaskTypesTabProps {
  onEntityCountChange: (count: number) => void;
}

const TaskTypesTab: React.FC<TaskTypesTabProps> = ({ onEntityCountChange }) => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTaskType, setDeletingTaskType] = useState<TaskType | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTaskTypes();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(taskTypes) ? taskTypes.length : 0);
  }, [taskTypes]);

  const loadTaskTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getTaskTypes();
      setTaskTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task types');
    } finally {
      setLoading(false);
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
    try {
      setFormLoading(true);
      if (editingTaskType) {
        await databaseService.updateTaskType(data as UpdateTaskTypeDto);
      } else {
        await databaseService.createTaskType(data as CreateTaskTypeDto);
      }
      setShowForm(false);
      setEditingTaskType(undefined);
      await loadTaskTypes();
    } catch (err) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task type');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: TaskType[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateTaskTypes(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateTaskTypes(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteTaskTypes(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportTaskTypes(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadTaskTypes();
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Bulk action failed',
        affectedCount: 0
      };
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const getColorIndicator = (color: string) => (
    <div className="color-indicator-container">
      <div
        className="color-indicator"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="color-code">{color}</span>
    </div>
  );

  const getUsageCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'task' : 'tasks'}
    </span>
  );

  const getSkillsBadges = (skillIds: number[]) => {
    if (!skillIds || skillIds.length === 0) {
      return <span className="text-muted">No skills required</span>;
    }

    return (
      <div className="skills-badges">
        {skillIds.slice(0, 3).map((skillId, index) => (
          <span key={skillId} className="skill-badge">
            Skill {skillId}
          </span>
        ))}
        {skillIds.length > 3 && (
          <span className="skill-badge-more">
            +{skillIds.length - 3} more
          </span>
        )}
      </div>
    );
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '-';
    return `${hours}h`;
  };

  const columns: TableColumn<TaskType>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'color',
      title: 'Color',
      sortable: false,
      width: '150px',
      render: (value) => getColorIndicator(value)
    },
    {
      key: 'requiredSkills',
      title: 'Required Skills',
      sortable: false,
      width: '250px',
      render: (value) => getSkillsBadges(value)
    },
    {
      key: 'estimatedHours',
      title: 'Est. Hours',
      sortable: true,
      width: '100px',
      render: formatHours
    },
    {
      key: 'usageCount',
      title: 'Usage',
      sortable: true,
      width: '100px',
      render: (value) => getUsageCount(value || 0)
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      width: '200px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 40 ? `${value.substring(0, 40)}...` : value;
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      width: '100px',
      render: (value) => getStatusBadge(value)
    }
  ];

  const colorGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    if (Array.isArray(taskTypes)) {
      taskTypes.forEach(tt => {
        const colorGroup = tt.color.substring(0, 3); // Group by first 3 chars
        groups[colorGroup] = (groups[colorGroup] || 0) + 1;
      });
    }
    return Object.entries(groups).map(([color, count]) => ({
      label: `${color}...`,
      value: color,
      count
    }));
  }, [taskTypes]);

  const quickFilters = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: true, count: Array.isArray(taskTypes) ? taskTypes.filter(tt => tt.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(taskTypes) ? taskTypes.filter(tt => !tt.isActive).length : 0 }
      ]
    },
    {
      key: 'hasSkills',
      label: 'Skills',
      options: [
        {
          label: 'Has Required Skills',
          value: true,
          count: Array.isArray(taskTypes) ? taskTypes.filter(tt => tt.requiredSkills && tt.requiredSkills.length > 0).length : 0
        },
        {
          label: 'No Skills Required',
          value: false,
          count: Array.isArray(taskTypes) ? taskTypes.filter(tt => !tt.requiredSkills || tt.requiredSkills.length === 0).length : 0
        }
      ]
    },
    {
      key: 'usage',
      label: 'Usage',
      options: [
        {
          label: 'Frequently Used (10+)',
          value: 'high',
          count: Array.isArray(taskTypes) ? taskTypes.filter(tt => (tt.usageCount || 0) >= 10).length : 0
        },
        {
          label: 'Sometimes Used (1-9)',
          value: 'medium',
          count: Array.isArray(taskTypes) ? taskTypes.filter(tt => (tt.usageCount || 0) >= 1 && (tt.usageCount || 0) < 10).length : 0
        },
        {
          label: 'Never Used',
          value: 'low',
          count: Array.isArray(taskTypes) ? taskTypes.filter(tt => (tt.usageCount || 0) === 0).length : 0
        }
      ]
    }
  ], [taskTypes]);

  const searchFields: (keyof TaskType)[] = ['name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={taskTypes}
        loading={loading}
        error={error}
        onRefresh={loadTaskTypes}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No task types found. Create your first task type to get started."
        createButtonText="Add Task Type"
        actions={[
          {
            label: 'View Tasks',
            icon: '📋',
            onClick: (taskType) => {
              console.log('View tasks of type:', taskType);
              // TODO: Navigate to tasks filtered by this type
            },
            variant: 'secondary',
            show: (taskType) => (taskType.usageCount || 0) > 0
          },
          {
            label: 'Duplicate',
            icon: '📄',
            onClick: (taskType) => {
              setEditingTaskType({
                ...taskType,
                id: undefined,
                name: `${taskType.name} (Copy)`
              });
              setShowForm(true);
            },
            variant: 'secondary'
          },
          {
            label: 'Update Color',
            icon: '🎨',
            onClick: (taskType) => {
              setEditingTaskType(taskType);
              setShowForm(true);
            },
            variant: 'primary'
          }
        ]}
      />

      {/* Task Type Form Modal */}
      <TaskTypeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTaskType(undefined);
        }}
        onSave={handleSave}
        taskType={editingTaskType}
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