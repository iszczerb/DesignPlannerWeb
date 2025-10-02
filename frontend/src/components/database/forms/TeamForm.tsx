import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  EntityFormProps
} from '../../../types/database';
import { ModalHeader } from '../../common/modal/ModalHeader';
import { ModalFooter } from '../../common/modal/ModalFooter';
import { StandardButton } from '../../common/modal/StandardButton';
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
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (team && !isCreating) {
        setFormData({
          name: team.name || '',
          description: team.description || ''
        });
      } else {
        setFormData({
          name: '',
          description: ''
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


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = isCreating
        ? { ...formData, code: 'AUTO' } as CreateTeamDto
        : { ...formData, id: team!.id!, code: team!.code, isActive: team!.isActive } as UpdateTeamDto;
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
          <ModalHeader
            title={isCreating ? 'Add New Team' : 'Edit Team'}
            onClose={handleClose}
            variant="primary"
          />

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

              <div className="form-group form-group-full">
                <div className="form-info">
                  <span className="form-info-text">
                    💡 <strong>Team Members Assignment:</strong> Users are assigned to teams in the <strong>Users tab</strong>.
                    Create team members there and set their team assignment.
                  </span>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="form-error form-error-submit">{errors.submit}</div>
            )}
          </form>

          <ModalFooter
            primaryAction={
              <StandardButton
                type="submit"
                variant="contained"
                colorScheme="primary"
                loading={loading}
                disabled={!isDirty}
                onClick={handleSubmit}
              >
                {isCreating ? '+ Create Team' : '💾 Save Changes'}
              </StandardButton>
            }
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TeamForm;