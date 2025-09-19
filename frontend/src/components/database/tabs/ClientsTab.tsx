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

interface ClientsTabProps {
  onEntityCountChange: (count: number) => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ onEntityCountChange }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadProjects();
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

  const loadProjects = async () => {
    try {
      const data = await databaseService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
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
      width: '100px',
      render: (value) => getProjectsCount(value || 0)
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
        onRefresh={loadClients}
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