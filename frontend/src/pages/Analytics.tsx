import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Schedule,
  Assignment,
  People,
} from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';
import {
  analyticsService,
  AnalyticsFilterDto,
  AnalyticsSummaryDto,
  ProjectHoursDto,
  TaskTypeAnalyticsDto,
  ClientDistributionDto,
  TeamPerformanceDto,
  EmployeeAnalyticsDto,
  CategoryDistributionDto,
} from '../services/analyticsService';
import { UserRole } from '../types/auth';
import Navbar from '../components/layout/Navbar';

// Chart imports (we'll add these when we implement the charts)
import ProjectHoursChart from '../components/analytics/ProjectHoursChart';
import CategoryDistributionChart from '../components/analytics/CategoryDistributionChart';
import TaskTypeChart from '../components/analytics/TaskTypeChart';
import ClientDistributionChart from '../components/analytics/ClientDistributionChart';

type ViewType = 'Day' | 'Week' | 'Month' | 'Year';

const Analytics: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // State management
  const [viewType, setViewType] = useState<ViewType>('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Data state
  const [summary, setSummary] = useState<AnalyticsSummaryDto | null>(null);
  const [projectHours, setProjectHours] = useState<ProjectHoursDto[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskTypeAnalyticsDto[]>([]);
  const [clientDistribution, setClientDistribution] = useState<ClientDistributionDto[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceDto[]>([]);
  const [employeeAnalytics, setEmployeeAnalytics] = useState<EmployeeAnalyticsDto[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionDto[]>([]);

  const [loading, setLoading] = useState(false);

  // Calculate date range based on viewType and currentDate
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewType) {
      case 'Day':
        // Same day
        break;
      case 'Week':
        start.setDate(start.getDate() - start.getDay()); // Start of week
        end.setDate(start.getDate() + 6); // End of week
        break;
      case 'Month':
        start.setDate(1); // Start of month
        end.setMonth(end.getMonth() + 1, 0); // End of month
        break;
      case 'Year':
        start.setMonth(0, 1); // Start of year
        end.setMonth(11, 31); // End of year
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('📊 Fetching analytics data for:', { startDate, endDate, viewType, currentDate });
      const filter: AnalyticsFilterDto = {
        startDate,
        endDate,
        teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId || undefined,
        viewType,
      };

      const [
        summaryData,
        projectHoursData,
        taskTypeData,
        clientDistData,
        teamPerfData,
        employeeData,
        categoryData,
      ] = await Promise.all([
        analyticsService.getAnalyticsSummary(filter),
        analyticsService.getProjectHours(filter),
        analyticsService.getTaskTypeAnalytics(filter),
        analyticsService.getClientDistribution(filter),
        analyticsService.getTeamPerformance(filter),
        analyticsService.getEmployeeAnalytics(filter),
        analyticsService.getCategoryDistribution(filter),
      ]);

      setSummary(summaryData);
      setProjectHours(projectHoursData);
      setTaskTypes(taskTypeData);
      setClientDistribution(clientDistData);
      setTeamPerformance(teamPerfData);
      setEmployeeAnalytics(employeeData);
      setCategoryDistribution(categoryData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [viewType, currentDate, selectedTeamIds, selectedClientId, selectedProjectId]);

  // Navigation handlers
  const navigateDate = (direction: 'prev' | 'next') => {
    console.log('🔄 Navigation clicked:', direction, 'Current date:', currentDate, 'View type:', viewType);
    const newDate = new Date(currentDate);

    switch (viewType) {
      case 'Day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'Week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'Month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'Year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    console.log('🔄 New date will be:', newDate);
    setCurrentDate(newDate);
  };

  const resetToCurrentPeriod = () => {
    setCurrentDate(new Date());
  };

  // Format display date
  const getDisplayDate = () => {
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);

    switch (viewType) {
      case 'Day':
        return start.toLocaleDateString();
      case 'Week':
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      case 'Month':
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'Year':
        return start.getFullYear().toString();
      default:
        return start.toLocaleDateString();
    }
  };

  // Filter handlers
  const handleProjectClick = (projectId: number) => {
    setSelectedProjectId(selectedProjectId === projectId ? null : projectId);
  };

  const handleTeamMemberClick = (employeeId: number) => {
    // Find the team of this employee and toggle team selection
    const employee = employeeAnalytics.find(e => e.employeeId === employeeId);
    if (employee) {
      const teamMember = teamPerformance.find(t => t.teamName === employee.teamName);
      if (teamMember) {
        const teamId = teamMember.teamId;
        setSelectedTeamIds(prev =>
          prev.includes(teamId)
            ? prev.filter(id => id !== teamId)
            : [...prev, teamId]
        );
      }
    }
  };

  const handleClientClick = (clientId: number) => {
    setSelectedClientId(selectedClientId === clientId ? null : clientId);
  };

  const categories = ['Structural', 'Non-Structural', 'Manifold', 'Miscellaneous'];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      <Navbar />

      <Container maxWidth={false} sx={{ px: 3, py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="text"
                onClick={resetToCurrentPeriod}
                sx={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'none' }}
              >
                DesignPlanner
              </Button>
              <Typography variant="h5" sx={{ color: '#666' }}>
                Analytics Dashboard - DesignPlanner
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Tate
            </Typography>
          </Box>

          {/* Timeline Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ButtonGroup variant="contained" size="small">
              {(['Day', 'Week', 'Month', 'Year'] as ViewType[]).map((type) => (
                <Button
                  key={type}
                  variant={viewType === type ? 'contained' : 'outlined'}
                  onClick={() => setViewType(type)}
                  sx={{
                    bgcolor: viewType === type ? '#3b82f6' : 'transparent',
                    color: viewType === type ? 'white' : '#3b82f6',
                    borderColor: '#3b82f6',
                  }}
                >
                  {type}ly
                </Button>
              ))}
            </ButtonGroup>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigateDate('prev')} size="small">
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {getDisplayDate()}
              </Typography>
              <IconButton onClick={() => navigateDate('next')} size="small">
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Main Layout */}
        <Grid container spacing={3}>
          {/* LEFT SIDEBAR - Projects */}
          <Grid item xs={12} md={2.5}>
            <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ bgcolor: '#3b82f6', color: 'white', p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  PROJECTS
                </Typography>
              </Box>
              <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                <List>
                  {projectHours.map((project, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        selected={selectedProjectId === index}
                        onClick={() => handleProjectClick(index)}
                        sx={{
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: '#e3f2fd',
                          },
                        }}
                      >
                        <ListItemText
                          primary={project.projectCode}
                          secondary={`${project.hours.toFixed(1)}h`}
                          primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* CENTER - Summary Cards and Charts */}
          <Grid item xs={12} md={7}>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUp sx={{ fontSize: 40, color: '#3b82f6', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                      {summary?.totalProjects || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Schedule sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                      {summary?.totalHours.toFixed(1) || '0.0'}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Assignment sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
                      {summary?.totalTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <People sx={{ fontSize: 40, color: '#8b5cf6', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                      {summary?.activeEmployees || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Employees
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <ProjectHoursChart data={projectHours} />
              </Grid>
              <Grid item xs={6}>
                <CategoryDistributionChart data={categoryDistribution} />
              </Grid>
              <Grid item xs={6}>
                <TaskTypeChart data={taskTypes} />
              </Grid>
              <Grid item xs={6}>
                <ClientDistributionChart data={clientDistribution} />
              </Grid>
            </Grid>
          </Grid>

          {/* RIGHT SIDEBAR - Team and Clients */}
          <Grid item xs={12} md={2.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 200px)' }}>
              {/* Team Card */}
              <Card sx={{ flex: 1 }}>
                <Box sx={{ bgcolor: '#3b82f6', color: 'white', p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    TEAM
                  </Typography>
                </Box>
                <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                  <List>
                    {employeeAnalytics.map((employee, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleTeamMemberClick(employee.employeeId)}
                          sx={{ py: 1 }}
                        >
                          <ListItemText
                            primary={employee.employeeName}
                            secondary={`${employee.totalHours.toFixed(1)}h`}
                            primaryTypographyProps={{ fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: '#3b82f6', fontWeight: 'bold' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* Clients Card */}
              <Card sx={{ flex: 1 }}>
                <Box sx={{ bgcolor: '#3b82f6', color: 'white', p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    CLIENTS
                  </Typography>
                </Box>
                <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                  <List>
                    {clientDistribution.map((client, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => handleClientClick(index)}
                          sx={{ py: 1 }}
                        >
                          <ListItemText
                            primary={client.clientName}
                            secondary={`${client.hours.toFixed(1)}h`}
                            primaryTypographyProps={{ fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: '#3b82f6', fontWeight: 'bold' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Filters */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Categories:
            </Typography>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => {
                  setSelectedCategories(prev =>
                    prev.includes(category)
                      ? prev.filter(c => c !== category)
                      : [...prev, category]
                  );
                }}
                variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                color="primary"
                size="small"
              />
            ))}

            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value=""
                displayEmpty
                renderValue={() => 'Status'}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on-hold">On Hold</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value=""
                displayEmpty
                renderValue={() => 'Priority'}
              >
                <MenuItem value="">All Priority</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Analytics;