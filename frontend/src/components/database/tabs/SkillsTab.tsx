import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import SkillForm from '../forms/SkillForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import ViewTaskTypesModal from '../modals/ViewTaskTypesModal';
import AddToTaskTypeModal from '../modals/AddToTaskTypeModal';
import {
  Skill,
  CreateSkillDto,
  UpdateSkillDto,
  TableColumn,
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
  const [showViewTaskTypesModal, setShowViewTaskTypesModal] = useState(false);
  const [showAddToTaskTypeModal, setShowAddToTaskTypeModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

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

  const getTaskTypesCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'task type' : 'task types'}
    </span>
  );

  const columns: TableColumn<Skill>[] = [
    {
      key: 'name',
      label: 'Skill',
      sortable: true,
      width: '200px'
    },
    {
      key: 'category',
      label: 'Type',
      sortable: true,
      width: '150px',
      render: (value) => getCategoryBadge(value)
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: '300px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 60 ? `${value.substring(0, 60)}...` : value;
      }
    },
    {
      key: 'taskTypesCount',
      label: 'Task Types',
      sortable: true,
      width: '120px',
      render: (value) => getTaskTypesCount(value || 0)
    }
  ];


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
        searchFields={searchFields}
        quickFilters={[]}
        enableSelection={false}
        enableBulkActions={false}
        getItemKey={(item) => item.id!}
        emptyMessage="No skills found. Create your first skill to get started."
        createButtonText="Add Skill"
        actions={[
          {
            label: 'View Task Types',
            icon: '📋',
            onClick: (skill) => {
              setSelectedSkill(skill);
              setShowViewTaskTypesModal(true);
            },
            variant: 'secondary',
            show: (skill) => (skill.taskTypesCount || 0) > 0
          },
          {
            label: 'Add to Task Type',
            icon: '🔗',
            onClick: (skill) => {
              setSelectedSkill(skill);
              setShowAddToTaskTypeModal(true);
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
        entity={editingSkill}
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

      {/* View Task Types Modal */}
      <ViewTaskTypesModal
        isOpen={showViewTaskTypesModal}
        onClose={() => {
          setShowViewTaskTypesModal(false);
          setSelectedSkill(null);
        }}
        skill={selectedSkill}
        onRemoveFromTaskType={() => {
          loadSkills(); // Refresh skills to update counts
        }}
      />

      {/* Add to Task Type Modal */}
      <AddToTaskTypeModal
        isOpen={showAddToTaskTypeModal}
        onClose={() => {
          setShowAddToTaskTypeModal(false);
          setSelectedSkill(null);
        }}
        skill={selectedSkill}
        onTaskTypesUpdated={() => {
          loadSkills(); // Refresh skills to update counts
        }}
      />
    </>
  );
};

export default SkillsTab;