import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TaskType,
  CreateTaskTypeDto,
  UpdateTaskTypeDto,
  EntityFormProps,
  Skill
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './EntityForm.css';

const TaskTypeForm: React.FC<EntityFormProps<TaskType, CreateTaskTypeDto, UpdateTaskTypeDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: taskType,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSkills();
      if (taskType && !isCreating) {
        setFormData({
          name: taskType.name || '',
          description: taskType.description || '',
          skills: taskType.skills || []
        });
      } else {
        setFormData({
          name: '',
          description: '',
          skills: []
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, taskType, isCreating]);

  const loadSkills = async () => {
    try {
      setLoadingSkills(true);
      const skillsData = await databaseService.getSkills();
      setSkills(Array.isArray(skillsData) ? skillsData : []);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillToggle = (skillId: number) => {
    const newSkills = formData.skills.includes(skillId)
      ? formData.skills.filter(id => id !== skillId)
      : [...formData.skills, skillId];
    handleInputChange('skills', newSkills);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task type name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Task type name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = isCreating
        ? {
            name: formData.name,
            description: formData.description || undefined,
            skills: formData.skills
          } as CreateTaskTypeDto
        : {
            ...formData,
            id: taskType!.id!
          } as UpdateTaskTypeDto;

      await onSave(submitData);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    }
  };

  const handleClose = () => {
    if (isDirty && !loading) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="entity-form-overlay" onClick={handleClose} onKeyDown={handleKeyDown} tabIndex={-1}>
        <motion.div
          className="entity-form-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="entity-form-header">
            <h2>{isCreating ? 'Add New Task Type' : 'Edit Task Type'}</h2>
            <button
              className="entity-form-close"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Task Type Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Design Review, Modeling, Analysis"
                  disabled={loading}
                  maxLength={100}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this task type"
                  disabled={loading}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">
                  Skills
                </label>
                {loadingSkills ? (
                  <div className="form-help">Loading skills...</div>
                ) : skills.length === 0 ? (
                  <div className="form-help">No skills available. Create skills first to assign them to task types.</div>
                ) : (
                  <div className="multiselect-options">
                    {skills.map(skill => (
                      <label key={skill.id} className="multiselect-option">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill.id!)}
                          onChange={() => handleSkillToggle(skill.id!)}
                          disabled={loading}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                )}
                <div className="form-help">
                  Select the skills required for this task type. Multiple skills can be selected.
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="form-error form-error-submit">
                {errors.submit}
              </div>
            )}

            <div className="entity-form-actions">
              <button
                type="button"
                className="database-btn database-btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="database-btn database-btn-primary"
                disabled={loading || !isDirty}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {isCreating ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {isCreating ? '+ Create Task Type' : '💾 Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskTypeForm;