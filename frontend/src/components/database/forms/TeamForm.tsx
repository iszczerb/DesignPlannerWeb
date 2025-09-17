import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  EntityFormProps
} from '../../../types/database';
import './EntityForm.css';

const TeamForm: React.FC<EntityFormProps<Team, CreateTeamDto, UpdateTeamDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: team,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    leaderId: 0,
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (team && !isCreating) {
        setFormData({
          name: team.name || '',
          code: team.code || '',
          description: team.description || '',
          leaderId: team.leaderId || 0,
          isActive: team.isActive ?? true
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          leaderId: 0,
          isActive: true
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, team, isCreating]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Team code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Team code must contain only uppercase letters and numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = isCreating
        ? formData as CreateTeamDto
        : { ...formData, id: team!.id! } as UpdateTeamDto;
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
            <h2>{isCreating ? 'Add New Team' : 'Edit Team'}</h2>
            <button className="entity-form-close" onClick={handleClose} disabled={loading}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">Team Name</label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Structural Engineering"
                  disabled={loading}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label required">Team Code</label>
                <input
                  id="code"
                  type="text"
                  className={`form-input ${errors.code ? 'error' : ''}`}
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., STRUCT"
                  disabled={loading}
                  maxLength={10}
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Team description and responsibilities"
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="form-checkbox-label">Active Team</span>
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
                  isCreating ? '+ Create Team' : '💾 Save Changes'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TeamForm;