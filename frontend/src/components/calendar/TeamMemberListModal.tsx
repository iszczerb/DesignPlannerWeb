import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TeamMemberListModalProps,
  TeamMemberDto,
  TeamType,
  TEAM_TYPE_LABELS,
  SKILL_TYPE_LABELS,
  TEAM_TYPE_COLORS,
  SKILL_TYPE_COLORS
} from '../../types/schedule';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface TeamMemberListProps extends TeamMemberListModalProps {
  members: TeamMemberDto[];
}

const TeamMemberListModal: React.FC<TeamMemberListProps> = ({
  isOpen,
  onClose,
  teamId,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onCreateMember,
  members = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'team' | 'startDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; member: TeamMemberDto | null }>({
    isOpen: false,
    member: null
  });

  const teamStats = useMemo(() => {
    const stats = {
      total: members.length,
      byTeam: {} as Record<TeamType, number>
    };

    Object.values(TeamType).forEach(team => {
      if (typeof team === 'number') {
        stats.byTeam[team] = members.filter(m => m.teamType === team).length;
      }
    });

    return stats;
  }, [members]);

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      const matchesSearch = searchTerm === '' ||
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam = selectedTeam === 'all' || member.teamType === selectedTeam;

      return matchesSearch && matchesTeam;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'team':
          comparison = TEAM_TYPE_LABELS[a.teamType].localeCompare(TEAM_TYPE_LABELS[b.teamType]);
          break;
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [members, searchTerm, selectedTeam, sortBy, sortOrder]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        key="modal-backdrop"
        style={{
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
          key="team-member-list-modal"
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '4px',
                }}>
                  Manage Team Members
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#6b7280',
                }}>
                  Manage your team members and their details
                </p>
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
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {teamStats.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total</div>
              </div>
              {Object.values(TeamType).filter(t => typeof t === 'number').map(teamType => (
                <div
                  key={teamType}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: TEAM_TYPE_COLORS[teamType as TeamType]
                  }}>
                    {teamStats.byTeam[teamType as TeamType] || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {TEAM_TYPE_LABELS[teamType as TeamType]}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Search */}
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              />

              {/* Team Filter */}
              <select
                value={selectedTeam}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTeam(value === 'all' ? 'all' : parseInt(value) as TeamType);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                }}
              >
                <option value="all">All Teams</option>
                {Object.values(TeamType).filter(t => typeof t === 'number').map(teamType => (
                  <option key={teamType} value={teamType}>
                    {TEAM_TYPE_LABELS[teamType as TeamType]}
                  </option>
                ))}
              </select>

              {/* Add New Button */}
              <button
                onClick={onCreateMember}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                + Add Member
              </button>
            </div>
          </div>

          {/* Members List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '0',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px',
              gap: '16px',
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <button
                onClick={() => handleSort('name')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textAlign: 'left',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('role')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textAlign: 'left',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('team')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textAlign: 'left',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Team {sortBy === 'team' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('startDate')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textAlign: 'left',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Start Date {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <div>Actions</div>
            </div>

            {/* Members Rows */}
            <div style={{ minHeight: '300px' }}>
              {filteredAndSortedMembers.length === 0 ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#6b7280',
                }}>
                  <div style={{ fontSize: '1.125rem', marginBottom: '8px' }}>
                    {searchTerm || selectedTeam !== 'all' ? 'No members found' : 'No team members yet'}
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {searchTerm || selectedTeam !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Add your first team member to get started'}
                  </div>
                </div>
              ) : (
                filteredAndSortedMembers.map((member, index) => (
                  <motion.div
                    key={member.employeeId || `member-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px',
                      gap: '16px',
                      padding: '16px 24px',
                      borderBottom: '1px solid #f3f4f6',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Name & Status */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: '#111827',
                        }}>
                          {member.firstName} {member.lastName}
                        </span>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: member.isActive ? '#10b981' : '#6b7280',
                        }} />
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginTop: '4px',
                      }}>
                        {(member.skills || []).slice(0, 3).map((skill, skillIndex) => (
                          <span
                            key={skill || `skill-${skillIndex}`}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: `${SKILL_TYPE_COLORS[skill]}15`,
                              color: SKILL_TYPE_COLORS[skill],
                              fontSize: '0.6875rem',
                              fontWeight: '500',
                            }}
                          >
                            {SKILL_TYPE_LABELS[skill]}
                          </span>
                        ))}
                        {(member.skills || []).length > 3 && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.6875rem',
                            fontWeight: '500',
                          }}>
                            +{(member.skills || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div style={{ color: '#6b7280' }}>
                      {member.role}
                    </div>

                    {/* Team */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: TEAM_TYPE_COLORS[member.teamType],
                      }} />
                      {TEAM_TYPE_LABELS[member.teamType]}
                    </div>

                    {/* Start Date */}
                    <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                      {formatDate(member.startDate)}
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                    }}>
                      <button
                        onClick={() => onViewMember?.(member)}
                        style={{
                          padding: '4px 6px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: '#374151',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        title="View member details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => onEditMember?.(member)}
                        style={{
                          padding: '4px 6px',
                          backgroundColor: '#3b82f6',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: 'white',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        title="Edit member"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, member })}
                        style={{
                          padding: '4px 6px',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: '#dc2626',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                          e.currentTarget.style.borderColor = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.borderColor = '#fecaca';
                        }}
                        title="Delete member"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}>
              <span>
                Showing {filteredAndSortedMembers.length} of {members.length} members
              </span>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Team Member"
        message={deleteConfirm.member ? `Are you sure you want to delete ${deleteConfirm.member.firstName} ${deleteConfirm.member.lastName}?\n\nTeam: ${TEAM_TYPE_LABELS[deleteConfirm.member.teamType]}\nRole: ${deleteConfirm.member.role}\n\nThis action cannot be undone and will:\n• Remove the member from all teams and assignments\n• Delete all associated schedule data\n• Remove access to all systems and projects` : ''}
        confirmText="Delete Member"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          if (deleteConfirm.member) {
            onDeleteMember?.(deleteConfirm.member.employeeId);
            setDeleteConfirm({ isOpen: false, member: null });
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, member: null })}
      />
    </AnimatePresence>
  );
};

export default TeamMemberListModal;