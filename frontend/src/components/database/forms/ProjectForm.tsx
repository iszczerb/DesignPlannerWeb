import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  EntityFormProps,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  Client
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './EntityForm.css';

const ProjectForm: React.FC<EntityFormProps<Project, CreateProjectDto, UpdateProjectDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: project,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    clientId: 0,
    status: ProjectStatus.Planning,
    startDate: '',
    deadline: '',
    budget: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (project && !isCreating) {
        setFormData({
          code: project.code || '',
          name: project.name || '',
          description: project.description || '',
          clientId: project.clientId || 0,
          status: project.status || ProjectStatus.Planning,
          startDate: project.startDate || '',
          deadline: project.deadline || '',
          budget: project.budget ? project.budget.toString() : '',
          isActive: project.isActive ?? true
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          clientId: 0,
          status: ProjectStatus.Planning,
          startDate: '',
          deadline: '',
          budget: '',
          isActive: true
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, project, isCreating]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientsData = await databaseService.getClients();
      setClients(clientsData.filter(c => c.isActive));
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoadingClients(false);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Project code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Project code must be at least 2 characters';
    } else if (!/^[A-Z0-9\-]+$/.test(formData.code)) {
      newErrors.code = 'Project code must contain only uppercase letters, numbers, and hyphens';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    }

    if (!formData.clientId || formData.clientId === 0) {
      newErrors.clientId = 'Please select a client';
    }

    if (formData.startDate && formData.deadline) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.deadline);
      if (endDate <= startDate) {
        newErrors.deadline = 'Deadline must be after start date';
      }
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Please enter a valid budget amount';
    } else if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Budget must be a positive number';
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
      const submitData = {
        ...formData,
        clientId: parseInt(formData.clientId.toString()),
        status: parseInt(formData.status.toString()) as ProjectStatus,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      const finalData = isCreating
        ? submitData as CreateProjectDto
        : { ...submitData, id: project!.id! } as UpdateProjectDto;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      handleClose();
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
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
            <h2>{isCreating ? 'Add New Project' : 'Edit Project'}</h2>
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
                  Project Code
                </label>
                <input
                  id="code"
                  type="text"
                  className={`form-input ${errors.code ? 'error' : ''}`}
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., PROJ-001, WEB-2024"
                  disabled={loading}
                  maxLength={20}
                />
                {errors.code && <span className="form-error">{errors.code}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="clientId" className="form-label required">
                  Client
                </label>
                <select
                  id="clientId"
                  className={`form-select ${errors.clientId ? 'error' : ''}`}
                  value={formData.clientId}
                  onChange={(e) => handleInputChange('clientId', parseInt(e.target.value))}
                  disabled={loading || loadingClients}
                >
                  <option value={0}>Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.code} - {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId && <span className="form-error">{errors.clientId}</span>}
                {loadingClients && <span className="form-help">Loading clients...</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="name" className="form-label required">
                  Project Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full project name"
                  disabled={loading}
                  maxLength={150}
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
                  placeholder="Project description and scope"
                  disabled={loading}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label required">
                  Status
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
                  disabled={loading}
                >
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budget" className="form-label">
                  Budget ($)
                </label>
                <input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input ${errors.budget ? 'error' : ''}`}
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors.budget && <span className="form-error">{errors.budget}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={getTodayDate()}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline" className="form-label">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  className={`form-input ${errors.deadline ? 'error' : ''}`}
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  min={formData.startDate || getTodayDate()}
                  disabled={loading}
                />
                {errors.deadline && <span className="form-error">{errors.deadline}</span>}
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="form-checkbox-label">Active Project</span>
                </label>
                <div className="form-help">
                  Inactive projects won't appear in task creation
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
                    {isCreating ? '+ Create Project' : '💾 Save Changes'}
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

export default ProjectForm;