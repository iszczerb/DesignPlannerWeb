import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Tabs, Tab, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { EmployeeScheduleDto } from '../../types/schedule';
import { teamMemberStatsService, TeamMemberStats, WeeklyStats, MonthlyStats } from '../../services/teamMemberStatsService';
import { ModalHeader, StandardButton } from '../common/modal';
import RefreshIcon from '@mui/icons-material/Refresh';

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
    // console.log('📊 TeamMemberDetailsModal - useEffect triggered:', { isOpen, employee: employee?.employeeName });
    if (isOpen && employee) {
      // console.log('🚀 Loading stats for employee:', employee.employeeName);
      loadStats();
    }
  }, [isOpen, employee]);

  const loadStats = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      setError(null);
      // console.log('📊 Loading stats for employee:', employee.employeeName);

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

  // console.log('🔍 TeamMemberDetailsModal render - isOpen:', isOpen, 'employee:', employee?.employeeName);

  if (!isOpen || !employee) {
    // console.log('❌ TeamMemberDetailsModal - Not rendering (isOpen:', isOpen, 'employee:', employee?.employeeName, ')');
    return null;
  }

  // console.log('✅ TeamMemberDetailsModal - Rendering modal for:', employee.employeeName);


  const renderStatCard = (title: string, value: string | number, icon: string, tokenColor: string) => (
    <Box
      sx={{
        backgroundColor: 'var(--dp-neutral-0)',
        padding: 'var(--dp-space-3) var(--dp-space-4)',
        borderRadius: 'var(--dp-radius-lg)',
        border: `1px solid var(${tokenColor}-100)`,
        borderLeft: `3px solid var(${tokenColor}-500)`,
        boxShadow: 'var(--dp-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--dp-space-3)',
      }}
    >
      <Box
        sx={{
          fontSize: 'var(--dp-text-title-medium)',
          backgroundColor: `var(${tokenColor}-50)`,
          padding: 'var(--dp-space-2)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            fontSize: 'var(--dp-text-label-small)',
            color: 'var(--dp-neutral-600)',
            fontWeight: 'var(--dp-font-weight-medium)',
            marginBottom: 'var(--dp-space-0-5)',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'var(--dp-font-family-primary)',
            fontSize: 'var(--dp-text-title-medium)',
            fontWeight: 'var(--dp-font-weight-bold)',
            color: 'var(--dp-neutral-900)',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  const renderGeneralTab = () => {
    if (!stats) return null;

    return (
      <Box sx={{ padding: 'var(--dp-space-5)' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--dp-space-4)',
            marginBottom: 'var(--dp-space-6)',
          }}
        >
          {renderStatCard('Total Hours', stats.totalHours, '⏰', '--dp-primary')}
          {renderStatCard('Total Tasks', stats.totalTasks, '📋', '--dp-success')}
          {renderStatCard('Projects Worked', stats.totalProjects, '📁', '--dp-warning')}
          {renderStatCard('Clients Served', stats.totalClients, '🏢', '--dp-info')}
          {renderStatCard('Categories Covered', stats.totalCategories, '📂', '--dp-error')}
          {renderStatCard('Skills Used', stats.totalSkills, '🛠️', '--dp-primary')}
        </Box>

        {/* Quick Summary */}
        <Box
          sx={{
            backgroundColor: 'var(--dp-warning-50)',
            padding: 'var(--dp-space-5)',
            borderRadius: 'var(--dp-radius-xl)',
            border: '1px solid var(--dp-warning-300)',
          }}
        >
          <Typography
            sx={{
              margin: '0 0 var(--dp-space-3) 0',
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-large)',
              fontWeight: 'var(--dp-font-weight-semibold)',
              color: 'var(--dp-neutral-900)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dp-space-2)',
            }}
          >
            <span>💡</span>
            Performance Summary
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              color: 'var(--dp-neutral-900)',
              fontSize: 'var(--dp-text-body-medium)',
              lineHeight: 'var(--dp-line-height-relaxed)',
            }}
          >
            {stats.employeeName} has worked on <strong>{stats.totalTasks} tasks</strong> across{' '}
            <strong>{stats.totalProjects} projects</strong>, accumulating a total of{' '}
            <strong>{stats.totalHours} hours</strong>. They have contributed to projects for{' '}
            <strong>{stats.totalClients} different clients</strong> spanning{' '}
            <strong>{stats.totalCategories} categories</strong> and utilizing{' '}
            <strong>{stats.totalSkills} different skills</strong>.
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderWeeklyTab = () => {
    if (!stats || !stats.weeklyBreakdown.length) {
      return (
        <Box
          sx={{
            padding: 'var(--dp-space-10)',
            textAlign: 'center',
            color: 'var(--dp-neutral-500)',
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: 'var(--dp-text-display-small)',
              marginBottom: 'var(--dp-space-4)',
              display: 'block',
            }}
          >
            📅
          </Box>
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              color: 'var(--dp-neutral-500)',
            }}
          >
            No weekly data available
          </Typography>
        </Box>
      );
    }

    // Show only the current week (most recent week)
    const currentWeek = stats.weeklyBreakdown[0];

    return (
      <Box sx={{ padding: 'var(--dp-space-6)' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dp-space-4)',
          }}
        >
          {[currentWeek].map((week, index) => (
            <Box
              key={`${week.year}-W${week.weekNumber}`}
              sx={{
                backgroundColor: 'var(--dp-neutral-0)',
                border: '1px solid var(--dp-neutral-200)',
                borderRadius: 'var(--dp-radius-lg)',
                padding: 'var(--dp-space-5)',
                boxShadow: 'var(--dp-shadow-sm)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--dp-space-4)',
                  paddingBottom: 'var(--dp-space-3)',
                  borderBottom: '1px solid var(--dp-neutral-100)',
                }}
              >
                <Box>
                  <Typography
                    component="h4"
                    sx={{
                      margin: 0,
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-large)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    Week {week.weekNumber}, {week.year}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-500)',
                      marginTop: 'var(--dp-space-0-5)',
                    }}
                  >
                    {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 'var(--dp-space-3)',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-title-medium)',
                        fontWeight: 'var(--dp-font-weight-bold)',
                        color: 'var(--dp-primary-500)',
                      }}
                    >
                      {week.totalHours}h
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-label-small)',
                        color: 'var(--dp-neutral-500)',
                      }}
                    >
                      Hours
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-title-medium)',
                        fontWeight: 'var(--dp-font-weight-bold)',
                        color: 'var(--dp-success-500)',
                      }}
                    >
                      {week.totalTasks}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-label-small)',
                        color: 'var(--dp-neutral-500)',
                      }}
                    >
                      Tasks
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--dp-space-3)',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-label-small)',
                      color: 'var(--dp-neutral-500)',
                      marginBottom: 'var(--dp-space-1)',
                    }}
                  >
                    Projects ({week.projects.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {week.projects.slice(0, 2).join(', ')}
                    {week.projects.length > 2 && ` +${week.projects.length - 2} more`}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-label-small)',
                      color: 'var(--dp-neutral-500)',
                      marginBottom: 'var(--dp-space-1)',
                    }}
                  >
                    Clients ({week.clients.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {week.clients.slice(0, 2).join(', ')}
                    {week.clients.length > 2 && ` +${week.clients.length - 2} more`}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-label-small)',
                      color: 'var(--dp-neutral-500)',
                      marginBottom: 'var(--dp-space-1)',
                    }}
                  >
                    Categories ({week.categories.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {week.categories.slice(0, 2).join(', ')}
                    {week.categories.length > 2 && ` +${week.categories.length - 2} more`}
                  </Typography>
                </Box>
              </Box>

              {/* Daily breakdown */}
              <Box
                sx={{
                  marginTop: 'var(--dp-space-4)',
                  paddingTop: 'var(--dp-space-3)',
                  borderTop: '1px solid var(--dp-neutral-100)',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-label-small)',
                    color: 'var(--dp-neutral-500)',
                    marginBottom: 'var(--dp-space-2)',
                    fontWeight: 'var(--dp-font-weight-semibold)',
                  }}
                >
                  Daily Breakdown
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 'var(--dp-space-2)',
                    flexWrap: 'wrap',
                  }}
                >
                  {week.dailyBreakdown.map(day => (
                    <Box
                      key={day.date}
                      sx={{
                        padding: 'var(--dp-space-1-5) var(--dp-space-2-5)',
                        backgroundColor: day.tasks > 0 ? 'var(--dp-primary-100)' : 'var(--dp-neutral-50)',
                        borderRadius: 'var(--dp-radius-md)',
                        fontSize: 'var(--dp-text-label-small)',
                        color: day.tasks > 0 ? 'var(--dp-primary-700)' : 'var(--dp-neutral-500)',
                        fontWeight: day.tasks > 0 ? 'var(--dp-font-weight-semibold)' : 'var(--dp-font-weight-regular)',
                        fontFamily: 'var(--dp-font-family-primary)',
                      }}
                    >
                      {day.dayOfWeek.slice(0, 3)}: {day.tasks}t, {day.hours}h
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderMonthlyTab = () => {
    if (!stats || !stats.monthlyBreakdown.length) {
      return (
        <Box
          sx={{
            padding: 'var(--dp-space-10)',
            textAlign: 'center',
            color: 'var(--dp-neutral-500)',
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: 'var(--dp-text-display-small)',
              marginBottom: 'var(--dp-space-4)',
              display: 'block',
            }}
          >
            🗓️
          </Box>
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              color: 'var(--dp-neutral-500)',
            }}
          >
            No monthly data available
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ padding: 'var(--dp-space-6)' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dp-space-5)',
          }}
        >
          {stats.monthlyBreakdown.map((month, index) => (
            <Box
              key={`${month.year}-${month.month}`}
              sx={{
                backgroundColor: 'var(--dp-neutral-0)',
                border: '1px solid var(--dp-neutral-200)',
                borderRadius: 'var(--dp-radius-lg)',
                padding: 'var(--dp-space-6)',
                boxShadow: 'var(--dp-shadow-md)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--dp-space-5)',
                  paddingBottom: 'var(--dp-space-4)',
                  borderBottom: '2px solid var(--dp-neutral-100)',
                }}
              >
                <Box>
                  <Typography
                    component="h4"
                    sx={{
                      margin: 0,
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-title-medium)',
                      fontWeight: 'var(--dp-font-weight-bold)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {month.monthName} {month.year}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-500)',
                      marginTop: 'var(--dp-space-1)',
                    }}
                  >
                    {month.weeklyBreakdown.length} weeks of activity
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 'var(--dp-space-5)',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-title-large)',
                        fontWeight: 'var(--dp-font-weight-bold)',
                        color: 'var(--dp-primary-500)',
                      }}
                    >
                      {month.totalHours}h
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-label-small)',
                        color: 'var(--dp-neutral-500)',
                      }}
                    >
                      Total Hours
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-title-large)',
                        fontWeight: 'var(--dp-font-weight-bold)',
                        color: 'var(--dp-success-500)',
                      }}
                    >
                      {month.totalTasks}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--dp-font-family-primary)',
                        fontSize: 'var(--dp-text-label-small)',
                        color: 'var(--dp-neutral-500)',
                      }}
                    >
                      Total Tasks
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Monthly summary */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--dp-space-4)',
                  marginBottom: 'var(--dp-space-5)',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: 'var(--dp-warning-50)',
                    padding: 'var(--dp-space-4)',
                    borderRadius: 'var(--dp-radius-md)',
                    border: '1px solid var(--dp-warning-300)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                      marginBottom: 'var(--dp-space-2)',
                    }}
                  >
                    📁 Projects ({month.projects.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {month.projects.slice(0, 3).join(', ')}
                    {month.projects.length > 3 && ` +${month.projects.length - 3} more`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'var(--dp-info-50)',
                    padding: 'var(--dp-space-4)',
                    borderRadius: 'var(--dp-radius-md)',
                    border: '1px solid var(--dp-info-400)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                      marginBottom: 'var(--dp-space-2)',
                    }}
                  >
                    🏢 Clients ({month.clients.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {month.clients.slice(0, 3).join(', ')}
                    {month.clients.length > 3 && ` +${month.clients.length - 3} more`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'var(--dp-error-50)',
                    padding: 'var(--dp-space-4)',
                    borderRadius: 'var(--dp-radius-md)',
                    border: '1px solid var(--dp-error-300)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-900)',
                      marginBottom: 'var(--dp-space-2)',
                    }}
                  >
                    📂 Categories ({month.categories.length})
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-small)',
                      color: 'var(--dp-neutral-900)',
                    }}
                  >
                    {month.categories.slice(0, 3).join(', ')}
                    {month.categories.length > 3 && ` +${month.categories.length - 3} more`}
                  </Typography>
                </Box>
              </Box>

              {/* Weekly breakdown for the month */}
              <Box
                sx={{
                  paddingTop: 'var(--dp-space-4)',
                  borderTop: '1px solid var(--dp-neutral-100)',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-body-small)',
                    color: 'var(--dp-neutral-500)',
                    marginBottom: 'var(--dp-space-3)',
                    fontWeight: 'var(--dp-font-weight-semibold)',
                  }}
                >
                  Weekly Activity
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 'var(--dp-space-2)',
                  }}
                >
                  {month.weeklyBreakdown.map(week => (
                    <Box
                      key={`${week.year}-W${week.weekNumber}`}
                      sx={{
                        padding: 'var(--dp-space-2) var(--dp-space-3)',
                        backgroundColor: week.totalTasks > 0 ? 'var(--dp-primary-50)' : 'var(--dp-neutral-50)',
                        borderRadius: 'var(--dp-radius-md)',
                        fontSize: 'var(--dp-text-label-small)',
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: week.totalTasks > 0 ? 'var(--dp-primary-500)' : 'var(--dp-neutral-200)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          fontWeight: 'var(--dp-font-weight-semibold)',
                          color: week.totalTasks > 0 ? 'var(--dp-primary-500)' : 'var(--dp-neutral-500)',
                          marginBottom: 'var(--dp-space-0-5)',
                          fontSize: 'var(--dp-text-label-small)',
                        }}
                      >
                        Week {week.weekNumber}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'var(--dp-font-family-primary)',
                          color: 'var(--dp-neutral-500)',
                          fontSize: 'var(--dp-text-label-small)',
                        }}
                      >
                        {week.totalTasks}t, {week.totalHours}h
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            flexDirection: 'column',
            gap: 'var(--dp-space-4)',
          }}
        >
          <CircularProgress sx={{ color: 'var(--dp-primary-500)' }} />
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              color: 'var(--dp-neutral-600)',
            }}
          >
            Loading member statistics...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            flexDirection: 'column',
            gap: 'var(--dp-space-4)',
          }}
        >
          <Alert severity="error" sx={{ fontFamily: 'var(--dp-font-family-primary)' }}>
            <Typography
              sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-semibold)',
                marginBottom: 'var(--dp-space-2)',
              }}
            >
              Failed to Load Statistics
            </Typography>
            <Typography sx={{ fontFamily: 'var(--dp-font-family-primary)', fontSize: 'var(--dp-text-body-small)' }}>
              {error}
            </Typography>
          </Alert>
          <StandardButton variant="contained" colorScheme="primary" leftIcon={<RefreshIcon />} onClick={loadStats}>
            Try Again
          </StandardButton>
        </Box>
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
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--dp-neutral-0)',
          borderRadius: 'var(--dp-radius-xl)',
          boxShadow: 'var(--dp-shadow-2xl)',
          maxWidth: '900px',
        },
      }}
    >
      <ModalHeader
        title={
          employee.firstName && employee.lastName
            ? `${employee.firstName} ${employee.lastName}`
            : employee.employeeName
        }
        subtitle={`${employee.role} • ${employee.team}`}
        onClose={handleClose}
        variant="primary"
      />

      {/* Tabs */}
      <Box
        sx={{
          padding: 'var(--dp-space-4) var(--dp-space-6) 0',
          backgroundColor: 'var(--dp-neutral-50)',
          borderBottom: '1px solid var(--dp-neutral-200)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            minHeight: '44px',
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--dp-primary-500)',
              height: '3px',
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-medium)',
              fontWeight: 'var(--dp-font-weight-medium)',
              color: 'var(--dp-neutral-600)',
              textTransform: 'none',
              minHeight: '44px',
              padding: 'var(--dp-space-2) var(--dp-space-4)',
              '&.Mui-selected': {
                color: 'var(--dp-primary-600)',
                fontWeight: 'var(--dp-font-weight-semibold)',
              },
              '&:hover': {
                color: 'var(--dp-primary-500)',
                backgroundColor: 'var(--dp-primary-50)',
              },
            },
          }}
        >
          <Tab label="📊 General" value="general" />
          <Tab label="📅 Weekly" value="weekly" />
          <Tab label="🗓️ Monthly" value="monthly" />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          backgroundColor: 'var(--dp-neutral-50)',
          padding: 0,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDetailsModal;