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
import { skillTaskCountService, SkillTaskCount } from '../../../services/skillTaskCountService';

interface SkillsTabProps {
  onEntityCountChange: (count: number) => void;
  onTaskCountsChange?: (taskCounts: SkillTaskCount[]) => void;
  refreshTrigger?: number; // External trigger to refresh task counts
}

const SkillsTab: React.FC<SkillsTabProps> = ({ onEntityCountChange, onTaskCountsChange, refreshTrigger }) => {
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
  const [liveTaskCounts, setLiveTaskCounts] = useState<Map<number, { taskCount: number; projectCount: number; taskTypeCount: number }>>(new Map());

  useEffect(() => {
    loadSkills();
    loadLiveTaskCounts();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(skills) ? skills.length : 0);
  }, [skills]);

  // Respond to external refresh triggers (e.g., from calendar changes)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('🔄 SKILLS TAB - External refresh trigger received:', refreshTrigger);
      loadLiveTaskCounts();
    }
  }, [refreshTrigger]);

  const loadSkills = async () => {
    console.log('🔄 SKILLS TAB - loadSkills called');
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 SKILLS TAB - calling databaseService.getSkills...');
      const data = await databaseService.getSkills();
      console.log('🛠️ SKILLS TAB - getSkills returned:', data);
      console.log('🛠️ SKILLS TAB - data is array:', Array.isArray(data));
      console.log('🛠️ SKILLS TAB - data length:', data?.length);
      const skillsArray = Array.isArray(data) ? data : [];
      console.log('🛠️ SKILLS TAB - setting skills to:', skillsArray);
      setSkills(skillsArray);
      console.log('✅ SKILLS TAB - loadSkills completed successfully');
    } catch (err) {
      console.log('❌ SKILLS TAB - error in loadSkills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveTaskCounts = async () => {
    try {
      console.log('🔄 SKILLS TAB - loadLiveTaskCounts called');
      const taskCounts = await skillTaskCountService.getSkillTaskCounts();
      console.log('🛠️ SKILLS TAB - received live task counts:', taskCounts);

      // Convert to Map for efficient lookup
      const countsMap = new Map<number, { taskCount: number; projectCount: number; taskTypeCount: number }>();
      taskCounts.forEach(count => {
        countsMap.set(count.skillId, {
          taskCount: count.taskCount,
          projectCount: count.projectCount,
          taskTypeCount: count.taskTypeCount
        });
      });

      setLiveTaskCounts(countsMap);

      // Notify parent component if callback provided
      if (onTaskCountsChange) {
        onTaskCountsChange(taskCounts);
      }

      console.log('✅ SKILLS TAB - loadLiveTaskCounts completed');
    } catch (err) {
      console.error('❌ SKILLS TAB - error in loadLiveTaskCounts:', err);
      // On error, clear the counts
      setLiveTaskCounts(new Map());
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
    console.log('🟢 SKILLS TAB - handleSave called with data:', data);
    try {
      setFormLoading(true);
      if (editingSkill) {
        console.log('📝 SKILLS TAB - updating existing skill');
        await databaseService.updateSkill(data as UpdateSkillDto);
      } else {
        console.log('➕ SKILLS TAB - creating new skill');
        console.log('🚀 SKILLS TAB - calling databaseService.createSkill...');
        const result = await databaseService.createSkill(data as CreateSkillDto);
        console.log('✅ SKILLS TAB - createSkill returned:', result);
      }
      setShowForm(false);
      setEditingSkill(undefined);
      console.log('🔄 SKILLS TAB - reloading skills...');
      await loadSkills();
      await loadLiveTaskCounts(); // Refresh live counts after changes
      console.log('✅ SKILLS TAB - handleSave completed successfully');
    } catch (err) {
      console.log('❌ SKILLS TAB - error in handleSave:', err);
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSkill) return;

    try {
      console.log('🗑️ SKILLS TAB - Attempting to delete skill:', deletingSkill);
      await databaseService.deleteSkill(deletingSkill.id!);
      console.log('✅ SKILLS TAB - Skill deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingSkill(undefined);
      setError(null); // Clear any previous errors
      await loadSkills();
      await loadLiveTaskCounts(); // Refresh live counts after deletion
    } catch (err) {
      console.error('❌ SKILLS TAB - Error deleting skill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete skill';
      setError(errorMessage);
      // Keep the dialog open so user sees the error
      setShowDeleteConfirm(false);
      setDeletingSkill(undefined);
      // Show error to user
      alert(`Failed to delete skill: ${errorMessage}`);
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
      width: '120px',
      render: (value) => getCategoryBadge(value)
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: '220px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      }
    },
    {
      key: 'taskTypesCount',
      label: 'Task Types',
      sortable: true,
      width: '90px',
      render: (value, item) => {
        // Use live task type count if available, otherwise fall back to database value
        const liveCount = liveTaskCounts.get(item.id!)?.taskTypeCount ?? value ?? 0;
        return (
          <span className="count-badge">
            {liveCount}
          </span>
        );
      }
    },
    {
      key: 'projectCount',
      label: 'Projects',
      sortable: true,
      width: '80px',
      render: (value, item) => {
        // Use live project count from assignments
        const liveCount = liveTaskCounts.get(item.id!)?.projectCount ?? 0;
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
        onRefresh={() => {
          loadSkills();
          loadLiveTaskCounts();
        }}
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
            show: (skill) => {
              const liveCount = liveTaskCounts.get(skill.id!)?.taskTypeCount ?? skill.taskTypesCount ?? 0;
              return liveCount > 0;
            }
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
          loadLiveTaskCounts(); // Refresh live counts too
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
          loadLiveTaskCounts(); // Refresh live counts too
        }}
      />
    </>
  );
};

export default SkillsTab;