import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import UserForm from '../forms/UserForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  TableColumn,
  BulkActionType,
  BulkActionResult,
  UserRole,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
  ManagementLevel,
  MANAGEMENT_LEVEL_LABELS,
  MANAGEMENT_LEVEL_COLORS
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface UsersTabProps {
  onEntityCountChange: (count: number) => void;
}

const UsersTab: React.FC<UsersTabProps> = ({ onEntityCountChange }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(users) ? users.length : 0);
  }, [users, onEntityCountChange]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      setFormLoading(true);
      if (editingUser) {
        await databaseService.updateUser(data as UpdateUserDto);
      } else {
        await databaseService.createUser(data as CreateUserDto);
      }
      setShowForm(false);
      setEditingUser(undefined);
      await loadUsers();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await databaseService.deleteUser(deletingUser.id);
      setShowDeleteConfirm(false);
      setDeletingUser(undefined);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: User[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          // Activate users one by one since we don't have bulk operations yet
          for (const user of items) {
            await databaseService.toggleUserStatus(user.id, true);
          }
          result = { success: true, successCount: items.length, errorCount: 0, totalCount: items.length };
          break;
        case BulkActionType.Deactivate:
          // Deactivate users one by one
          for (const user of items) {
            await databaseService.toggleUserStatus(user.id, false);
          }
          result = { success: true, successCount: items.length, errorCount: 0, totalCount: items.length };
          break;
        case BulkActionType.Delete:
          // Delete users one by one
          for (const user of items) {
            await databaseService.deleteUser(user.id);
          }
          result = { success: true, successCount: items.length, errorCount: 0, totalCount: items.length };
          break;
        case BulkActionType.Export:
          result = { success: true, successCount: items.length, errorCount: 0, totalCount: items.length };
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadUsers();
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Bulk action failed',
        successCount: 0,
        errorCount: items.length,
        totalCount: items.length
      };
    }
  };


  const getRoleBadge = (role: UserRole) => {
    const label = USER_ROLE_LABELS[role];
    const color = USER_ROLE_COLORS[role];
    return (
      <span
        className="role-badge"
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}
      >
        {label}
      </span>
    );
  };

  const getManagementLevelBadge = (level: ManagementLevel) => {
    const label = MANAGEMENT_LEVEL_LABELS[level];
    const color = MANAGEMENT_LEVEL_COLORS[level];
    return (
      <span
        className="management-level-badge"
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}
      >
        {label}
      </span>
    );
  };

  const getTeamBadge = (teamName?: string, teamCode?: string) => {
    if (!teamName) {
      return <span className="text-muted">No team assigned</span>;
    }
    return (
      <span className="team-badge">
        👥 {teamName} {teamCode && `(${teamCode})`}
      </span>
    );
  };

  const getSkillsBadges = (skills: Array<{ id: number; name: string }>) => {
    if (!skills || skills.length === 0) {
      return <span className="text-muted"></span>;
    }

    if (skills.length <= 3) {
      return (
        <div className="skills-badges">
          {skills.map(skill => (
            <span key={skill.id} className="skill-badge">
              {skill.name}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="skills-badges">
        {skills.slice(0, 2).map(skill => (
          <span key={skill.id} className="skill-badge">
            {skill.name}
          </span>
        ))}
        <span className="skill-badge-more">
          +{skills.length - 2} more
        </span>
      </div>
    );
  };

  const columns: TableColumn<User>[] = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      width: '150px'
    },
    {
      key: 'lastName',
      label: 'Surname',
      sortable: true,
      width: '150px'
    },
    {
      key: 'employee.position',
      label: 'Role',
      sortable: true,
      width: '120px',
      render: (value, user) => {
        // Role is the text input from the form (stored in position field or role as text)
        const roleText = user.employee?.position || '-';
        return (
          <span className="role-text">
            {roleText}
          </span>
        );
      }
    },
    {
      key: 'role',
      label: 'Management Level',
      sortable: true,
      width: '140px',
      render: (value, user) => {
        // Map backend UserRole to display text
        let levelText = '';
        switch(user.role) {
          case UserRole.Admin:
            levelText = 'Admin';
            break;
          case UserRole.Manager:
            levelText = 'Manager';
            break;
          case UserRole.TeamMember:
          default:
            levelText = 'Team Member';
            break;
        }
        return (
          <span className="management-level-text">
            {levelText}
          </span>
        );
      }
    },
    {
      key: 'employee.team',
      label: 'Team',
      sortable: true,
      width: '180px',
      render: (value, user) => getTeamBadge(user.employee?.team?.name, user.employee?.team?.code)
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      width: '130px'
    },
  ];

  const quickFilters = useMemo(() => [
    // No filters needed - all users are active and assigned to teams
  ], [users]);

  const searchFields: (keyof User)[] = ['firstName', 'lastName', 'username'];

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRefresh={loadUsers}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchFields={searchFields}
        quickFilters={[]}
        enableSelection={false}
        enableBulkActions={false}
        getItemKey={(item) => item.id}
        emptyMessage="No users found. Create your first user to get started."
        createButtonText="Add User"
        actions={[
          {
            label: 'Reset Password',
            icon: '🔑',
            onClick: (user) => {
              console.log('Reset password for user:', user);
              // TODO: Implement password reset functionality
            },
            variant: 'secondary'
          },
          {
            label: 'View Schedule',
            icon: '📅',
            onClick: (user) => {
              console.log('View schedule for user:', user);
              // TODO: Navigate to user schedule view
            },
            variant: 'primary',
            show: (user) => user.managementLevel >= ManagementLevel.Manager
          },
        ]}
      />

      {/* User Form Modal */}
      <UserForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(undefined);
        }}
        onSave={handleSave}
        entity={editingUser}
        isCreating={!editingUser}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deletingUser?.fullName || deletingUser?.username}"? This action cannot be undone and will remove all user data, including their employee record and schedule assignments.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingUser(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default UsersTab;