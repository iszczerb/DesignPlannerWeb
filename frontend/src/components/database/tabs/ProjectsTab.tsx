import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import ProjectForm from '../forms/ProjectForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  TableColumn,
  BulkActionType,
  BulkActionResult,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface ProjectsTabProps {
  onEntityCountChange: (count: number) => void;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ onEntityCountChange }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(projects) ? projects.length : 0);
  }, [projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(undefined);
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = (project: Project) => {
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateProjectDto | UpdateProjectDto) => {
    try {
      setFormLoading(true);
      if (editingProject) {
        await databaseService.updateProject(data as UpdateProjectDto);
      } else {
        await databaseService.createProject(data as CreateProjectDto);
      }
      setShowForm(false);
      setEditingProject(undefined);
      await loadProjects();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;

    try {
      await databaseService.deleteProject(deletingProject.id!);
      setShowDeleteConfirm(false);
      setDeletingProject(undefined);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: Project[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateProjects(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateProjects(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteProjects(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportProjects(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadProjects();
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

  const getStatusBadge = (status: ProjectStatus) => (
    <span
      className="status-badge project-status"
      style={{
        backgroundColor: PROJECT_STATUS_COLORS[status],
        color: 'white'
      }}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );

  const getActiveBadge = (isActive: boolean) => (
    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isOverdue = (deadline?: string, status?: ProjectStatus) => {
    if (!deadline || status === ProjectStatus.Completed || status === ProjectStatus.Cancelled) {
      return false;
    }
    return new Date(deadline) < new Date();
  };

  const columns: TableColumn<Project>[] = [
    {
      key: 'code',
      title: 'Code',
      sortable: true,
      width: '120px'
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'clientName',
      title: 'Client',
      sortable: true,
      width: '150px',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '120px',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'startDate',
      title: 'Start Date',
      sortable: true,
      width: '110px',
      render: formatDate
    },
    {
      key: 'deadline',
      title: 'Deadline',
      sortable: true,
      width: '110px',
      render: (value, item) => (
        <span className={isOverdue(value, item.status) ? 'text-danger' : ''}>
          {formatDate(value)}
          {isOverdue(value, item.status) && ' ⚠️'}
        </span>
      )
    },
    {
      key: 'budget',
      title: 'Budget',
      sortable: true,
      width: '120px',
      render: formatCurrency
    },
    {
      key: 'isActive',
      title: 'Active',
      sortable: true,
      width: '100px',
      render: (value) => getActiveBadge(value)
    }
  ];

  const quickFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      options: Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        label,
        value: parseInt(value),
        count: Array.isArray(projects) ? projects.filter(p => p.status === parseInt(value)).length : 0
      }))
    },
    {
      key: 'isActive',
      label: 'Active',
      options: [
        { label: 'Active', value: true, count: Array.isArray(projects) ? projects.filter(p => p.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(projects) ? projects.filter(p => !p.isActive).length : 0 }
      ]
    },
    {
      key: 'overdue',
      label: 'Timeline',
      options: [
        {
          label: 'Overdue',
          value: true,
          count: Array.isArray(projects) ? projects.filter(p => isOverdue(p.deadline, p.status)).length : 0
        },
        {
          label: 'On Time',
          value: false,
          count: Array.isArray(projects) ? projects.filter(p => !isOverdue(p.deadline, p.status)).length : 0
        }
      ]
    }
  ], [projects]);

  const searchFields: (keyof Project)[] = ['code', 'name', 'clientName'];

  return (
    <>
      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        error={error}
        onRefresh={loadProjects}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No projects found. Create your first project to get started."
        createButtonText="Add Project"
        actions={[
          {
            label: 'View Tasks',
            icon: '📋',
            onClick: (project) => {
              console.log('View tasks for project:', project);
              // TODO: Navigate to tasks filtered by this project
            },
            variant: 'secondary'
          },
          {
            label: 'Mark Complete',
            icon: '✅',
            onClick: async (project) => {
              try {
                await databaseService.updateProject({
                  ...project,
                  status: ProjectStatus.Completed
                });
                await loadProjects();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update project');
              }
            },
            variant: 'success',
            show: (project) => project.status !== ProjectStatus.Completed && project.status !== ProjectStatus.Cancelled
          }
        ]}
      />

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProject(undefined);
        }}
        onSave={handleSave}
        project={editingProject}
        isCreating={!editingProject}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone and will affect all related tasks.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingProject(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default ProjectsTab;