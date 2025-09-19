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





  const getSkillsBadges = (skillIds: number[]) => {
    if (!skillIds || skillIds.length === 0) {
      return <span className="text-muted"></span>;
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


  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const getCategoriesCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'category' : 'categories'}
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
      width: '300px',
      render: (value) => value || '-'
    },
    {
      key: 'skills',
      label: 'Skills',
      sortable: false,
      width: '250px',
      render: (value) => getSkillsBadges(value)
    },
    {
      key: 'projectCount',
      label: 'Projects',
      sortable: true,
      width: '100px',
      render: (value) => getProjectsCount(value || 0)
    },
    {
      key: 'categoryCount',
      label: 'Categories',
      sortable: true,
      width: '100px',
      render: (value) => getCategoriesCount(value || 0)
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
        onRefresh={loadTaskTypes}
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