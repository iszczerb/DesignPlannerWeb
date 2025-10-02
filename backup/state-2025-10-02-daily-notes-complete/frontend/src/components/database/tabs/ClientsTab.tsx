import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import ClientForm from '../forms/ClientForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  TableColumn,
  BulkActionType,
  BulkActionResult,
  Project
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import { clientTaskCountService, ClientTaskCount } from '../../../services/clientTaskCountService';

interface ClientsTabProps {
  onEntityCountChange: (count: number) => void;
  onDataChange?: () => void;
  onTaskCountsChange?: (taskCounts: ClientTaskCount[]) => void;
  refreshTrigger?: number; // External trigger to refresh task counts
}

const ClientsTab: React.FC<ClientsTabProps> = ({ onEntityCountChange, onDataChange, onTaskCountsChange, refreshTrigger }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [liveTaskCounts, setLiveTaskCounts] = useState<Map<number, { taskCount: number; projectCount: number }>>(new Map());

  useEffect(() => {
    loadClients();
    loadProjects();
    loadLiveTaskCounts();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(clients) ? clients.length : 0);
  }, [clients]);

  // Recalculate project counts when both clients and projects are loaded
  useEffect(() => {
    if (Array.isArray(clients) && clients.length > 0 && Array.isArray(projects)) {
      const clientsWithCount = clients.map(client => ({
        ...client,
        projectCount: projects.filter(p => p.clientId === client.id).length
      }));

      // Only update if counts actually changed
      const countsChanged = clientsWithCount.some((client, index) =>
        client.projectCount !== clients[index]?.projectCount
      );

      if (countsChanged) {
        setClients(clientsWithCount);
      }
    }
  }, [projects]);

  // Respond to external refresh triggers (e.g., from calendar changes)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('🔄 CLIENTS TAB - External refresh trigger received:', refreshTrigger);
      loadLiveTaskCounts();
    }
  }, [refreshTrigger]);

  const loadProjects = async () => {
    try {
      const data = await databaseService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadLiveTaskCounts = async () => {
    try {
      console.log('🔄 CLIENTS TAB - loadLiveTaskCounts called');
      const taskCounts = await clientTaskCountService.getClientTaskCounts();
      console.log('🏢 CLIENTS TAB - received live task counts:', taskCounts);

      // Convert to Map for efficient lookup
      const countsMap = new Map<number, { taskCount: number; projectCount: number }>();
      taskCounts.forEach(count => {
        countsMap.set(count.clientId, {
          taskCount: count.taskCount,
          projectCount: count.projectCount
        });
      });

      setLiveTaskCounts(countsMap);

      // Notify parent component if callback provided
      if (onTaskCountsChange) {
        onTaskCountsChange(taskCounts);
      }

      console.log('✅ CLIENTS TAB - loadLiveTaskCounts completed');
    } catch (err) {
      console.error('❌ CLIENTS TAB - error in loadLiveTaskCounts:', err);
      // On error, clear the counts
      setLiveTaskCounts(new Map());
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClient(undefined);
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateClientDto | UpdateClientDto) => {
    try {
      setFormLoading(true);
      if (editingClient) {
        await databaseService.updateClient(data as UpdateClientDto);
      } else {
        await databaseService.createClient(data as CreateClientDto);
      }
      setShowForm(false);
      setEditingClient(undefined);
      await loadClients();
      await loadProjects(); // Reload projects to trigger project count recalculation
      await loadLiveTaskCounts(); // Refresh live counts after changes

      // Notify parent component that data has changed (e.g., client colors updated)
      onDataChange?.();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;

    try {
      console.log('Deleting client:', deletingClient.id);
      console.log('About to call databaseService.deleteClient');
      const result = await databaseService.deleteClient(deletingClient.id!);
      console.log('Delete result:', result);
      setShowDeleteConfirm(false);
      setDeletingClient(undefined);
      await loadClients();
      await loadProjects(); // Reload projects to trigger project count recalculation
      await loadLiveTaskCounts(); // Refresh live counts after deletion
    } catch (err) {
      console.error('Delete error:', err);
      console.error('Delete error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };


  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const columns: TableColumn<Client>[] = [
    {
      key: 'color',
      label: 'Color',
      sortable: false,
      width: '80px',
      render: (value) => (
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: value || '#0066CC',
            borderRadius: '6px',
            border: '2px solid #e5e7eb'
          }}
          title={value || '#0066CC'}
        />
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '120px'
    },
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
    },
  ];

  const quickFilters = useMemo(() => [], [clients]);

  const searchFields: (keyof Client)[] = ['code', 'name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        error={error}
        onRefresh={() => {
          loadClients();
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
        emptyMessage="No clients found. Create your first client to get started."
        createButtonText="Add Client"
        actions={[]}
      />

      {/* Client Form Modal */}
      <ClientForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(undefined);
        }}
        onSave={handleSave}
        entity={editingClient}
        isCreating={!editingClient}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to delete "${deletingClient?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingClient(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default ClientsTab;