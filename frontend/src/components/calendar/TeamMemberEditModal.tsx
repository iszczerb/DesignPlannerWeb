import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TeamMemberEditModalProps,
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  TeamDto,
  SkillType,
  SKILL_TYPE_LABELS,
  SKILL_TYPE_COLORS
} from '../../types/schedule';
import teamService from '../../services/teamService';

const TeamMemberEditModal: React.FC<TeamMemberEditModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
  isCreating = false
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    teamId: 1, // Default to first team
    skills: [] as SkillType[],
    startDate: '',
    notes: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTeams, setAvailableTeams] = useState<TeamDto[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load available teams
      const loadTeams = async () => {
        setIsLoadingTeams(true);
        try {
          const teams = await teamService.getAvailableTeams();
          setAvailableTeams(teams);

          if (member && !isCreating) {
            // Editing existing member
            setFormData({
              firstName: member.firstName || '',
              lastName: member.lastName || '',
              role: member.role || '',
              teamId: member.teamId || teams[0]?.id || 1,
              skills: member.skills || [],
              startDate: member.startDate || new Date().toISOString().split('T')[0],
              notes: member.notes || '',
              isActive: member.isActive ?? true
            });
          } else {
            // Creating new member
            setFormData({
              firstName: '',
              lastName: '',
              role: '',
              teamId: teams[0]?.id || 1,
              skills: [],
              startDate: '',
              notes: '',
              isActive: true
            });
          }
        } catch (error) {
          console.error('Failed to load teams:', error);
          // Set default values if team loading fails
          setFormData(prev => ({
            ...prev,
            teamId: 1
          }));
        } finally {
          setIsLoadingTeams(false);
        }
      };

      loadTeams();
      setErrors({});
    }
  }, [isOpen, member, isCreating]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (isCreating) {
      // Auto-generate employeeId based on timestamp and random number
      const autoEmployeeId = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

      const createDto: CreateTeamMemberDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role.trim(),
        employeeId: autoEmployeeId,
        teamId: formData.teamId,
        skills: formData.skills,
        startDate: formData.startDate || undefined,
        notes: formData.notes.trim() || undefined
      };
      onSave(createDto);
    } else if (member) {
      const updateDto: UpdateTeamMemberDto = {
        employeeId: member.employeeId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role.trim(),
        teamId: formData.teamId,
        skills: formData.skills,
        startDate: formData.startDate || undefined,
        notes: formData.notes.trim() || undefined,
        isActive: formData.isActive
      };
      onSave(updateDto);
    }
  };

  const handleSkillToggle = (skill: SkillType) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 0 24px',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            zIndex: 10,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
              }}>
                {isCreating ? 'Add New Team Member' : `Edit ${member?.firstName} ${member?.lastName}`}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '8px',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div style={{ padding: '24px' }}>
            {/* Basic Information */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
              }}>
                Basic Information
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px',
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.firstName ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px',
                  }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.lastName ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px',
                  }}>
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.role ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                    placeholder="e.g. Senior Engineer, Designer"
                  />
                  {errors.role && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {errors.role}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px',
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.startDate ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.startDate && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {errors.startDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Team Selection */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
              }}>
                Team Assignment
              </h3>
              {isLoadingTeams ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}>
                  Loading teams...
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '8px',
                }}>
                  {availableTeams.map(team => (
                    <motion.div
                      key={team.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, teamId: team.id }))}
                      style={{
                        padding: '12px 16px',
                        border: formData.teamId === team.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: formData.teamId === team.id ? '#eff6ff' : 'white',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                      }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: formData.teamId === team.id ? '600' : '500',
                        color: formData.teamId === team.id ? '#1d4ed8' : '#374151',
                      }}>
                        {team.name}
                      </span>
                    </motion.div>
                  ))}
                  {availableTeams.length === 0 && !isLoadingTeams && (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#ef4444',
                      fontSize: '0.875rem',
                    }}>
                      No teams available. Please contact your administrator.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills Selection */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
              }}>
                Skills & Expertise
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                marginBottom: '8px',
              }}>
                {Object.values(SkillType).filter(s => typeof s === 'number').map(skill => (
                  <motion.div
                    key={skill}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSkillToggle(skill as SkillType)}
                    style={{
                      padding: '8px 12px',
                      border: formData.skills.includes(skill as SkillType) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: formData.skills.includes(skill as SkillType) ? '#eff6ff' : 'white',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: SKILL_TYPE_COLORS[skill as SkillType],
                    }} />
                    <span style={{
                      fontWeight: formData.skills.includes(skill as SkillType) ? '600' : '500',
                      color: formData.skills.includes(skill as SkillType) ? '#1d4ed8' : '#374151',
                    }}>
                      {SKILL_TYPE_LABELS[skill as SkillType]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>



            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px',
              }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                placeholder="Additional notes about the team member..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                {isCreating ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TeamMemberEditModal;