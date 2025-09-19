import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, User } from '../../../types/database';
import { databaseService } from '../../../services/databaseService';
import './Modal.css';

interface ViewMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onRemoveMember?: (userId: number) => void;
}

const ViewMembersModal: React.FC<ViewMembersModalProps> = ({
  isOpen,
  onClose,
  team,
  onRemoveMember
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && team) {
      loadTeamMembers();
    }
  }, [isOpen, team]);

  const loadTeamMembers = async () => {
    if (!team) return;

    try {
      setLoading(true);
      setError(null);

      // Get all users and filter by team
      const response = await databaseService.getUsers();
      const teamMembers = response.users.filter(user =>
        user.employee?.team?.id === team.id
      );

      setMembers(teamMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (user: User) => {
    if (!window.confirm(`Remove ${user.firstName} ${user.lastName} from team "${team?.name}"?`)) {
      return;
    }

    try {
      // Update user to remove team assignment
      await databaseService.updateUser({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        position: user.employee?.position || '',
        teamId: 0, // Remove team assignment
        skillIds: user.employee?.skills?.map(s => s.id) || [],
        isActive: user.isActive
      });

      // Reload members
      await loadTeamMembers();

      // Notify parent component
      if (onRemoveMember) {
        onRemoveMember(user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from team');
    }
  };

  const getManagementLevelText = (role: number) => {
    switch(role) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Team Member';
      default: return 'Unknown';
    }
  };

  const getManagementLevelColor = (role: number) => {
    switch(role) {
      case 1: return '#dc2626'; // Admin - red
      case 2: return '#2563eb'; // Manager - blue
      case 3: return '#059669'; // Team Member - green
      default: return '#6b7280'; // Unknown - gray
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content large-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="modal-header">
            <h2>👥 {team?.name} Members</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading team members...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p className="error-message">{error}</p>
                <button onClick={loadTeamMembers} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="members-header">
                  <p className="members-count">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </p>
                </div>

                {members.length === 0 ? (
                  <div className="empty-state">
                    <p>No members assigned to this team yet.</p>
                    <p className="text-muted">Go to Users tab to assign members to this team.</p>
                  </div>
                ) : (
                  <div className="members-list">
                    {members.map((member) => (
                      <div key={member.id} className="member-item">
                        <div className="member-info">
                          <div className="member-name">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="member-details">
                            <span className="member-username">@{member.username}</span>
                            <span className="member-position">{member.employee?.position || 'No position'}</span>
                            <span
                              className="member-role"
                              style={{
                                backgroundColor: getManagementLevelColor(member.role),
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '0.75rem'
                              }}
                            >
                              {getManagementLevelText(member.role)}
                            </span>
                          </div>
                        </div>
                        <div className="member-actions">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveMember(member)}
                            title={`Remove ${member.firstName} ${member.lastName} from team`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewMembersModal;