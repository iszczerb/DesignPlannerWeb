import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TaskType,
  CreateTaskTypeDto,
  UpdateTaskTypeDto,
  EntityFormProps,
  Skill,
  DEFAULT_TASK_TYPE_COLORS
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
    color: DEFAULT_TASK_TYPE_COLORS[0],
    requiredSkills: [] as number[],
    estimatedHours: '',
    isActive: true
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
          color: taskType.color || DEFAULT_TASK_TYPE_COLORS[0],
          requiredSkills: taskType.requiredSkills || [],
          estimatedHours: taskType.estimatedHours?.toString() || '',
          isActive: taskType.isActive ?? true
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: DEFAULT_TASK_TYPE_COLORS[0],
          requiredSkills: [],
          estimatedHours: '',
          isActive: true
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
      setSkills(skillsData.filter(s => s.isActive));
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillToggle = (skillId: number) => {
    const newSkills = formData.requiredSkills.includes(skillId)
      ? formData.requiredSkills.filter(id => id !== skillId)
      : [...formData.requiredSkills, skillId];
    handleInputChange('requiredSkills', newSkills);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task type name is required';
    }

    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    if (formData.estimatedHours && isNaN(parseFloat(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Please enter a valid number of hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
      };

      const finalData = isCreating
        ? submitData as CreateTaskTypeDto
        : { ...submitData, id: taskType!.id! } as UpdateTaskTypeDto;

      await onSave(finalData);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="entity-form-overlay" onClick={handleClose}>
        <motion.div
          className="entity-form-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="entity-form-header">
            <h2>{isCreating ? 'Add New Task Type' : 'Edit Task Type'}</h2>
            <button className="entity-form-close" onClick={handleClose} disabled={loading}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">Task Type Name</label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Design Review, Modeling"
                  disabled={loading}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="estimatedHours" className="form-label">Estimated Hours</label>
                <input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  className={`form-input ${errors.estimatedHours ? 'error' : ''}`}
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.estimatedHours && <span className="form-error">{errors.estimatedHours}</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Task type description"
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label required">Color</label>
                <div className="color-picker-container">
                  <div
                    className="color-picker-preview"
                    style={{ backgroundColor: formData.color }}
                    onClick={() => {/* Color picker logic */}}
                  />
                  <input
                    type="text"
                    className={`form-input color-picker-input ${errors.color ? 'error' : ''}`}
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="#FF0000"
                    disabled={loading}
                  />
                </div>
                <div className="color-palette">
                  {DEFAULT_TASK_TYPE_COLORS.map(color => (
                    <div
                      key={color}
                      className={`color-palette-item ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
                {errors.color && <span className="form-error">{errors.color}</span>}
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">Required Skills</label>
                {loadingSkills ? (
                  <div className="form-help">Loading skills...</div>
                ) : (
                  <div className="multiselect-options">
                    {skills.map(skill => (
                      <label key={skill.id} className="multiselect-option">
                        <input
                          type="checkbox"
                          checked={formData.requiredSkills.includes(skill.id!)}
                          onChange={() => handleSkillToggle(skill.id!)}
                          disabled={loading}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="form-checkbox-label">Active Task Type</span>
                </label>
              </div>
            </div>

            {errors.submit && (
              <div className="form-error form-error-submit">{errors.submit}</div>
            )}

            <div className="entity-form-actions">
              <button type="button" className="database-btn database-btn-secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="database-btn database-btn-primary" disabled={loading || !isDirty}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {isCreating ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isCreating ? '+ Create Task Type' : '💾 Save Changes'
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