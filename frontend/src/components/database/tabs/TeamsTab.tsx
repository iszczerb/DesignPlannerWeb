import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import TeamForm from '../forms/TeamForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TableColumn,
  BulkActionType,
  BulkActionResult
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

  const handleBulkAction = async (action: BulkActionType, items: Team[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateTeams(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateTeams(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteTeams(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportTeams(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadTeams();
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

  const getMembersCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'member' : 'members'}
    </span>
  );

  const getLeaderBadge = (leaderName?: string) => {
    if (!leaderName) {
      return <span className="text-muted">No leader assigned</span>;
    }
    return (
      <span className="leader-badge">
        👤 {leaderName}
      </span>
    );
  };

  const columns: TableColumn<Team>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'code',
      title: 'Code',
      sortable: true,
      width: '120px'
    },
    {
      key: 'leaderName',
      title: 'Team Leader',
      sortable: true,
      width: '180px',
      render: (value) => getLeaderBadge(value)
    },
    {
      key: 'membersCount',
      title: 'Members',
      sortable: true,
      width: '120px',
      render: (value) => getMembersCount(value || 0)
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      width: '250px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
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

  const quickFilters = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: true, count: Array.isArray(teams) ? teams.filter(t => t.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(teams) ? teams.filter(t => !t.isActive).length : 0 }
      ]
    },
    {
      key: 'hasLeader',
      label: 'Leadership',
      options: [
        {
          label: 'Has Leader',
          value: true,
          count: Array.isArray(teams) ? teams.filter(t => t.leaderId).length : 0
        },
        {
          label: 'No Leader',
          value: false,
          count: Array.isArray(teams) ? teams.filter(t => !t.leaderId).length : 0
        }
      ]
    },
    {
      key: 'memberSize',
      label: 'Team Size',
      options: [
        {
          label: 'Small (1-5)',
          value: 'small',
          count: Array.isArray(teams) ? teams.filter(t => (t.membersCount || 0) <= 5).length : 0
        },
        {
          label: 'Medium (6-10)',
          value: 'medium',
          count: Array.isArray(teams) ? teams.filter(t => (t.membersCount || 0) >= 6 && (t.membersCount || 0) <= 10).length : 0
        },
        {
          label: 'Large (11+)',
          value: 'large',
          count: Array.isArray(teams) ? teams.filter(t => (t.membersCount || 0) > 10).length : 0
        }
      ]
    }
  ], [teams]);

  const searchFields: (keyof Team)[] = ['name', 'code', 'description', 'leaderName'];

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
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No teams found. Create your first team to get started."
        createButtonText="Add Team"
        actions={[
          {
            label: 'View Members',
            icon: '👥',
            onClick: (team) => {
              console.log('View members for team:', team);
              // TODO: Navigate to team members view
            },
            variant: 'secondary'
          },
          {
            label: 'Assign Leader',
            icon: '👑',
            onClick: (team) => {
              console.log('Assign leader to team:', team);
              // TODO: Open leader assignment modal
            },
            variant: 'primary',
            show: (team) => !team.leaderId
          },
          {
            label: 'View Schedule',
            icon: '📅',
            onClick: (team) => {
              console.log('View schedule for team:', team);
              // TODO: Navigate to team schedule
            },
            variant: 'secondary',
            show: (team) => (team.membersCount || 0) > 0
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
        team={editingTeam}
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
    </>
  );
};

export default TeamsTab;