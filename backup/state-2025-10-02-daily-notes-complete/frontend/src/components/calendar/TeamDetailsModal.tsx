import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Tabs, Tab, Box, Typography, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';
import { TeamStats, teamStatsService } from '../../services/teamStatsService';
import { EmployeeCalendarDto } from '../../types/schedule';
import { ModalHeader } from '../common/modal';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  teamMembers: EmployeeCalendarDto[];
}

type TabType = 'general' | 'weekly' | 'monthly';

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamMembers
}) => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
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

  const handleClose = () => {
    setActiveTab('general');
    setStats(null);
    setTeamFilter('all');
    onClose();
  };

  if (!isOpen) return null;

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
        minWidth: '160px',
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
      <Box sx={{ padding: 'var(--dp-space-6)' }}>
        {/* Team Overview */}
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

        {/* Team Summary */}
        <Box
          sx={{
            backgroundColor: 'var(--dp-primary-50)',
            padding: 'var(--dp-space-5)',
            borderRadius: 'var(--dp-radius-xl)',
            border: '1px solid var(--dp-primary-300)',
          }}
        >
          <Typography
            component="h4"
            sx={{
              margin: '0 0 var(--dp-space-3) 0',
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-body-large)',
              fontWeight: 'var(--dp-font-weight-semibold)',
              color: 'var(--dp-primary-900)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--dp-space-2)',
            }}
          >
            <span>📊</span>
            Team Performance Summary
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              color: 'var(--dp-primary-900)',
              fontSize: 'var(--dp-text-body-medium)',
              lineHeight: 'var(--dp-line-height-relaxed)',
            }}
          >
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
          </Typography>
        </Box>

        {/* Team Members List */}
        <Box
          sx={{
            marginTop: 'var(--dp-space-6)',
            backgroundColor: 'var(--dp-neutral-50)',
            padding: 'var(--dp-space-4)',
            borderRadius: 'var(--dp-radius-lg)',
          }}
        >
          <Typography
            component="h4"
            sx={{
              margin: '0 0 var(--dp-space-3) 0',
              fontFamily: 'var(--dp-font-family-primary)',
              fontSize: 'var(--dp-text-label-small)',
              fontWeight: 'var(--dp-font-weight-semibold)',
              color: 'var(--dp-neutral-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Team Members ({stats.memberCount})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--dp-space-2)',
            }}
          >
            {stats.members.map((member, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: 'var(--dp-neutral-0)',
                  padding: 'var(--dp-space-2) var(--dp-space-3)',
                  borderRadius: 'var(--dp-radius-md)',
                  fontSize: 'var(--dp-text-label-small)',
                  fontFamily: 'var(--dp-font-family-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--dp-neutral-200)',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                    fontSize: 'var(--dp-text-label-small)',
                    color: 'var(--dp-neutral-900)',
                  }}
                >
                  {member.employeeName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-label-small)',
                    color: 'var(--dp-neutral-600)',
                  }}
                >
                  {member.totalTasks}t, {member.totalHours}h
                </Typography>
              </Box>
            ))}
          </Box>
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

    return (
      <Box sx={{ padding: 'var(--dp-space-6)' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dp-space-4)',
          }}
        >
          {stats.weeklyBreakdown.map((week, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: 'var(--dp-neutral-0)',
                padding: 'var(--dp-space-4)',
                borderRadius: 'var(--dp-radius-lg)',
                border: '1px solid var(--dp-neutral-200)',
                boxShadow: 'var(--dp-shadow-sm)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--dp-space-3)',
                }}
              >
                <Typography
                  component="h4"
                  sx={{
                    margin: 0,
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-body-medium)',
                    fontWeight: 'var(--dp-font-weight-semibold)',
                    color: 'var(--dp-neutral-900)',
                  }}
                >
                  Week {week.weekNumber}, {week.year} ({week.weekStart} - {week.weekEnd})
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-label-small)',
                    color: 'var(--dp-neutral-600)',
                  }}
                >
                  {week.totalTasks} tasks • {week.totalHours} hours
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 'var(--dp-space-2)',
                  fontSize: 'var(--dp-text-label-small)',
                }}
              >
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    Projects:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    {week.projects.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    Clients:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    {week.clients.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    Categories:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-label-small)',
                    }}
                  >
                    {week.categories.length}
                  </Typography>
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
            gap: 'var(--dp-space-4)',
          }}
        >
          {stats.monthlyBreakdown.map((month, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: 'var(--dp-neutral-0)',
                padding: 'var(--dp-space-5)',
                borderRadius: 'var(--dp-radius-lg)',
                border: '1px solid var(--dp-neutral-200)',
                boxShadow: 'var(--dp-shadow-sm)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--dp-space-4)',
                }}
              >
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
                  {month.monthName} {month.year}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontSize: 'var(--dp-text-body-small)',
                    color: 'var(--dp-neutral-600)',
                  }}
                >
                  {month.totalTasks} tasks • {month.totalHours} hours
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--dp-space-3)',
                  fontSize: 'var(--dp-text-body-small)',
                }}
              >
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    Projects:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    {month.projects.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    Clients:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    {month.clients.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontWeight: 'var(--dp-font-weight-semibold)',
                      color: 'var(--dp-neutral-700)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    Categories:{' '}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-600)',
                      fontSize: 'var(--dp-text-body-small)',
                    }}
                  >
                    {month.categories.length}
                  </Typography>
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
            Loading team statistics...
          </Typography>
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
        title={`${teamName} Team Details`}
        subtitle={`${filteredMembers.length} of ${teamMembers.length} members • Performance overview and statistics`}
        onClose={handleClose}
        variant="primary"
        actions={
          structuralTeams.length > 1 ? (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-body-small)',
                  color: 'var(--dp-neutral-900)',
                  backgroundColor: 'var(--dp-neutral-0)',
                  borderRadius: 'var(--dp-radius-md)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--dp-neutral-300)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--dp-primary-500)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--dp-primary-500)',
                  },
                  '& .MuiSelect-icon': {
                    color: 'var(--dp-neutral-600)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'var(--dp-neutral-0)',
                      borderRadius: 'var(--dp-radius-md)',
                      boxShadow: 'var(--dp-shadow-lg)',
                      marginTop: 'var(--dp-space-1)',
                    }
                  }
                }}
              >
                <MenuItem
                  value="all"
                  sx={{
                    fontFamily: 'var(--dp-font-family-primary)',
                    color: 'var(--dp-neutral-900)',
                    fontSize: 'var(--dp-text-body-small)',
                    '&:hover': {
                      backgroundColor: 'var(--dp-neutral-100)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'var(--dp-primary-50)',
                      color: 'var(--dp-primary-700)',
                      '&:hover': {
                        backgroundColor: 'var(--dp-primary-100)',
                      },
                    },
                  }}
                >
                  All Teams
                </MenuItem>
                {structuralTeams.map(team => (
                  <MenuItem
                    key={team}
                    value={team}
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      color: 'var(--dp-neutral-900)',
                      fontSize: 'var(--dp-text-body-small)',
                      '&:hover': {
                        backgroundColor: 'var(--dp-neutral-100)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'var(--dp-primary-50)',
                        color: 'var(--dp-primary-700)',
                        '&:hover': {
                          backgroundColor: 'var(--dp-primary-100)',
                        },
                      },
                    }}
                  >
                    {team}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : undefined
        }
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

export default TeamDetailsModal;
