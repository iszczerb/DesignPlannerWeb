import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  EntityFormProps,
  User
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
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
    description: '',
    leaderId: 0,
    userIds: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (team && !isCreating) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
          leaderId: team.leaderId || 0,
          userIds: team.userIds || []
        });
      } else {
        setFormData({
          name: '',
          description: '',
          leaderId: 0,
          userIds: []
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, team, isCreating]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const userData = await databaseService.getUsers();
      setUsers(userData.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

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
                <label className="form-label">Team Members</label>
                <div className="form-checkbox-group">
                  {loadingUsers ? (
                    <span className="form-info-text">Loading users...</span>
                  ) : users.length > 0 ? (
                    <div className="form-checkbox-grid">
                      {users.map(user => (
                        <label key={user.id} className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.userIds.includes(user.id!)}
                            onChange={(e) => {
                              const userId = user.id!;
                              if (e.target.checked) {
                                handleInputChange('userIds', [...formData.userIds, userId]);
                              } else {
                                handleInputChange('userIds', formData.userIds.filter(id => id !== userId));
                              }
                            }}
                            disabled={loading}
                          />
                          <span className="form-checkbox-label">
                            {user.firstName} {user.lastName}
                            {user.employee?.position && (
                              <small className="form-checkbox-detail"> - {user.employee.position}</small>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="form-info-text">No users available. Create users first.</span>
                  )}
                </div>
                {formData.userIds.length > 0 && (
                  <span className="form-helper-text">
                    {formData.userIds.length} member{formData.userIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
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