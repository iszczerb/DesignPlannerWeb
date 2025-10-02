import React, { useState, useEffect } from 'react';
import { EmployeeScheduleDto } from '../../types/schedule';
import { teamMemberStatsService, TeamMemberStats, WeeklyStats, MonthlyStats } from '../../services/teamMemberStatsService';

interface TeamMemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeScheduleDto | null;
}

type TabType = 'general' | 'weekly' | 'monthly';

const TeamMemberDetailsModal: React.FC<TeamMemberDetailsModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [stats, setStats] = useState<TeamMemberStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📊 TeamMemberDetailsModal - useEffect triggered:', { isOpen, employee: employee?.employeeName });
    if (isOpen && employee) {
      console.log('🚀 Loading stats for employee:', employee.employeeName);
      loadStats();
    }
  }, [isOpen, employee]);

  const loadStats = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      setError(null);
      console.log('📊 Loading stats for employee:', employee.employeeName);

      const memberStats = await teamMemberStatsService.getTeamMemberStats(employee.employeeId);
      setStats(memberStats);
    } catch (err) {
      console.error('Failed to load member stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab('general');
    setStats(null);
    setError(null);
    onClose();
  };

  console.log('🔍 TeamMemberDetailsModal render - isOpen:', isOpen, 'employee:', employee?.employeeName);

  if (!isOpen || !employee) {
    console.log('❌ TeamMemberDetailsModal - Not rendering (isOpen:', isOpen, 'employee:', employee?.employeeName, ')');
    return null;
  }

  console.log('✅ TeamMemberDetailsModal - Rendering modal for:', employee.employeeName);

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        flex: 1,
        padding: '12px 16px',
        border: 'none',
        backgroundColor: activeTab === tab ? '#3b82f6' : '#f8fafc',
        color: activeTab === tab ? 'white' : '#64748b',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        margin: '0 4px',
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.backgroundColor = '#e2e8f0';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.backgroundColor = '#f8fafc';
        }
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      {label}
    </button>
  );

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <div style={{
      backgroundColor: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${color}20`,
      borderLeft: `3px solid ${color}`,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        fontSize: '1.5rem',
        backgroundColor: `${color}15`,
        padding: '8px',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '0.75rem',
          color: '#64748b',
          fontWeight: '500',
          marginBottom: '2px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1f2937',
        }}>
          {value}
        </div>
      </div>
    </div>
  );

  const renderGeneralTab = () => {
    if (!stats) return null;

    return (
      <div style={{ padding: '20px' }}>

        {/* Overall Statistics */}
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📊</span>
          Overall Statistics
        </h3>

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

        {/* Quick Summary */}
        <div style={{
          backgroundColor: '#fefce8',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #fbbf24',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>💡</span>
            Performance Summary
          </h4>
          <div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: '1.6' }}>
            {stats.employeeName} has worked on <strong>{stats.totalTasks} tasks</strong> across{' '}
            <strong>{stats.totalProjects} projects</strong>, accumulating a total of{' '}
            <strong>{stats.totalHours} hours</strong>. They have contributed to projects for{' '}
            <strong>{stats.totalClients} different clients</strong> spanning{' '}
            <strong>{stats.totalCategories} categories</strong> and utilizing{' '}
            <strong>{stats.totalSkills} different skills</strong>.
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
      <div style={{ padding: '24px' }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📅</span>
          Weekly Breakdown ({stats.weeklyBreakdown.length} weeks)
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '4px',
        }}>
          {stats.weeklyBreakdown.map((week, index) => (
            <div key={`${week.year}-W${week.weekNumber}`} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <div>
                  <h4 style={{
                    margin: '0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}>
                    Week {week.weekNumber}, {week.year}
                  </h4>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginTop: '2px',
                  }}>
                    {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                      {week.totalHours}h
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hours</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                      {week.totalTasks}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tasks</div>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Projects ({week.projects.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                    {week.projects.slice(0, 2).join(', ')}
                    {week.projects.length > 2 && ` +${week.projects.length - 2} more`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Clients ({week.clients.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                    {week.clients.slice(0, 2).join(', ')}
                    {week.clients.length > 2 && ` +${week.clients.length - 2} more`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Categories ({week.categories.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                    {week.categories.slice(0, 2).join(', ')}
                    {week.categories.length > 2 && ` +${week.categories.length - 2} more`}
                  </div>
                </div>
              </div>

              {/* Daily breakdown */}
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #f3f4f6',
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '8px',
                  fontWeight: '600',
                }}>
                  Daily Breakdown
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  {week.dailyBreakdown.map(day => (
                    <div key={day.date} style={{
                      padding: '6px 10px',
                      backgroundColor: day.tasks > 0 ? '#dbeafe' : '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: day.tasks > 0 ? '#1e40af' : '#64748b',
                      fontWeight: day.tasks > 0 ? '600' : '400',
                    }}>
                      {day.dayOfWeek.slice(0, 3)}: {day.tasks}t, {day.hours}h
                    </div>
                  ))}
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
      <div style={{ padding: '24px' }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🗓️</span>
          Monthly Breakdown ({stats.monthlyBreakdown.length} months)
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '4px',
        }}>
          {stats.monthlyBreakdown.map((month, index) => (
            <div key={`${month.year}-${month.month}`} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f3f4f6',
              }}>
                <div>
                  <h4 style={{
                    margin: '0',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}>
                    {month.monthName} {month.year}
                  </h4>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginTop: '4px',
                  }}>
                    {month.weeklyBreakdown.length} weeks of activity
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                      {month.totalHours}h
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Hours</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      {month.totalTasks}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Tasks</div>
                  </div>
                </div>
              </div>

              {/* Monthly summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                    📁 Projects ({month.projects.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    {month.projects.slice(0, 3).join(', ')}
                    {month.projects.length > 3 && ` +${month.projects.length - 3} more`}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#ede9fe',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #8b5cf6',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b46c1', marginBottom: '8px' }}>
                    🏢 Clients ({month.clients.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b46c1' }}>
                    {month.clients.slice(0, 3).join(', ')}
                    {month.clients.length > 3 && ` +${month.clients.length - 3} more`}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#fecaca',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                    📂 Categories ({month.categories.length})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                    {month.categories.slice(0, 3).join(', ')}
                    {month.categories.length > 3 && ` +${month.categories.length - 3} more`}
                  </div>
                </div>
              </div>

              {/* Weekly breakdown for the month */}
              <div style={{
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6',
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '12px',
                  fontWeight: '600',
                }}>
                  Weekly Activity
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '8px',
                }}>
                  {month.weeklyBreakdown.map(week => (
                    <div key={`${week.year}-W${week.weekNumber}`} style={{
                      padding: '8px 12px',
                      backgroundColor: week.totalTasks > 0 ? '#e0f2fe' : '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: week.totalTasks > 0 ? '#0284c7' : '#e2e8f0',
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: week.totalTasks > 0 ? '#0284c7' : '#64748b',
                        marginBottom: '2px',
                      }}>
                        Week {week.weekNumber}
                      </div>
                      <div style={{ color: '#64748b' }}>
                        {week.totalTasks}t, {week.totalHours}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Loading member statistics...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <div style={{ fontSize: '1rem', color: '#dc2626', textAlign: 'center' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Failed to Load Statistics</div>
            <div style={{ fontSize: '0.875rem' }}>{error}</div>
          </div>
          <button
            onClick={loadStats}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'weekly':
        return renderWeeklyTab();
      case 'monthly':
        return renderMonthlyTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div>
                <h2 style={{
                  margin: '0',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '1.75rem' }}>👤</span>
                  {employee.firstName && employee.lastName
                    ? `${employee.firstName} ${employee.lastName}`
                    : employee.employeeName}
                </h2>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginTop: '4px',
                }}>
                  {employee.role} • {employee.team}
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  padding: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '1.25rem',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ✕
              </button>
            </div>

            {/* Tab buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '12px',
            }}>
              {renderTabButton('general', 'General', '📊')}
              {renderTabButton('weekly', 'Weekly', '📅')}
              {renderTabButton('monthly', 'Monthly', '🗓️')}
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#fafbfc',
          }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Add spinning animation styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default TeamMemberDetailsModal;