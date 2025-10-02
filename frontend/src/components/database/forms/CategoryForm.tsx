import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Category,
  CreateCategory,
  UpdateCategory,
  EntityFormProps
} from '../../../types/database';
import { ModalHeader } from '../../common/modal/ModalHeader';
import { ModalFooter } from '../../common/modal/ModalFooter';
import { StandardButton } from '../../common/modal/StandardButton';
import './EntityForm.css';

const CategoryForm: React.FC<EntityFormProps<Category, CreateCategory, UpdateCategory>> = ({
  isOpen,
  onClose,
  onSave,
  entity: category,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0066CC'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Modern iOS-inspired color palette for 2025 (20 professional colors)
  const presetColors = [
    // Primary Brand Colors
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',

    // Secondary Modern Colors
    '#6366f1', '#14b8a6', '#eab308', '#ec4899',
    '#a855f7', '#0ea5e9', '#22c55e', '#dc2626',

    // Professional Neutrals
    '#64748b', '#475569', '#334155', '#1e293b'
  ];

  useEffect(() => {
    if (isOpen) {
      if (category && !isCreating) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          color: category.color || '#0066CC'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#3b82f6'
        });
      }
      setErrors({});
      setIsDirty(false);
      setShowColorPicker(false);
    }
  }, [isOpen, category, isCreating]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Please select a valid color';
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
            color: formData.color
          } as CreateCategory
        : {
            ...formData,
            id: category!.id!
          } as UpdateCategory;

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
          <ModalHeader
            title={isCreating ? 'Add New Category' : 'Edit Category'}
            onClose={handleClose}
            variant="primary"
          />

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  Category Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Category name"
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
                  placeholder="Brief description of the category"
                  disabled={loading}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label required">
                  Category Color
                </label>
                <div className="color-picker-container">
                  <div className="color-preview-section">
                    <button
                      type="button"
                      className="color-preview-button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      disabled={loading}
                      style={{ backgroundColor: formData.color }}
                    >
                      <span className="color-code">{formData.color}</span>
                    </button>
                    <div className="preset-colors">
                      {presetColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`preset-color ${formData.color === color ? 'selected' : ''}`}
                          onClick={() => {
                            handleInputChange('color', color);
                            setShowColorPicker(false);
                          }}
                          style={{ backgroundColor: color }}
                          disabled={loading}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  {showColorPicker && (
                    <div className="color-picker-popover">
                      <div
                        className="color-picker-backdrop"
                        onClick={() => setShowColorPicker(false)}
                      />
                      <div className="color-picker-content">
                        <HexColorPicker
                          color={formData.color}
                          onChange={(color) => handleInputChange('color', color)}
                        />
                        <div className="color-picker-footer">
                          <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => handleInputChange('color', e.target.value)}
                            className="color-hex-input"
                            placeholder="#000000"
                            maxLength={7}
                          />
                          <button
                            type="button"
                            className="color-picker-close"
                            onClick={() => setShowColorPicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.color && <span className="form-error">{errors.color}</span>}
              </div>
            </div>

            {errors.submit && (
              <div className="form-error form-error-submit">
                {errors.submit}
              </div>
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
                {isCreating ? '+ Create Category' : '💾 Save Changes'}
              </StandardButton>
            }
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CategoryForm;