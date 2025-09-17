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
  BulkActionResult
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface ClientsTabProps {
  onEntityCountChange: (count: number) => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ onEntityCountChange }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(clients) ? clients.length : 0);
  }, [clients]);

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
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingClient) return;

    try {
      await databaseService.deleteClient(deletingClient.id!);
      setShowDeleteConfirm(false);
      setDeletingClient(undefined);
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: Client[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateClients(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateClients(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteClients(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportClients(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadClients();
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

  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const columns: TableColumn<Client>[] = [
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
      key: 'contactEmail',
      title: 'Contact Email',
      sortable: true,
      width: '200px',
      render: (value) => value || '-'
    },
    {
      key: 'projectsCount',
      title: 'Projects',
      sortable: true,
      width: '100px',
      render: (value) => getProjectsCount(value || 0)
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      width: '100px',
      render: (value) => getStatusBadge(value)
    }
  ];

  const quickFilters = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: true, count: Array.isArray(clients) ? clients.filter(c => c.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(clients) ? clients.filter(c => !c.isActive).length : 0 }
      ]
    },
    {
      key: 'hasProjects',
      label: 'Projects',
      options: [
        {
          label: 'Has Projects',
          value: true,
          count: Array.isArray(clients) ? clients.filter(c => (c.projectsCount || 0) > 0).length : 0
        },
        {
          label: 'No Projects',
          value: false,
          count: Array.isArray(clients) ? clients.filter(c => (c.projectsCount || 0) === 0).length : 0
        }
      ]
    }
  ], [clients]);

  const searchFields: (keyof Client)[] = ['code', 'name', 'contactEmail'];

  return (
    <>
      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        error={error}
        onRefresh={loadClients}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No clients found. Create your first client to get started."
        createButtonText="Add Client"
        actions={[
          {
            label: 'View Projects',
            icon: '📋',
            onClick: (client) => {
              console.log('View projects for client:', client);
              // TODO: Navigate to projects filtered by this client
            },
            variant: 'secondary',
            show: (client) => (client.projectsCount || 0) > 0
          }
        ]}
      />

      {/* Client Form Modal */}
      <ClientForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(undefined);
        }}
        onSave={handleSave}
        client={editingClient}
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