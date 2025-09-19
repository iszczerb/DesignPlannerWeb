import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  EntityFormProps,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  Client,
  Category
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
    clientId: 0,
    name: '',
    description: '',
    categoryId: 0,
    status: '',
    startDate: '',
    deadline: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    console.log('🔄 PROJECT FORM - useEffect triggered');
    console.log('📊 PROJECT FORM - isOpen:', isOpen);
    console.log('📊 PROJECT FORM - project:', project);
    console.log('📊 PROJECT FORM - isCreating:', isCreating);

    if (isOpen) {
      loadClients();
      loadCategories();
      if (project && !isCreating) {
        console.log('📝 PROJECT FORM - Loading existing project data');
        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (date: any) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        };

        const formDataToSet = {
          clientId: project.clientId || 0,
          name: project.name || '',
          description: project.description || '',
          categoryId: project.categoryId || 0,
          status: project.status ? project.status.toString() : '',
          startDate: formatDateForInput(project.startDate),
          deadline: formatDateForInput(project.deadlineDate)
        };

        console.log('📋 PROJECT FORM - Setting form data to:', formDataToSet);
        setFormData(formDataToSet);
      } else {
        console.log('➕ PROJECT FORM - Creating new project (no defaults)');
        // For new projects: no auto-defaults, let user choose everything
        setFormData({
          clientId: 0,
          name: '',
          description: '',
          categoryId: 0,
          status: '',
          startDate: '',
          deadline: ''
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
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await databaseService.getCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
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

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    }

    if (!formData.clientId || formData.clientId === 0) {
      newErrors.clientId = 'Please select a client';
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      newErrors.categoryId = 'Please select a category';
    }


    if (formData.startDate && formData.deadline) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.deadline);
      if (endDate <= startDate) {
        newErrors.deadline = 'Deadline must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🟢 PROJECT FORM SUBMIT - handleSubmit called');
    e.preventDefault();

    console.log('🔍 PROJECT FORM - validating form...');
    if (!validateForm()) {
      console.log('❌ PROJECT FORM - validation failed');
      return;
    }
    console.log('✅ PROJECT FORM - validation passed');

    try {
      const submitData = {
        clientId: parseInt(formData.clientId.toString()),
        categoryId: parseInt(formData.categoryId.toString()),
        name: formData.name,
        description: formData.description,
        status: formData.status ? parseInt(formData.status.toString()) as ProjectStatus : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        deadlineDate: formData.deadline ? new Date(formData.deadline) : undefined
      };

      const finalData = isCreating
        ? submitData as CreateProjectDto
        : { ...submitData, id: project!.id! } as UpdateProjectDto;

      console.log('📋 PROJECT FORM - submitting data:', finalData);
      console.log('🚀 PROJECT FORM - calling onSave...');
      await onSave(finalData);
      console.log('✅ PROJECT FORM - onSave completed successfully');
    } catch (error) {
      console.log('❌ PROJECT FORM - error in handleSubmit:', error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    }
  };

  const handleClose = () => {
    if (isDirty && !loading) {
      // Custom confirmation instead of browser alert
      const shouldClose = isDirty ? false : true;
      if (shouldClose) {
        onClose();
      }
      // For now, just close - we can add a proper modal confirmation later if needed
      onClose();
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
            <div className="form-grid project-form-grid">
              {/* First Row - Client and Category */}
              <div className="form-group">
                <label htmlFor="clientId" className="form-label required">
                  Client
                </label>
                <div className="form-select-wrapper">
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
                  <span className="form-select-arrow">▼</span>
                </div>
                {errors.clientId && <span className="form-error">{errors.clientId}</span>}
                {loadingClients && <span className="form-help">Loading clients...</span>}
              </div>

              <div className="form-group">
                <label htmlFor="categoryId" className="form-label required">
                  Category
                </label>
                <div className="form-select-wrapper">
                  <select
                    id="categoryId"
                    className={`form-select ${errors.categoryId ? 'error' : ''}`}
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', parseInt(e.target.value))}
                    disabled={loading || loadingCategories}
                  >
                    <option value={0}>Select a category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <span className="form-select-arrow">▼</span>
                </div>
                {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
                {loadingCategories && <span className="form-help">Loading categories...</span>}
              </div>

              {/* Second Row - Project Name (full width) */}
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

              {/* Third Row - Description (full width) */}
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

              {/* Fourth Row - Status, Start Date, and Deadline */}
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <div className="form-select-wrapper">
                  <select
                    id="status"
                    className={`form-select ${errors.status ? 'error' : ''}`}
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select status...</option>
                    {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="form-select-arrow">▼</span>
                </div>
                {errors.status && <span className="form-error">{errors.status}</span>}
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