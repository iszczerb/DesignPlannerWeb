import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import SkillForm from '../forms/SkillForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Skill,
  CreateSkillDto,
  UpdateSkillDto,
  TableColumn,
  BulkActionType,
  BulkActionResult,
  SkillCategory,
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORY_COLORS
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface SkillsTabProps {
  onEntityCountChange: (count: number) => void;
}

const SkillsTab: React.FC<SkillsTabProps> = ({ onEntityCountChange }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<Skill | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(skills) ? skills.length : 0);
  }, [skills]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getSkills();
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSkill(undefined);
    setShowForm(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleDelete = (skill: Skill) => {
    setDeletingSkill(skill);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateSkillDto | UpdateSkillDto) => {
    try {
      setFormLoading(true);
      if (editingSkill) {
        await databaseService.updateSkill(data as UpdateSkillDto);
      } else {
        await databaseService.createSkill(data as CreateSkillDto);
      }
      setShowForm(false);
      setEditingSkill(undefined);
      await loadSkills();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSkill) return;

    try {
      await databaseService.deleteSkill(deletingSkill.id!);
      setShowDeleteConfirm(false);
      setDeletingSkill(undefined);
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: Skill[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateSkills(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateSkills(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteSkills(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportSkills(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadSkills();
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

  const getCategoryBadge = (category: SkillCategory) => (
    <span
      className="category-badge"
      style={{
        backgroundColor: SKILL_CATEGORY_COLORS[category],
        color: 'white'
      }}
    >
      {SKILL_CATEGORY_LABELS[category]}
    </span>
  );

  const getEmployeesCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'employee' : 'employees'}
    </span>
  );

  const columns: TableColumn<Skill>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      width: '150px',
      render: (value) => getCategoryBadge(value)
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      width: '300px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 60 ? `${value.substring(0, 60)}...` : value;
      }
    },
    {
      key: 'employeesCount',
      title: 'Employees',
      sortable: true,
      width: '120px',
      render: (value) => getEmployeesCount(value || 0)
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
      key: 'category',
      label: 'Category',
      options: Object.entries(SKILL_CATEGORY_LABELS).map(([value, label]) => ({
        label,
        value: parseInt(value),
        count: Array.isArray(skills) ? skills.filter(s => s.category === parseInt(value)).length : 0
      }))
    },
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: true, count: Array.isArray(skills) ? skills.filter(s => s.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(skills) ? skills.filter(s => !s.isActive).length : 0 }
      ]
    },
    {
      key: 'hasEmployees',
      label: 'Usage',
      options: [
        {
          label: 'In Use',
          value: true,
          count: Array.isArray(skills) ? skills.filter(s => (s.employeesCount || 0) > 0).length : 0
        },
        {
          label: 'Unused',
          value: false,
          count: Array.isArray(skills) ? skills.filter(s => (s.employeesCount || 0) === 0).length : 0
        }
      ]
    }
  ], [skills]);

  const searchFields: (keyof Skill)[] = ['name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={skills}
        loading={loading}
        error={error}
        onRefresh={loadSkills}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No skills found. Create your first skill to get started."
        createButtonText="Add Skill"
        actions={[
          {
            label: 'View Employees',
            icon: '👥',
            onClick: (skill) => {
              console.log('View employees with skill:', skill);
              // TODO: Navigate to employees filtered by this skill
            },
            variant: 'secondary',
            show: (skill) => (skill.employeesCount || 0) > 0
          },
          {
            label: 'Add to Task Type',
            icon: '🔗',
            onClick: (skill) => {
              console.log('Add skill to task type:', skill);
              // TODO: Open task type assignment modal
            },
            variant: 'primary'
          }
        ]}
      />

      {/* Skill Form Modal */}
      <SkillForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSkill(undefined);
        }}
        onSave={handleSave}
        skill={editingSkill}
        isCreating={!editingSkill}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Skill"
        message={`Are you sure you want to delete "${deletingSkill?.name}"? This action cannot be undone and will affect all employees and task types that use this skill.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingSkill(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default SkillsTab;