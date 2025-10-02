import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TeamMemberViewModalProps,
  TeamMemberDto,
  TEAM_TYPE_LABELS,
  SKILL_TYPE_LABELS,
  TEAM_TYPE_COLORS,
  SKILL_TYPE_COLORS
} from '../../types/schedule';
import ConfirmationDialog from '../common/ConfirmationDialog';

const TeamMemberViewModal: React.FC<TeamMemberViewModalProps> = ({
  isOpen,
  member,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !member) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEdit = () => {
    onEdit?.(member);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(member.employeeId);
    setShowDeleteConfirm(false);
  };

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
            maxWidth: '600px',
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
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '4px',
                }}>
                  {member.firstName} {member.lastName}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    fontWeight: '500',
                  }}>
                    {member.role}
                  </span>
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#d1d5db',
                  }} />
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: `${TEAM_TYPE_COLORS[member.teamType]}15`,
                    color: TEAM_TYPE_COLORS[member.teamType],
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: TEAM_TYPE_COLORS[member.teamType],
                    }} />
                    {TEAM_TYPE_LABELS[member.teamType]} Team
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: member.isActive ? '#10b981' : '#6b7280',
                  }} />
                  <span style={{
                    fontSize: '0.875rem',
                    color: member.isActive ? '#10b981' : '#6b7280',
                    fontWeight: '500',
                  }}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
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
                  marginLeft: '16px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Skills Section */}
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
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {(member.skills || []).map(skill => (
                  <span
                    key={skill}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: `${SKILL_TYPE_COLORS[skill]}15`,
                      color: SKILL_TYPE_COLORS[skill],
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: `1px solid ${SKILL_TYPE_COLORS[skill]}30`,
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: SKILL_TYPE_COLORS[skill],
                    }} />
                    {SKILL_TYPE_LABELS[skill]}
                  </span>
                ))}
              </div>
            </div>


            {/* Employment Details */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
              }}>
                Employment Details
              </h3>
              <div style={{
                display: 'grid',
                gap: '12px',
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: '500',
                    minWidth: '80px',
                  }}>
                    Start Date:
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}>
                    {formatDate(member.startDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: '500',
                    minWidth: '80px',
                  }}>
                    Employee ID:
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                  }}>
                    #{member.employeeId}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {member.notes && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                }}>
                  Notes
                </h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}>
                  {member.notes}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
            }}>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#dc2626',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fecaca';
                  e.currentTarget.style.borderColor = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                Delete Member
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
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
                  Close
                </button>
                <button
                  onClick={handleEdit}
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
                  Edit Member
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${member.firstName} ${member.lastName}?\n\nTeam: ${TEAM_TYPE_LABELS[member.teamType]}\nRole: ${member.role}\nSkills: ${(member.skills || []).map(s => SKILL_TYPE_LABELS[s]).join(', ')}\n\nThis action cannot be undone and will:\n• Remove the member from all teams and assignments\n• Delete all associated schedule data\n• Remove access to all systems and projects`}
        confirmText="Delete Member"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AnimatePresence>
  );
};

export default TeamMemberViewModal;