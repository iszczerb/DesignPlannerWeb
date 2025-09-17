import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    contactEmail: '',
    contactPhone: '',
    address: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (client && !isCreating) {
        setFormData({
          code: client.code || '',
          name: client.name || '',
          description: client.description || '',
          contactEmail: client.contactEmail || '',
          contactPhone: client.contactPhone || '',
          address: client.address || '',
          isActive: client.isActive ?? true
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          isActive: true
        });
      }
      setErrors({});
      setIsDirty(false);
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

    if (formData.contactEmail && !isValidEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.contactPhone && !isValidPhone(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = isCreating
        ? formData as CreateClientDto
        : { ...formData, id: client!.id! } as UpdateClientDto;

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

              <div className="form-group">
                <label htmlFor="contactEmail" className="form-label">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  className={`form-input ${errors.contactEmail ? 'error' : ''}`}
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@client.com"
                  disabled={loading}
                />
                {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone" className="form-label">
                  Contact Phone
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  className={`form-input ${errors.contactPhone ? 'error' : ''}`}
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={loading}
                />
                {errors.contactPhone && <span className="form-error">{errors.contactPhone}</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <textarea
                  id="address"
                  className="form-textarea"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Client's business address"
                  disabled={loading}
                  rows={2}
                  maxLength={200}
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
                  <span className="form-checkbox-label">Active Client</span>
                </label>
                <div className="form-help">
                  Inactive clients won't appear in new project creation
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