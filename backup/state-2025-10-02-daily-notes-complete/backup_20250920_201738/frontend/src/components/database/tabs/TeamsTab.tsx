import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import TeamForm from '../forms/TeamForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import ViewMembersModal from '../modals/ViewMembersModal';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TableColumn
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface TeamsTabProps {
  onEntityCountChange: (count: number) => void;
}

const TeamsTab: React.FC<TeamsTabProps> = ({ onEntityCountChange }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(teams) ? teams.length : 0);
  }, [teams]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getTeams();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTeam(undefined);
    setShowForm(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDelete = (team: Team) => {
    setDeletingTeam(team);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateTeamDto | UpdateTeamDto) => {
    try {
      setFormLoading(true);
      if (editingTeam) {
        await databaseService.updateTeam(data as UpdateTeamDto);
      } else {
        await databaseService.createTeam(data as CreateTeamDto);
      }
      setShowForm(false);
      setEditingTeam(undefined);
      await loadTeams();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingTeam) return;

    try {
      await databaseService.deleteTeam(deletingTeam.id!);
      setShowDeleteConfirm(false);
      setDeletingTeam(undefined);
      await loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  // Bulk actions removed - not needed for Teams tab


  const getManagerBadge = (managerName?: string) => {
    if (!managerName) {
      return <span className="text-muted">No manager assigned</span>;
    }
    return (
      <span className="manager-badge">
        👤 {managerName}
      </span>
    );
  };

  const getMembersCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'member' : 'members'}
    </span>
  );


  const columns: TableColumn<Team>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'managerName',
      label: 'Team Manager',
      sortable: true,
      width: '180px',
      render: (value) => getManagerBadge(value)
    },
    {
      key: 'memberCount',
      label: 'Members',
      sortable: true,
      width: '120px',
      render: (value) => getMembersCount(value || 0)
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: '250px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      }
    },
  ];


  const searchFields: (keyof Team)[] = ['name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={teams}
        loading={loading}
        error={error}
        onRefresh={loadTeams}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={searchFields}
        quickFilters={[]}
        enableSelection={false}
        enableBulkActions={false}
        getItemKey={(item) => item.id!}
        emptyMessage="No teams found. Create your first team to get started."
        createButtonText="Add Team"
        actions={[
          {
            label: 'View Members',
            icon: '👥',
            onClick: (team) => {
              setSelectedTeam(team);
              setShowMembersModal(true);
            },
            variant: 'secondary'
          }
        ]}
      />

      {/* Team Form Modal */}
      <TeamForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTeam(undefined);
        }}
        onSave={handleSave}
        entity={editingTeam}
        isCreating={!editingTeam}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Team"
        message={`Are you sure you want to delete "${deletingTeam?.name}"? This action cannot be undone and will affect all team members and assignments.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingTeam(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* View Members Modal */}
      <ViewMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        onRemoveMember={() => {
          // Reload teams to update member counts
          loadTeams();
        }}
      />
    </>
  );
};

export default TeamsTab;