import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  EntityFormProps,
  UserRole,
  USER_ROLE_LABELS,
  ManagementLevel,
  MANAGEMENT_LEVEL_LABELS,
  Team,
  Skill
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './EntityForm.css';

const UserForm: React.FC<EntityFormProps<User, CreateUserDto, UpdateUserDto>> = ({
  isOpen,
  onClose,
  onSave,
  entity: user,
  isCreating,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
    managementLevel: undefined as ManagementLevel | undefined,
    teamId: 0,
    skillIds: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load teams and skills when form opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const [teamsData, skillsData] = await Promise.all([
        databaseService.getTeams(),
        databaseService.getSkills()
      ]);
      setTeams(teamsData);
      setSkills(skillsData);
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (user && !isCreating) {
        // Map backend UserRole to frontend ManagementLevel
        let managementLevel = ManagementLevel.None;
        if (user.role === 1) { // UserRole.Admin
          managementLevel = ManagementLevel.Director; // Admin
        } else if (user.role === 2) { // UserRole.Manager
          managementLevel = ManagementLevel.Manager; // Manager
        } else {
          managementLevel = ManagementLevel.None; // Team Member
        }

        setFormData({
          username: user.username || '',
          password: '', // Never populate password for editing
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.employee?.position || '',
          managementLevel: managementLevel,
          teamId: user.employee?.team?.id || 0,
          skillIds: user.employee?.skills?.map(skill => skill.id) || []
        });
      } else {
        setFormData({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          role: '',
          managementLevel: undefined,
          teamId: 0,
          skillIds: []
        });
      }
      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, user, isCreating]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };


      return newData;
    });
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, dashes and underscores';
    }

    if (isCreating && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (isCreating && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!formData.teamId) {
      newErrors.teamId = 'Team is required';
    }

    if (formData.managementLevel === undefined) {
      newErrors.managementLevel = 'Management level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Map frontend ManagementLevel to backend UserRole
      let backendRole = UserRole.TeamMember;
      if (formData.managementLevel === ManagementLevel.Director) {
        backendRole = UserRole.Admin; // Admin
      } else if (formData.managementLevel === ManagementLevel.Manager) {
        backendRole = UserRole.Manager; // Manager
      } else {
        backendRole = UserRole.TeamMember; // Team Member
      }

      const submitData = isCreating
        ? { ...formData, role: backendRole, position: formData.role } as CreateUserDto
        : { ...formData, id: user!.id!, role: backendRole, position: formData.role } as UpdateUserDto;
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

  const handleSkillToggle = (skillId: number) => {
    setFormData(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId]
    }));
    setIsDirty(true);
  };

  if (!isOpen) return null;


  return (
    <AnimatePresence>
      <div className="entity-form-overlay" onClick={handleClose}>
        <motion.div
          className="entity-form-modal user-form-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="entity-form-header">
            <h2>{isCreating ? 'Add New User' : 'Edit User'}</h2>
            <button className="entity-form-close" onClick={handleClose} disabled={loading}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="entity-form-content">
            <div className="form-grid">
              {/* Username */}
              <div className="form-group">
                <label htmlFor="username" className="form-label required">Username</label>
                <input
                  id="username"
                  type="text"
                  className={`form-input ${errors.username ? 'error' : ''}`}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="e.g., john.doe"
                  disabled={loading || loadingData}
                />
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>

              {/* Password (only for create) */}
              {isCreating && (
                <div className="form-group">
                  <label htmlFor="password" className="form-label required">Initial Password</label>
                  <input
                    id="password"
                    type="text"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={loading || loadingData}
                  />
                  <small className="form-help">User must change password on first login</small>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
              )}

              {/* First Name */}
              <div className="form-group">
                <label htmlFor="firstName" className="form-label required">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="e.g., John"
                  disabled={loading || loadingData}
                />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label htmlFor="lastName" className="form-label required">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="e.g., Doe"
                  disabled={loading || loadingData}
                />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>

              {/* Role */}
              <div className="form-group">
                <label htmlFor="role" className="form-label required">Role</label>
                <input
                  id="role"
                  type="text"
                  className={`form-input ${errors.role ? 'error' : ''}`}
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., Senior Engineer, Designer, Project Manager"
                  disabled={loading || loadingData}
                />
                {errors.role && <span className="form-error">{errors.role}</span>}
              </div>

              {/* Management Level */}
              <div className="form-group">
                <label htmlFor="managementLevel" className="form-label required">Management Level</label>
                <div className="form-select-wrapper">
                  <select
                    id="managementLevel"
                    className={`form-select ${errors.managementLevel ? 'error' : ''}`}
                    value={formData.managementLevel !== undefined ? formData.managementLevel : ''}
                    onChange={(e) => handleInputChange('managementLevel', e.target.value ? parseInt(e.target.value) as ManagementLevel : undefined)}
                    disabled={loading || loadingData}
                  >
                    <option value="">Select Management Level...</option>
                    <option value={ManagementLevel.None}>Team Member</option>
                    <option value={ManagementLevel.Manager}>Manager</option>
                    <option value={ManagementLevel.Director}>Admin</option>
                  </select>
                  <span className="form-select-arrow">▼</span>
                </div>
                {errors.managementLevel && <span className="form-error">{errors.managementLevel}</span>}
              </div>

              {/* Team */}
              <div className="form-group">
                <label htmlFor="teamId" className="form-label required">Team</label>
                <div className="form-select-wrapper">
                  <select
                    id="teamId"
                    className={`form-select ${errors.teamId ? 'error' : ''}`}
                    value={formData.teamId || ''}
                    onChange={(e) => handleInputChange('teamId', e.target.value ? parseInt(e.target.value) : 0)}
                    disabled={loading || loadingData}
                  >
                    <option value="">Select Team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name} ({team.code})</option>
                    ))}
                  </select>
                  <span className="form-select-arrow">▼</span>
                </div>
                {errors.teamId && <span className="form-error">{errors.teamId}</span>}
              </div>



              {/* Skills */}
              <div className="form-group form-group-full">
                <label className="form-label">Skills (Optional)</label>
                <div className="skills-container">
                  {skills.length > 0 ? (
                    <div className="skills-grid">
                      {skills.map(skill => (
                        <label key={skill.id} className="skill-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.skillIds.includes(skill.id)}
                            onChange={() => handleSkillToggle(skill.id)}
                            disabled={loading || loadingData}
                          />
                          <span className="skill-label">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="no-skills">No skills available</span>
                  )}
                </div>
              </div>

            </div>

            {errors.submit && (
              <div className="form-error form-error-submit">{errors.submit}</div>
            )}

            <div className="entity-form-actions">
              <button type="button" className="database-btn database-btn-secondary" onClick={handleClose} disabled={loading || loadingData}>
                Cancel
              </button>
              <button type="submit" className="database-btn database-btn-primary" disabled={loading || loadingData || !isDirty}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {isCreating ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isCreating ? '+ Create User' : '💾 Save Changes'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserForm;