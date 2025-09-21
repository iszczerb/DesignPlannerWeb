import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill, TaskType } from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './Modal.css';

interface AddToTaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  onTaskTypesUpdated?: () => void;
}

const AddToTaskTypeModal: React.FC<AddToTaskTypeModalProps> = ({
  isOpen,
  onClose,
  skill,
  onTaskTypesUpdated
}) => {
  const [allTaskTypes, setAllTaskTypes] = useState<TaskType[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && skill) {
      loadTaskTypes();
    }
  }, [isOpen, skill]);

  const loadTaskTypes = async () => {
    if (!skill) return;

    try {
      setLoading(true);
      setError(null);

      // Get all task types
      const taskTypes = await databaseService.getTaskTypes();
      setAllTaskTypes(taskTypes);

      // Pre-select task types that already have this skill
      const preSelected = taskTypes
        .filter(tt => tt.skills?.includes(skill.id!))
        .map(tt => tt.id!);
      setSelectedTaskTypes(preSelected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task types');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskTypeToggle = (taskTypeId: number) => {
    setSelectedTaskTypes(prev => {
      if (prev.includes(taskTypeId)) {
        return prev.filter(id => id !== taskTypeId);
      } else {
        return [...prev, taskTypeId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedTaskTypes(allTaskTypes.map(tt => tt.id!));
  };

  const handleDeselectAll = () => {
    setSelectedTaskTypes([]);
  };

  const handleSave = async () => {
    if (!skill) return;

    try {
      setSaving(true);
      setError(null);

      // Update each task type
      const updatePromises = allTaskTypes.map(async (taskType) => {
        const currentSkills = taskType.skills || [];
        const hasSkill = currentSkills.includes(skill.id!);
        const shouldHaveSkill = selectedTaskTypes.includes(taskType.id!);

        if (hasSkill !== shouldHaveSkill) {
          let updatedSkills: number[];

          if (shouldHaveSkill) {
            // Add skill
            updatedSkills = [...currentSkills, skill.id!];
          } else {
            // Remove skill
            updatedSkills = currentSkills.filter(id => id !== skill.id);
          }

          await databaseService.updateTaskType({
            id: taskType.id,
            name: taskType.name,
            description: taskType.description || '',
            skills: updatedSkills
          });
        }
      });

      await Promise.all(updatePromises);

      // Notify parent and close
      if (onTaskTypesUpdated) {
        onTaskTypesUpdated();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task types');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedTaskTypes([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const hasChanges = () => {
    const original = allTaskTypes
      .filter(tt => tt.skills?.includes(skill?.id!))
      .map(tt => tt.id!);

    if (original.length !== selectedTaskTypes.length) return true;

    return !original.every(id => selectedTaskTypes.includes(id));
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={handleCancel}>
        <motion.div
          className="modal-content large-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="modal-header">
            <h2>🔗 Add "{skill?.name}" to Task Types</h2>
            <button className="modal-close" onClick={handleCancel}>×</button>
          </div>

          <div className="modal-body">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading task types...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p className="error-message">{error}</p>
                <button onClick={loadTaskTypes} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="members-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <p className="members-count">
                    {selectedTaskTypes.length} of {allTaskTypes.length} task types selected
                  </p>
                  <div className="selection-buttons">
                    <button
                      onClick={handleSelectAll}
                      className="btn btn-sm btn-secondary"
                      disabled={selectedTaskTypes.length === allTaskTypes.length}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="btn btn-sm btn-secondary"
                      disabled={selectedTaskTypes.length === 0}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {allTaskTypes.length === 0 ? (
                  <div className="empty-state">
                    <p>No task types available.</p>
                    <p className="text-muted">Create task types first to assign skills to them.</p>
                  </div>
                ) : (
                  <div className="checkbox-list">
                    {allTaskTypes.map((taskType) => {
                      const isSelected = selectedTaskTypes.includes(taskType.id!);
                      const isOriginallySelected = taskType.skills?.includes(skill?.id!) || false;

                      return (
                        <div key={taskType.id} className="checkbox-item">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTaskTypeToggle(taskType.id!)}
                              className="checkbox-input"
                            />
                            <div className="checkbox-info">
                              <div className="checkbox-name">
                                {taskType.name}
                                {isOriginallySelected && (
                                  <span
                                    className="original-badge"
                                    style={{
                                      marginLeft: '8px',
                                      fontSize: '0.75rem',
                                      backgroundColor: '#059669',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    Currently assigned
                                  </span>
                                )}
                              </div>
                              {taskType.description && (
                                <div className="checkbox-description">
                                  {taskType.description}
                                </div>
                              )}
                              <div className="checkbox-meta">
                                {taskType.skills && taskType.skills.length > 0 && (
                                  <span className="meta-item">
                                    {taskType.skills.length} {taskType.skills.length === 1 ? 'skill' : 'skills'}
                                  </span>
                                )}
                                {taskType.projectCount && taskType.projectCount > 0 && (
                                  <span className="meta-item">
                                    {taskType.projectCount} {taskType.projectCount === 1 ? 'project' : 'projects'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddToTaskTypeModal;