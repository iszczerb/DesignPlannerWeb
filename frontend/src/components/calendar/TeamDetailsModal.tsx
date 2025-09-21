import React, { useState, useEffect } from 'react';
import { TeamStats, teamStatsService } from '../../services/teamStatsService';
import { EmployeeCalendarDto } from '../../types/schedule';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  teamMembers: EmployeeCalendarDto[];
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamMembers
}) => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'weekly' | 'monthly'>('general');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Get unique structural teams for the dropdown
  const structuralTeams = [...new Set(teamMembers.map(member => member.team))].filter(team => team && team !== '');

  // Filter members based on selected team
  const filteredMembers = teamFilter === 'all' ? teamMembers : teamMembers.filter(member => member.team === teamFilter);

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamStats();
    }
  }, [isOpen, teamId]);

  const loadTeamStats = async () => {
    if (!teamId || !filteredMembers.length) return;

    setLoading(true);
    try {
      const teamStats = await teamStatsService.getTeamStats(teamId, filteredMembers);
      setStats(teamStats);
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload stats when team filter changes
  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamStats();
    }
  }, [teamFilter]);

  if (!isOpen) return null;

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <div style={{
      backgroundColor: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${color}20`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      textAlign: 'center',
      minWidth: '140px',
    }}>
      <div style={{
        fontSize: '1.5rem',
        marginBottom: '4px',
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: color,
        marginBottom: '2px',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#64748b',
        fontWeight: '500',
      }}>
        {title}
      </div>
    </div>
  );

  const renderTabButton = (tab: 'general' | 'weekly' | 'monthly', label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '8px 16px',
        backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
        color: activeTab === tab ? 'white' : '#64748b',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      {label}
    </button>
  );

  const renderGeneralTab = () => {
    if (!stats) return null;

    return (
      <div>
        {/* Team Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}>
          {renderStatCard('Total Hours', stats.totalHours, '⏰', '#3b82f6')}
          {renderStatCard('Total Tasks', stats.totalTasks, '📋', '#10b981')}
          {renderStatCard('Projects Worked', stats.totalProjects, '📁', '#f59e0b')}
          {renderStatCard('Clients Served', stats.totalClients, '🏢', '#8b5cf6')}
          {renderStatCard('Categories Covered', stats.totalCategories, '📂', '#ef4444')}
          {renderStatCard('Skills Used', stats.totalSkills, '🛠️', '#06b6d4')}
        </div>

        {/* Team Summary */}
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3b82f6',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📊</span>
            Team Performance Summary
          </h4>
          <div style={{ color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <strong>{stats.teamName}</strong> has <strong>{stats.memberCount} members</strong> from{' '}
            <strong>{new Set(stats.members.map(m => m.team)).size} different teams</strong>:{' '}
            {(() => {
              const teamCounts = stats.members.reduce((acc, member) => {
                acc[member.team] = (acc[member.team] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return Object.entries(teamCounts)
                .map(([teamName, count]) => `${count} from ${teamName}`)
                .join(', ');
            })()}.{' '}
            The team has completed <strong>{stats.totalTasks} tasks</strong> across{' '}
            <strong>{stats.totalProjects} projects</strong>, accumulating a total of{' '}
            <strong>{stats.totalHours} hours</strong>. They have served{' '}
            <strong>{stats.totalClients} different clients</strong> across{' '}
            <strong>{stats.totalCategories} categories</strong> utilizing{' '}
            <strong>{stats.totalSkills} different skills</strong>.
          </div>
        </div>

        {/* Team Members List */}
        <div style={{
          marginTop: '24px',
          backgroundColor: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Team Members ({stats.memberCount})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '8px',
          }}>
            {stats.members.map((member, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: '500' }}>{member.employeeName}</span>
                <span style={{ color: '#64748b' }}>{member.totalTasks}t, {member.totalHours}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyTab = () => {
    if (!stats || !stats.weeklyBreakdown.length) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>📅</span>
          No weekly data available
        </div>
      );
    }

    return (
      <div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {stats.weeklyBreakdown.map((week, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                }}>
                  Week {week.weekNumber}, {week.year} ({week.weekStart} - {week.weekEnd})
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {week.totalTasks} tasks • {week.totalHours} hours
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                fontSize: '0.75rem',
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Projects: </span>
                  <span style={{ color: '#64748b' }}>{week.projects.length}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Clients: </span>
                  <span style={{ color: '#64748b' }}>{week.clients.length}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Categories: </span>
                  <span style={{ color: '#64748b' }}>{week.categories.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlyTab = () => {
    if (!stats || !stats.monthlyBreakdown.length) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }}>🗓️</span>
          No monthly data available
        </div>
      );
    }

    return (
      <div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {stats.monthlyBreakdown.map((month, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                }}>
                  {month.monthName} {month.year}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {month.totalTasks} tasks • {month.totalHours} hours
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                fontSize: '0.875rem',
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Projects: </span>
                  <span style={{ color: '#64748b' }}>{month.projects.length}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Clients: </span>
                  <span style={{ color: '#64748b' }}>{month.clients.length}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Categories: </span>
                  <span style={{ color: '#64748b' }}>{month.categories.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
            }}>
              {teamName} Team Details
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.875rem',
              color: '#64748b',
            }}>
              {filteredMembers.length} of {teamMembers.length} members • Performance overview and statistics
            </p>
          </div>

          {/* Team Filter Dropdown */}
          {structuralTeams.length > 1 && (
            <div style={{ marginRight: '16px' }}>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  color: '#374151',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Teams</option>
                {structuralTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            {renderTabButton('general', 'General', '📊')}
            {renderTabButton('weekly', 'Weekly', '📅')}
            {renderTabButton('monthly', 'Monthly', '🗓️')}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: '60vh',
          overflowY: 'auto',
          backgroundColor: '#fafbfc',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              color: '#64748b',
            }}>
              <div style={{
                border: '3px solid #f1f5f9',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                animation: 'spin 1s linear infinite',
                marginRight: '12px',
              }} />
              Loading team statistics...
            </div>
          ) : (
            <>
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'weekly' && renderWeeklyTab()}
              {activeTab === 'monthly' && renderMonthlyTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsModal;