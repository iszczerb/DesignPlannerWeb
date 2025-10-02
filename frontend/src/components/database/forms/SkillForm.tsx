import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skill,
  CreateSkillDto,
  UpdateSkillDto,
  EntityFormProps,
  SkillCategory,
  SKILL_CATEGORY_LABELS
} from '../../../types/database';
import { ModalHeader } from '../../common/modal/ModalHeader';
import { ModalFooter } from '../../common/modal/ModalFooter';
import { StandardButton } from '../../common/modal/StandardButton';
import './EntityForm.css';

const SkillForm: React.FC<EntityFormProps<Skill, CreateSkillDto, UpdateSkillDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: skill,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (skill && !isCreating) {
        setFormData({
          name: skill.name || '',
          category: skill.category || '',
          description: skill.description || ''
        });
      } else {
        setFormData({
          name: '',
          category: '',
          description: ''
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, skill, isCreating]);

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
      newErrors.name = 'Skill name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Don't set default category - allow empty/null value
      const submitData = {
        ...formData,
        category: formData.category || null
      };

      const finalData = isCreating
        ? submitData as CreateSkillDto
        : { ...submitData, id: skill!.id! } as UpdateSkillDto;

      await onSave(finalData);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    }
  };

  const handleClose = () => {
    onClose();
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
            title={isCreating ? 'Add New Skill' : 'Edit Skill'}
            onClose={handleClose}
            variant="primary"
          />

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">Skill Name</label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., AutoCAD, Revit"
                  disabled={loading}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">Skill Type</label>
                <div className="form-select-wrapper">
                  <select
                    id="category"
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as SkillCategory)}
                    disabled={loading}
                  >
                    <option value="">Select skill type (optional)</option>
                    {Object.entries(SKILL_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="form-select-arrow">▼</span>
                </div>
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Skill description and requirements"
                  disabled={loading}
                  rows={3}
                />
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
                {isCreating ? '+ Create Skill' : '💾 Save Changes'}
              </StandardButton>
            }
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SkillForm;