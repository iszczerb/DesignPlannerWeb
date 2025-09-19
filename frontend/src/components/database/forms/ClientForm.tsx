import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  EntityFormProps
} from '../../../types/database';
import './EntityForm.css';

const ClientForm: React.FC<EntityFormProps<Client, CreateClientDto, UpdateClientDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: client,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#0066CC',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Predefined colors for quick selection (12 colors including greys)
  const presetColors = [
    '#0066CC', '#FF6B6B', '#4ECDC4', '#52B788',
    '#F8B739', '#BB8FCE', '#FF6F61', '#6C5CE7',
    '#6B7280', '#9CA3AF', '#374151', '#1F2937'
  ];

  useEffect(() => {
    if (isOpen) {
      if (client && !isCreating) {
        setFormData({
          code: client.code || '',
          name: client.name || '',
          description: client.description || '',
          color: client.color || '#0066CC',
          isActive: true
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          color: '#0066CC',
          isActive: true
        });
      }
      setErrors({});
      setIsDirty(false);
      setShowColorPicker(false);
    }
  }, [isOpen, client, isCreating]);

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

    if (!formData.code.trim()) {
      newErrors.code = 'Client code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Client code must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Client code must contain only uppercase letters and numbers';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Client name must be at least 2 characters';
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
            code: formData.code,
            name: formData.name,
            description: formData.description || undefined,
            color: formData.color
          } as CreateClientDto
        : {
            ...formData,
            id: client!.id!
          } as UpdateClientDto;

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
            <h2>{isCreating ? 'Add New Client' : 'Edit Client'}</h2>
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
                  Client Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full client name"
                  disabled={loading}
                  maxLength={100}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label required">
                  Client Code
                </label>
                <input
                  id="code"
                  type="text"
                  className={`form-input ${errors.code ? 'error' : ''}`}
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., ACME, TECH"
                  disabled={loading}
                  maxLength={10}
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
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
                  placeholder="Brief description of the client"
                  disabled={loading}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label required">
                  Client Color
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
                    {isCreating ? '+ Create Client' : '💾 Save Changes'}
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

export default ClientForm;