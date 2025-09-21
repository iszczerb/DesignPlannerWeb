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
  PROJECT_STATUS_COLORS,
  Client,
  Category
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import { projectTaskCountService, ProjectTaskCount } from '../../../services/projectTaskCountService';

interface ProjectsTabProps {
  onEntityCountChange: (count: number) => void;
  onTaskCountsChange?: (taskCounts: ProjectTaskCount[]) => void;
  refreshTrigger?: number; // External trigger to refresh task counts
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ onEntityCountChange, onTaskCountsChange, refreshTrigger }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [liveTaskCounts, setLiveTaskCounts] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    loadProjects();
    loadClients();
    loadCategories();
    loadLiveTaskCounts();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(projects) ? projects.length : 0);
  }, [projects]);

  // Respond to external refresh triggers (e.g., from calendar changes)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('🔄 PROJECTS TAB - External refresh trigger received:', refreshTrigger);
      loadLiveTaskCounts();
    }
  }, [refreshTrigger]);

  const loadClients = async () => {
    try {
      const data = await databaseService.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await databaseService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadLiveTaskCounts = async () => {
    try {
      console.log('🔄 PROJECTS TAB - loadLiveTaskCounts called');
      const taskCounts = await projectTaskCountService.getProjectTaskCounts();
      console.log('📊 PROJECTS TAB - received live task counts:', taskCounts);

      // Convert to Map for efficient lookup
      const countsMap = new Map<number, number>();
      taskCounts.forEach(count => {
        countsMap.set(count.projectId, count.taskCount);
      });

      setLiveTaskCounts(countsMap);

      // Notify parent component if callback provided
      if (onTaskCountsChange) {
        onTaskCountsChange(taskCounts);
      }

      console.log('✅ PROJECTS TAB - loadLiveTaskCounts completed');
    } catch (err) {
      console.error('❌ PROJECTS TAB - error in loadLiveTaskCounts:', err);
      // On error, clear the counts
      setLiveTaskCounts(new Map());
    }
  };

  const loadProjects = async () => {
    console.log('🔄 PROJECTS TAB - loadProjects called');
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 PROJECTS TAB - calling databaseService.getProjects...');
      const data = await databaseService.getProjects();
      console.log('📊 PROJECTS TAB - getProjects returned:', data);
      console.log('📊 PROJECTS TAB - data is array:', Array.isArray(data));
      console.log('📊 PROJECTS TAB - data length:', data?.length);
      const projectsArray = Array.isArray(data) ? data : [];
      console.log('📋 PROJECTS TAB - setting projects to:', projectsArray);
      setProjects(projectsArray);
      console.log('✅ PROJECTS TAB - loadProjects completed successfully');
    } catch (err) {
      console.log('❌ PROJECTS TAB - error in loadProjects:', err);
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
    console.log('🟢 PROJECTS TAB - handleSave called with data:', data);
    try {
      setFormLoading(true);
      if (editingProject) {
        console.log('📝 PROJECTS TAB - updating existing project');
        await databaseService.updateProject(data as UpdateProjectDto);
      } else {
        console.log('➕ PROJECTS TAB - creating new project');
        console.log('🚀 PROJECTS TAB - calling databaseService.createProject...');
        const result = await databaseService.createProject(data as CreateProjectDto);
        console.log('✅ PROJECTS TAB - createProject returned:', result);
      }
      setShowForm(false);
      setEditingProject(undefined);
      console.log('🔄 PROJECTS TAB - reloading projects...');
      await loadProjects();
      console.log('✅ PROJECTS TAB - handleSave completed successfully');
    } catch (err) {
      console.log('❌ PROJECTS TAB - error in handleSave:', err);
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


  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };


  const isOverdue = (deadlineDate?: string, status?: ProjectStatus) => {
    if (!deadlineDate || status === ProjectStatus.Completed || status === ProjectStatus.Cancelled) {
      return false;
    }
    return new Date(deadlineDate) < new Date();
  };

  const columns: TableColumn<Project>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '250px'
    },
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
      width: '150px',
      render: (value) => value || '-'
    },
    {
      key: 'categoryName',
      label: 'Category',
      sortable: true,
      width: '130px',
      render: (value) => value || '-'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      width: '200px',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      width: '110px',
      render: formatDate
    },
    {
      key: 'deadlineDate',
      label: 'Deadline',
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
      key: 'taskCount',
      label: 'Tasks',
      sortable: true,
      width: '80px',
      render: (value, item) => {
        // Use live task count if available, otherwise fall back to database value
        const liveCount = liveTaskCounts.get(item.id!) ?? value ?? 0;
        return (
          <span className="count-badge">
            {liveCount}
          </span>
        );
      }
    }
  ];

  const quickFilters = useMemo(() => [
    {
      key: 'clientId',
      label: 'Client',
      options: clients.map(client => ({
        label: client.name,
        value: client.id,
        count: Array.isArray(projects) ? projects.filter(p => p.clientId === client.id).length : 0
      }))
    },
    {
      key: 'categoryId',
      label: 'Category',
      options: categories.map(category => ({
        label: category.name,
        value: category.id,
        count: Array.isArray(projects) ? projects.filter(p => p.categoryId === category.id).length : 0
      }))
    },
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
      key: 'overdue',
      label: 'Timeline',
      options: [
        {
          label: 'Overdue',
          value: true,
          count: Array.isArray(projects) ? projects.filter(p => isOverdue(p.deadlineDate, p.status)).length : 0
        },
        {
          label: 'On Time',
          value: false,
          count: Array.isArray(projects) ? projects.filter(p => !isOverdue(p.deadlineDate, p.status)).length : 0
        }
      ]
    }
  ], [projects, clients, categories]);

  const searchFields: (keyof Project)[] = ['name', 'clientName'];

  return (
    <>
      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        error={error}
        onRefresh={() => {
          loadProjects();
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
        emptyMessage="No projects found. Create your first project to get started."
        createButtonText="Add Project"
        actions={[
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
          },
          {
            label: 'Revert to In Progress',
            icon: '🔄',
            onClick: async (project) => {
              try {
                await databaseService.updateProject({
                  ...project,
                  status: ProjectStatus.InProgress
                });
                await loadProjects();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update project');
              }
            },
            variant: 'secondary',
            show: (project) => project.status === ProjectStatus.Completed
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
        entity={editingProject}
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