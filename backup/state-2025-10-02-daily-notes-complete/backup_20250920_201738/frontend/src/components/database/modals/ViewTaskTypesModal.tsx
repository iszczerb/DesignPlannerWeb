import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../../common/ConfirmDialog';
import { Skill, TaskType } from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './Modal.css';

interface ViewTaskTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  onRemoveFromTaskType?: (taskTypeId: number) => void;
}

const ViewTaskTypesModal: React.FC<ViewTaskTypesModalProps> = ({
  isOpen,
  onClose,
  skill,
  onRemoveFromTaskType
}) => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && skill) {
      loadTaskTypesWithSkill();
    }
  }, [isOpen, skill]);

  const loadTaskTypesWithSkill = async () => {
    if (!skill) return;

    try {
      setLoading(true);
      setError(null);

      // Get all task types and filter by skill
      const allTaskTypes = await databaseService.getTaskTypes();
      const filteredTaskTypes = allTaskTypes.filter(taskType =>
        taskType.skills?.includes(skill.id!)
      );

      setTaskTypes(filteredTaskTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task types');
    } finally {
      setLoading(false);
    }
  };

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removingTaskType, setRemovingTaskType] = useState<TaskType | null>(null);

  const handleRemoveFromTaskType = (taskType: TaskType) => {
    setRemovingTaskType(taskType);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!skill || !removingTaskType) return;

    try {
      // Update task type to remove this skill
      const updatedSkills = removingTaskType.skills?.filter(id => id !== skill.id) || [];
      await databaseService.updateTaskType({
        id: removingTaskType.id,
        name: removingTaskType.name,
        description: removingTaskType.description || '',
        skills: updatedSkills
      });

      // Close confirmation and reload
      setShowRemoveConfirm(false);
      setRemovingTaskType(null);
      await loadTaskTypesWithSkill();

      // Notify parent component
      if (onRemoveFromTaskType) {
        onRemoveFromTaskType(removingTaskType.id!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove skill from task type');
      setShowRemoveConfirm(false);
      setRemovingTaskType(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content large-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="modal-header">
            <h2>📋 Task Types Using "{skill?.name}"</h2>
            <button className="modal-close" onClick={onClose}>×</button>
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
                <button onClick={loadTaskTypesWithSkill} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="members-header">
                  <p className="members-count">
                    {taskTypes.length} {taskTypes.length === 1 ? 'task type uses' : 'task types use'} this skill
                  </p>
                </div>

                {taskTypes.length === 0 ? (
                  <div className="empty-state">
                    <p>No task types are currently using this skill.</p>
                    <p className="text-muted">Use "Add to Task Type" to assign this skill to task types.</p>
                  </div>
                ) : (
                  <div className="members-list">
                    {taskTypes.map((taskType) => (
                      <div key={taskType.id} className="member-item">
                        <div className="member-info">
                          <div className="member-name">
                            {taskType.name}
                          </div>
                          <div className="member-details">
                            <span className="member-position">
                              {taskType.description || 'No description'}
                            </span>
                            {taskType.projectCount && taskType.projectCount > 0 && (
                              <span
                                className="member-role"
                                style={{
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {taskType.projectCount} {taskType.projectCount === 1 ? 'project' : 'projects'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="member-actions">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveFromTaskType(taskType)}
                            title={`Remove skill from ${taskType.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </motion.div>
      </div>

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="Remove Skill from Task Type"
        message={`Are you sure you want to remove skill "${skill?.name}" from task type "${removingTaskType?.name}"? This action cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => {
          setShowRemoveConfirm(false);
          setRemovingTaskType(null);
        }}
        confirmText="Remove"
        confirmVariant="danger"
      />
    </AnimatePresence>
  );
};

export default ViewTaskTypesModal;