import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  ChevronLeft,
  ChevronRight,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import {
  VictoryChart,
  VictoryBar,
  VictoryPie,
  VictoryAxis,
  VictoryTooltip,
  VictoryLabel,
  VictoryTheme,
  VictoryContainer
} from 'victory';
import useMeasure from 'react-use-measure';


// Responsive chart container with resize observer
const ResponsiveChartContainer: React.FC<{
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
  minHeight?: number;
  aspectRatio?: number;
}> = ({ children, minHeight = 120, aspectRatio = 2.4 }) => {
  const [ref, bounds] = useMeasure({
    debounce: 100,
    scroll: false
  });

  const width = bounds.width || 300;
  const height = Math.max(minHeight, width / aspectRatio);

  return (
    <Box ref={ref} sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
      {width > 50 && children({ width, height })}
    </Box>
  );
};

import {
  analyticsService,
  AnalyticsFilterDto,
  AnalyticsSummaryDto,
  ProjectHoursDto,
  ClientDistributionDto,
  CategoryDistributionDto,
  TaskTypeAnalyticsDto,
  EmployeeAnalyticsDto
} from '../../services/analyticsService';
import teamService from '../../services/teamService';
import { databaseService } from '../../services/databaseService';
import dayjs from 'dayjs';

interface AnalyticsDashboardModalProps {
  open: boolean;
  onClose: () => void;
}

interface TeamOption {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

type TimelineMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ColorMode = 'default' | 'client' | 'category';

const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  open,
  onClose
}) => {
  // Timeline state
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('YEARLY');
  const [currentPeriod, setCurrentPeriod] = useState(dayjs());

  // Filter state
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [colorMode, setColorMode] = useState<ColorMode>('default');


  // Data state
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummaryDto | null>(null);
  const [projectHours, setProjectHours] = useState<ProjectHoursDto[]>([]);
  const [allProjectHours, setAllProjectHours] = useState<ProjectHoursDto[]>([]); // Cache all projects without category filter
  const [clientDistribution, setClientDistribution] = useState<ClientDistributionDto[]>([]);
  const [allClientDistribution, setAllClientDistribution] = useState<ClientDistributionDto[]>([]); // Cache all clients without category filter
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionDto[]>([]);
  const [taskTypeAnalytics, setTaskTypeAnalytics] = useState<TaskTypeAnalyticsDto[]>([]);
  const [employeeAnalytics, setEmployeeAnalytics] = useState<EmployeeAnalyticsDto[]>([]);
  const [allEmployeeAnalytics, setAllEmployeeAnalytics] = useState<EmployeeAnalyticsDto[]>([]); // Cache all employees without category filter
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Calculate date range based on timeline mode
  const getDateRange = () => {
    const now = currentPeriod;
    let startDate: dayjs.Dayjs;
    let endDate: dayjs.Dayjs;

    switch (timelineMode) {
      case 'DAILY':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'WEEKLY':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'MONTHLY':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'YEARLY':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('year');
        endDate = now.endOf('year');
    }

    return { startDate, endDate };
  };

  // Load initial data
  useEffect(() => {
    if (open) {
      loadTeams();
      loadCategories();
      loadAnalyticsData();
    }
  }, [open, timelineMode, currentPeriod, selectedProjects, selectedTeamMembers, selectedClients, selectedCategories]);

  const loadTeams = async () => {
    try {
      const teamsData = await teamService.getAllTeamsWithManagedStatus();
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await databaseService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const filter: AnalyticsFilterDto = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        // NEVER filter by team members at the backend level - this causes data to disappear!
        // Team member filtering will be done on the frontend only

        // IMPORTANT: DO NOT CONFUSE TEAMS AND CATEGORIES!
        // TEAMS: Employee groups (Structural Team, Non-Structural Team, BIM Team, R&D Team)
        // CATEGORIES: Project types (Structural Category, Non-Structural Category, Manifold, Miscellaneous)
        // They have similar names but are COMPLETELY DIFFERENT entities!
        // teamIds in the filter refers to EMPLOYEE TEAMS, not PROJECT CATEGORIES

        // Use categoryIds for PROJECT CATEGORY filtering
        ...(selectedCategories.length > 0 && {
          categoryIds: selectedCategories // These are PROJECT CATEGORY IDs
        })
      };

      const [
        summaryData,
        projectHoursData,
        clientDistData,
        categoryDistData,
        taskTypeData,
        employeeData
      ] = await Promise.all([
        analyticsService.getAnalyticsSummary(filter),
        analyticsService.getProjectHours(filter),
        analyticsService.getClientDistribution(filter),
        analyticsService.getCategoryDistribution(filter),
        analyticsService.getTaskTypeAnalytics(filter),
        analyticsService.getEmployeeAnalytics(filter)
      ]);

      console.log('🔍 Task Type Analytics Data:', taskTypeData);
      console.log('🔍 Category Distribution Data:', categoryDistData);
      console.log('🔍 Client Distribution Data:', clientDistData);

      setSummary(summaryData);
      setCategoryDistribution(categoryDistData);
      setTaskTypeAnalytics(taskTypeData);

      // CRITICAL: Handle data for category filtering - keep all items visible
      if (selectedCategories.length > 0) {
        // When category filter is active, merge with cached data
        // Backend returns only items with hours in selected categories
        // We need to show ALL items but with 0 hours for those not in the category

        // Merge projects
        const mergedProjects = allProjectHours.map(cached => {
          const filtered = projectHoursData.find(p => p.projectCode === cached.projectCode);
          return filtered || { ...cached, hours: 0, taskCount: 0 };
        });
        setProjectHours(mergedProjects);

        // Merge clients
        const mergedClients = allClientDistribution.map(cached => {
          const filtered = clientDistData.find(c => c.clientCode === cached.clientCode);
          return filtered || { ...cached, hours: 0, taskCount: 0, projectCount: 0 };
        });
        setClientDistribution(mergedClients);

        // Merge employees
        const mergedEmployees = allEmployeeAnalytics.map(cached => {
          const filtered = employeeData.find(e => e.employeeId === cached.employeeId);
          return filtered || { ...cached, totalHours: 0, taskCount: 0 };
        });
        setEmployeeAnalytics(mergedEmployees);
      } else {
        // No category filter - save the full lists and use them
        setProjectHours(projectHoursData);
        setAllProjectHours(projectHoursData); // Cache for later use

        setClientDistribution(clientDistData);
        setAllClientDistribution(clientDistData); // Cache for later use

        setEmployeeAnalytics(employeeData);
        setAllEmployeeAnalytics(employeeData); // Cache for later use
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineChange = (event: React.MouseEvent<HTMLElement>, newMode: TimelineMode) => {
    if (newMode !== null) {
      setTimelineMode(newMode);
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;
    let newPeriod: dayjs.Dayjs;

    switch (timelineMode) {
      case 'DAILY':
        newPeriod = currentPeriod.add(amount, 'day');
        break;
      case 'WEEKLY':
        newPeriod = currentPeriod.add(amount, 'week');
        break;
      case 'MONTHLY':
        newPeriod = currentPeriod.add(amount, 'month');
        break;
      case 'YEARLY':
        newPeriod = currentPeriod.add(amount, 'year');
        break;
      default:
        newPeriod = currentPeriod.add(amount, 'year');
    }

    setCurrentPeriod(newPeriod);
  };

  const goToCurrentPeriod = () => {
    setCurrentPeriod(dayjs());
  };

  const formatPeriodDisplay = () => {
    switch (timelineMode) {
      case 'DAILY':
        return currentPeriod.format('MMMM D, YYYY');
      case 'WEEKLY':
        return `Week of ${currentPeriod.startOf('week').format('MMM D')} - ${currentPeriod.endOf('week').format('MMM D, YYYY')}`;
      case 'MONTHLY':
        return currentPeriod.format('MMMM YYYY');
      case 'YEARLY':
        return currentPeriod.format('YYYY');
      default:
        return currentPeriod.format('YYYY');
    }
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const toggleProjectFilter = (projectCode: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectCode)
        ? prev.filter(p => p !== projectCode)
        : [...prev, projectCode]
    );
  };

  const toggleTeamMemberFilter = (employeeId: number) => {
    setSelectedTeamMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleClientFilter = (clientCode: string) => {
    setSelectedClients(prev =>
      prev.includes(clientCode)
        ? prev.filter(c => c !== clientCode)
        : [...prev, clientCode]
    );
  };

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };



  // Chart data functions with comprehensive filtering
  const getProjectChartData = () => {
    let filtered = [...projectHours];

    // Apply project filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(p => selectedProjects.includes(p.projectCode));
    }

    // Apply client filter
    if (selectedClients.length > 0) {
      filtered = filtered.filter(p => selectedClients.includes(p.clientCode));
    }

    // Apply team member filter - CRITICAL: This must affect project hours!
    if (selectedTeamMembers.length > 0) {
      // Calculate proportion based on selected team members
      const teamProportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);

      filtered = filtered.map(project => ({
        ...project,
        hours: Math.round(project.hours * teamProportion),
        taskCount: Math.round(project.taskCount * teamProportion)
      })).filter(project => project.hours > 0); // Only show projects with hours
    }

    // Apply category filter - CRITICAL: Use actual project category IDs!
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(project => selectedCategories.includes(project.categoryId));
    }

    return filtered.map(project => ({
      ...project,
      fill: colorMode === 'client' ? project.clientColor :
            colorMode === 'category' ? project.categoryColor :
            '#3B82F6'
    }));
  };

  const getFilteredCategoryData = () => {
    let filtered = [...categoryDistribution];

    // Apply category filter - show only selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(c => {
        const category = categories.find(cat => cat.name === c.categoryName);
        return category && selectedCategories.includes(category.id);
      });
    }

    // Apply cross-filters from other filter types
    // Apply team member filter
    if (selectedTeamMembers.length > 0) {
      const teamProportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);
      filtered = filtered.map(c => ({
        ...c,
        hours: Math.round(c.hours * teamProportion),
        taskCount: Math.round(c.taskCount * teamProportion)
      }));
    }

    // Apply project filter - more accurate cross-filtering
    if (selectedProjects.length > 0) {
      const selectedProjectHours = projectHours
        .filter(p => selectedProjects.includes(p.projectCode))
        .reduce((sum, p) => sum + p.hours, 0);
      const totalProjectHours = projectHours.reduce((sum, p) => sum + p.hours, 0);
      const projectProportion = totalProjectHours > 0 ? selectedProjectHours / totalProjectHours : 0;

      filtered = filtered.map(c => ({
        ...c,
        hours: Math.round(c.hours * projectProportion),
        taskCount: Math.round(c.taskCount * projectProportion)
      }));
    }

    // Apply client filter
    if (selectedClients.length > 0) {
      const selectedClientHours = clientDistribution
        .filter(c => selectedClients.includes(c.clientCode))
        .reduce((sum, c) => sum + c.hours, 0);
      const totalClientHours = clientDistribution.reduce((sum, c) => sum + c.hours, 0);
      const clientProportion = totalClientHours > 0 ? selectedClientHours / totalClientHours : 0;

      filtered = filtered.map(c => ({
        ...c,
        hours: Math.round(c.hours * clientProportion),
        taskCount: Math.round(c.taskCount * clientProportion)
      }));
    }

    // Filter out categories with 0 hours but keep selected categories visible even if they have 0 hours
    if (selectedCategories.length > 0) {
      // Keep all selected categories visible regardless of hours
      return filtered;
    } else {
      // Only show categories with hours when no category filter is active
      return filtered.filter(c => c.hours > 0);
    }
  };

  const getFilteredClientData = () => {
    let filtered = [...clientDistribution];

    // Apply client filter
    if (selectedClients.length > 0) {
      filtered = filtered.filter(c => selectedClients.includes(c.clientCode));
    }

    // Apply project filter - more accurate cross-filtering
    if (selectedProjects.length > 0) {
      filtered = filtered.map(client => {
        const clientProjects = projectHours.filter(p => p.clientCode === client.clientCode);
        const selectedClientProjects = clientProjects.filter(p => selectedProjects.includes(p.projectCode));

        if (selectedClientProjects.length === 0) {
          return { ...client, hours: 0, taskCount: 0, projectCount: 0 };
        }

        const selectedHours = selectedClientProjects.reduce((sum, p) => sum + p.hours, 0);
        const selectedTasks = selectedClientProjects.reduce((sum, p) => sum + p.taskCount, 0);

        return {
          ...client,
          hours: selectedHours,
          taskCount: selectedTasks,
          projectCount: selectedClientProjects.length
        };
      });
    }

    // Apply team member filter (approximate)
    if (selectedTeamMembers.length > 0) {
      const teamProportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);
      filtered = filtered.map(c => ({
        ...c,
        hours: Math.round(c.hours * teamProportion),
        taskCount: Math.round(c.taskCount * teamProportion)
      }));
    }

    // Apply category filter - accurate based on actual project data
    if (selectedCategories.length > 0) {
      filtered = filtered.map(client => {
        const clientProjects = projectHours.filter(p => p.clientCode === client.clientCode);
        const clientProjectsInSelectedCategories = clientProjects.filter(p => selectedCategories.includes(p.categoryId));

        if (clientProjectsInSelectedCategories.length === 0) {
          return { ...client, hours: 0, taskCount: 0, projectCount: 0 };
        }

        const selectedHours = clientProjectsInSelectedCategories.reduce((sum, p) => sum + p.hours, 0);
        const selectedTasks = clientProjectsInSelectedCategories.reduce((sum, p) => sum + p.taskCount, 0);

        return {
          ...client,
          hours: selectedHours,
          taskCount: selectedTasks,
          projectCount: clientProjectsInSelectedCategories.length
        };
      });
    }

    return filtered.filter(c => c.hours > 0); // Only show clients with hours
  };

  const getFilteredTaskTypeData = () => {
    let filtered = [...taskTypeAnalytics];

    // Apply team member filter (approximate)
    if (selectedTeamMembers.length > 0) {
      const teamProportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);
      filtered = filtered.map(t => ({
        ...t,
        hours: Math.round(t.hours * teamProportion),
        count: Math.round(t.count * teamProportion)
      }));
    }

    // Apply project filter (approximate)
    if (selectedProjects.length > 0) {
      const selectedProjectHours = projectHours
        .filter(p => selectedProjects.includes(p.projectCode))
        .reduce((sum, p) => sum + p.hours, 0);
      const totalProjectHours = projectHours.reduce((sum, p) => sum + p.hours, 0);
      const projectProportion = totalProjectHours > 0 ? selectedProjectHours / totalProjectHours : 0;

      filtered = filtered.map(t => ({
        ...t,
        hours: Math.round(t.hours * projectProportion),
        count: Math.round(t.count * projectProportion)
      }));
    }

    // Apply client filter (approximate)
    if (selectedClients.length > 0) {
      const selectedClientHours = clientDistribution
        .filter(c => selectedClients.includes(c.clientCode))
        .reduce((sum, c) => sum + c.hours, 0);
      const totalClientHours = clientDistribution.reduce((sum, c) => sum + c.hours, 0);
      const clientProportion = totalClientHours > 0 ? selectedClientHours / totalClientHours : 0;

      filtered = filtered.map(t => ({
        ...t,
        hours: Math.round(t.hours * clientProportion),
        count: Math.round(t.count * clientProportion)
      }));
    }

    // Apply category filter - accurate based on actual project hours
    if (selectedCategories.length > 0) {
      const projectsInSelectedCategories = projectHours.filter(p => selectedCategories.includes(p.categoryId));
      const totalHoursInSelectedCategories = projectsInSelectedCategories.reduce((sum, p) => sum + p.hours, 0);
      const totalProjectHours = projectHours.reduce((sum, p) => sum + p.hours, 0);

      if (totalHoursInSelectedCategories === 0 || totalProjectHours === 0) {
        filtered = filtered.map(t => ({ ...t, hours: 0, count: 0 }));
      } else {
        const categoryProportion = totalHoursInSelectedCategories / totalProjectHours;
        filtered = filtered.map(t => ({
          ...t,
          hours: Math.round(t.hours * categoryProportion),
          count: Math.round(t.count * categoryProportion)
        }));
      }
    }

    return filtered.filter(t => t.hours > 0); // Only show task types with hours
  };


  // Sidebar functions - ALWAYS show ALL items, NEVER filter them out
  // Items should only be greyed out visually, never disappear from the list
  // But the HOUR VALUES should reflect cross-filtering from other active filter types

  const getFilteredProjectsForSidebar = () => {
    return projectHours.map(project => {
      // Calculate hours based on OTHER active filters (not project filters)
      let filteredHours = project.hours;
      let filteredTaskCount = project.taskCount;

      // If other filters are active, recalculate this project's hours
      if (selectedClients.length > 0 || selectedTeamMembers.length > 0 || selectedCategories.length > 0) {

        // Apply client filter
        if (selectedClients.length > 0 && !selectedClients.includes(project.clientCode)) {
          // If client filter is active and this project's client isn't selected, hours = 0
          filteredHours = 0;
          filteredTaskCount = 0;
        }

        // Apply team member filter - CRITICAL: This must affect project sidebar hours!
        if (selectedTeamMembers.length > 0 && filteredHours > 0) {
          // Calculate proportion based on selected team members
          const teamProportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);
          filteredHours = Math.round(filteredHours * teamProportion);
          filteredTaskCount = Math.round(filteredTaskCount * teamProportion);
        }

        // Apply category filter - CRITICAL: Use actual project category IDs!
        if (selectedCategories.length > 0 && filteredHours > 0) {
          if (!selectedCategories.includes(project.categoryId)) {
            // If this project's category isn't selected, hours = 0
            filteredHours = 0;
            filteredTaskCount = 0;
          }
        }
      }

      return {
        ...project,
        hours: filteredHours,
        taskCount: filteredTaskCount
      };
    });
  };

  const getFilteredTeamMembersForSidebar = () => {
    // When category filtering is active, the backend already returns correct data
    // NO NEED for proportional calculations - backend handles it!
    return employeeAnalytics.map(employee => {
      let filteredHours = employee.totalHours;
      let filteredTaskCount = employee.taskCount;

      // Only apply project and client filters on frontend (not categories)
      if (selectedProjects.length > 0 || selectedClients.length > 0) {

        // Apply project filter
        if (selectedProjects.length > 0) {
          const projectProportion = selectedProjects.length / Math.max(projectHours.length, 1);
          filteredHours = Math.round(filteredHours * projectProportion);
          filteredTaskCount = Math.round(filteredTaskCount * projectProportion);
        }

        // Apply client filter
        if (selectedClients.length > 0) {
          const clientProportion = selectedClients.length / Math.max(clientDistribution.length, 1);
          filteredHours = Math.round(filteredHours * clientProportion);
          filteredTaskCount = Math.round(filteredTaskCount * clientProportion);
        }

        // CATEGORY FILTERING IS HANDLED BY BACKEND!
        // When selectedCategories is set, the backend filters assignments by project category
        // and returns correct employee hours. No frontend calculation needed!
      }

      return {
        ...employee,
        totalHours: filteredHours,
        taskCount: filteredTaskCount
      };
    });
  };

  const getFilteredClientsForSidebar = () => {
    return clientDistribution.map(client => {
      // Calculate hours based on OTHER active filters (not client filters)
      let filteredHours = client.hours;
      let filteredTaskCount = client.taskCount;
      let filteredProjectCount = client.projectCount;

      // If other filters are active, recalculate this client's hours
      if (selectedProjects.length > 0 || selectedTeamMembers.length > 0 || selectedCategories.length > 0) {
        // Apply non-client filters to calculate cross-filtered hours
        if (selectedProjects.length > 0) {
          // Count how many of this client's projects are selected
          const clientProjects = projectHours.filter(p => p.clientCode === client.clientCode);
          const selectedClientProjects = clientProjects.filter(p => selectedProjects.includes(p.projectCode));

          if (selectedClientProjects.length === 0) {
            // None of this client's projects are selected
            filteredHours = 0;
            filteredTaskCount = 0;
            filteredProjectCount = 0;
          } else {
            // Calculate proportional hours based on selected projects
            const totalClientHours = clientProjects.reduce((sum, p) => sum + p.hours, 0);
            const selectedClientHours = selectedClientProjects.reduce((sum, p) => sum + p.hours, 0);
            filteredHours = selectedClientHours;
            filteredTaskCount = selectedClientProjects.reduce((sum, p) => sum + p.taskCount, 0);
            filteredProjectCount = selectedClientProjects.length;
          }
        }

        if (selectedTeamMembers.length > 0) {
          // Team member filtering would require backend support for accurate calculation
          // For now, just indicate that filtering is active
          if (selectedProjects.length === 0) { // Only if project filter isn't already applied
            const proportion = selectedTeamMembers.length / Math.max(employeeAnalytics.length, 1);
            filteredHours = Math.round(filteredHours * proportion);
            filteredTaskCount = Math.round(filteredTaskCount * proportion);
            filteredProjectCount = Math.round(filteredProjectCount * proportion);
          }
        }

        // Apply category filter - CRITICAL: Use actual project data!
        if (selectedCategories.length > 0) {
          // Find this client's projects that are in selected categories
          const clientProjects = projectHours.filter(p => p.clientCode === client.clientCode);
          const clientProjectsInSelectedCategories = clientProjects.filter(p => selectedCategories.includes(p.categoryId));

          if (clientProjectsInSelectedCategories.length === 0) {
            // None of this client's projects are in selected categories
            filteredHours = 0;
            filteredTaskCount = 0;
            filteredProjectCount = 0;
          } else {
            // Calculate hours from projects in selected categories only
            filteredHours = clientProjectsInSelectedCategories.reduce((sum, p) => sum + p.hours, 0);
            filteredTaskCount = clientProjectsInSelectedCategories.reduce((sum, p) => sum + p.taskCount, 0);
            filteredProjectCount = clientProjectsInSelectedCategories.length;
          }
        }
      }

      return {
        ...client,
        hours: filteredHours,
        taskCount: filteredTaskCount,
        projectCount: filteredProjectCount
      };
    });
  };

  // Calculate filtered summary data based on current filters
  const getFilteredSummary = () => {
    const filteredProjects = getProjectChartData();
    const filteredCategories = getFilteredCategoryData();
    const filteredClients = getFilteredClientData();
    const filteredTaskTypes = getFilteredTaskTypeData();

    // Use the most specific filter source for calculations
    let totalProjects: number;
    let totalHours: number;
    let totalTasks: number;
    let averageProjectClient: number;

    // Priority order: Team members > Projects > Clients > Categories
    if (selectedTeamMembers.length > 0) {
      // When team members are selected, calculate from filtered employee data
      const filteredTeamMembers = getFilteredTeamMembersForSidebar().filter(emp =>
        selectedTeamMembers.includes(emp.employeeId)
      );

      totalHours = filteredTeamMembers.reduce((sum, emp) => sum + emp.totalHours, 0);
      totalTasks = filteredTeamMembers.reduce((sum, emp) => sum + emp.taskCount, 0);
      totalProjects = filteredProjects.length; // Projects that match other filters
      averageProjectClient = 0; // Complex to calculate with team member filtering
    } else if (selectedProjects.length > 0) {
      // When projects are selected, calculate from filtered project data
      totalProjects = filteredProjects.length;
      totalHours = filteredProjects.reduce((sum, p) => sum + p.hours, 0);
      totalTasks = filteredProjects.reduce((sum, p) => sum + p.taskCount, 0);

      // Calculate average from cross-filtered clients
      const relevantClients = getFilteredClientsForSidebar().filter(c => c.hours > 0);
      averageProjectClient = relevantClients.length > 0
        ? relevantClients.reduce((sum, c) => sum + c.projectCount, 0) / relevantClients.length
        : 0;
    } else if (selectedClients.length > 0) {
      // When clients are selected, calculate from filtered client data
      const selectedClientData = filteredClients;
      totalHours = selectedClientData.reduce((sum, c) => sum + c.hours, 0);
      totalTasks = selectedClientData.reduce((sum, c) => sum + c.taskCount, 0);
      totalProjects = selectedClientData.reduce((sum, c) => sum + c.projectCount, 0);
      averageProjectClient = selectedClientData.length > 0
        ? totalProjects / selectedClientData.length
        : 0;
    } else if (selectedCategories.length > 0) {
      // When categories are selected, calculate from filtered category data
      totalHours = filteredCategories.reduce((sum, c) => sum + c.hours, 0);
      totalTasks = filteredCategories.reduce((sum, c) => sum + c.taskCount, 0);
      totalProjects = filteredProjects.length; // Estimate from projects
      averageProjectClient = 0; // Complex to calculate with category filtering
    } else {
      // No filters active - show all data
      totalProjects = projectHours.length;
      totalHours = projectHours.reduce((sum, p) => sum + p.hours, 0);
      totalTasks = projectHours.reduce((sum, p) => sum + p.taskCount, 0);

      const allClients = clientDistribution;
      averageProjectClient = allClients.length > 0
        ? allClients.reduce((sum, c) => sum + c.projectCount, 0) / allClients.length
        : 0;
    }

    return {
      totalProjects,
      totalHours,
      totalTasks,
      averageProjectClient: Math.round(averageProjectClient * 10) / 10 // Round to 1 decimal
    };
  };

  // Custom label for pie charts
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage?.toFixed(1) || '0'}%`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#f5f7fa',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* Single Compact Header - Matching Reference */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 1,
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '60px'
      }}>
        {/* Left - DesignPlanner Logo (clickable, bigger) */}
        <Box onClick={goToCurrentPeriod} sx={{ cursor: 'pointer' }}>
          <img
            src="/assets/logos/design-planner-logo.png"
            alt="Design Planner"
            style={{ height: '40px', width: 'auto' }}
          />
        </Box>

        {/* Center - Timeline Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ToggleButtonGroup
            value={timelineMode}
            exclusive
            onChange={handleTimelineChange}
            size="small"
          >
            <ToggleButton value="DAILY">DAILY</ToggleButton>
            <ToggleButton value="WEEKLY">WEEKLY</ToggleButton>
            <ToggleButton value="MONTHLY">MONTHLY</ToggleButton>
            <ToggleButton value="YEARLY">YEARLY</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigatePeriod('prev')} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" sx={{ minWidth: '120px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatPeriodDisplay()}
            </Typography>
            <IconButton onClick={() => navigatePeriod('next')} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* Right - Tate Logo + Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src="/assets/logos/tate-logo.png"
            alt="Tate"
            style={{ height: '40px', width: 'auto' }}
          />
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content - 3 Column Layout */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        height: 'calc(100vh - 120px)' // Reserve space for header and footer
      }}>

        {/* LEFT SIDEBAR - Projects */}
        <Box sx={{ width: '200px', display: 'flex', flexDirection: 'column', p: 0.5 }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#e3f2fd',
              py: 0.5,
              px: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '11px' }}>
                PROJECTS
              </Typography>
              <Button size="small" onClick={() => setSelectedProjects([])} sx={{ fontSize: '9px', minWidth: '30px' }}>
                clear
              </Button>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, py: 0.25 }}>
              <List dense disablePadding>
                {getFilteredProjectsForSidebar().map((project, index) => {
                  const isSelected = selectedProjects.includes(project.projectCode);
                  // CRITICAL: Check if project should be greyed out due to ANY active filters
                  const isFiltered = (selectedProjects.length > 0 && !isSelected) ||
                                   (project.hours === 0); // Grey out if hours reduced to 0 by other filters

                  return (
                    <ListItem
                      key={index}
                      onClick={() => toggleProjectFilter(project.projectCode)}
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'transparent',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '2px solid transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          opacity: 1
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '11px',
                                color: isFiltered ? '#999' : 'inherit'
                              }}
                            >
                              {project.projectCode}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={isFiltered ? 'text.disabled' : 'primary'}
                              fontWeight="bold"
                              sx={{ fontSize: '11px' }}
                            >
                              {formatHours(project.hours)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Card>
        </Box>

        {/* CENTER - Charts and Summary */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0.5, gap: 0.5 }}>

          {/* Summary Cards - More Compact */}
          <Box sx={{ display: 'flex', gap: 0.5, height: '60px' }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 0.5, px: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 16, color: '#3b82f6', mb: 0.25 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '14px' }}>
                  {getFilteredSummary().totalProjects}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px' }}>
                  PROJECTS
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 0.5, px: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: '#3b82f6', mb: 0.25 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '14px' }}>
                  {formatHours(getFilteredSummary().totalHours)}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px' }}>
                  HOURS
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 0.5, px: 0.5 }}>
                <AssignmentIcon sx={{ fontSize: 16, color: '#3b82f6', mb: 0.25 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '14px' }}>
                  {getFilteredSummary().totalTasks}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px' }}>
                  TASKS
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 0.5, px: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 16, color: '#3b82f6', mb: 0.25 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '14px' }}>
                  {getFilteredSummary().averageProjectClient.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px' }}>
                  PROJ/CLIENT
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Charts Grid - Compact Layout */}
          <Box sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 0.5,
            minHeight: 0
          }}>

            {/* Project Hours Chart - Top Left (spans row 1) */}
            <Card sx={{ gridRow: '1', gridColumn: '1' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '10px' }}>
                    PROJECT HOURS
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 70 }}>
                    <Select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as ColorMode)}
                      variant="outlined"
                      sx={{ fontSize: '9px', height: '20px' }}
                    >
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="client">Client</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VictoryChart
                    theme={VictoryTheme.material}
                    domainPadding={15}
                    padding={{ left: 40, top: 5, right: 15, bottom: 30 }}
                    width={280}
                    height={100}
                    containerComponent={<VictoryContainer />}
                  >
                    <VictoryAxis
                      dependentAxis
                      tickFormat={(t) => `${t}h`}
                      style={{
                        tickLabels: { fontSize: 7, padding: 3 }
                      }}
                    />
                    <VictoryAxis
                      style={{
                        tickLabels: { fontSize: 6, padding: 3, angle: -45 }
                      }}
                    />
                    <VictoryBar
                      data={getProjectChartData()?.map(p => ({
                        x: p.projectCode,
                        y: p.hours,
                        fill: colorMode === 'client' ? p.clientColor :
                              colorMode === 'category' ? p.categoryColor : '#3B82F6',
                        projectName: p.projectName,
                        clientName: p.clientName,
                        categoryName: p.categoryName
                      })) || []}
                      style={{
                        data: {
                          fill: ({ datum, active }) => active ?
                            `${datum.fill}dd` : datum.fill,
                          cursor: 'pointer'
                        }
                      }}
                      labels={({ datum }) => {
                        if (!datum || typeof datum.y !== 'number') return '';
                        const total = getProjectChartData()?.reduce((sum, p) => sum + p.hours, 0) || 0;
                        const percentage = total > 0 ? Math.round((datum.y / total) * 100) : 0;
                        return `${percentage}%`;
                      }}
                      labelComponent={<VictoryLabel
                        style={{ fontSize: 7, fontWeight: 'bold', fill: 'black' }}
                        dy={-8}
                      />}
                      events={[{
                        target: "data",
                        eventHandlers: {
                          onMouseOver: () => [
                            {
                              target: "data",
                              mutation: () => ({ active: true })
                            }
                          ],
                          onMouseOut: () => [
                            {
                              target: "data",
                              mutation: () => ({ active: false })
                            }
                          ]
                        }
                      }]}
                    />
                  </VictoryChart>
                </Box>
              </CardContent>
            </Card>

            {/* Category Distribution - Top Right (smaller square) */}
            <Card sx={{ gridRow: '1', gridColumn: '2' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, fontSize: '10px' }}>
                  CATEGORY DISTRIBUTION
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VictoryPie
                    data={getFilteredCategoryData()?.map(cat => ({
                      x: cat.categoryName,
                      y: cat.hours,
                      fill: cat.color
                    })) || []}
                    colorScale={getFilteredCategoryData()?.map(cat => cat.color) || []}
                    innerRadius={0}
                    labelRadius={25}
                    labelComponent={<VictoryLabel
                      style={{ fontSize: 8, fontWeight: 'bold' }}
                      text={({ datum }) => {
                        const total = getFilteredCategoryData()?.reduce((sum, cat) => sum + cat.hours, 0) || 0;
                        const percentage = total > 0 ? Math.round((datum.y / total) * 100) : 0;
                        return `${percentage}%`;
                      }}
                    />}
                    padding={{ left: 5, right: 5, top: 5, bottom: 5 }}
                    width={120}
                    height={100}
                    events={[{
                      target: "data",
                      eventHandlers: {
                        onMouseOver: () => [{
                          target: "data",
                          mutation: ({ style }) => ({
                            style: { ...style, fillOpacity: 0.75, cursor: 'pointer' }
                          })
                        }],
                        onMouseOut: () => [{
                          target: "data",
                          mutation: () => ({})
                        }]
                      }
                    }]}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Task Types Chart - Bottom Left */}
            <Card sx={{ gridRow: '2', gridColumn: '1' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, fontSize: '10px' }}>
                  TASK TYPES
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VictoryChart
                    horizontal
                    theme={VictoryTheme.material}
                    domainPadding={10}
                    padding={{ left: 60, top: 5, right: 15, bottom: 15 }}
                    width={280}
                    height={90}
                  >
                    <VictoryAxis
                      dependentAxis
                      tickFormat={(t) => `${t}h`}
                      style={{
                        tickLabels: { fontSize: 6, padding: 3 }
                      }}
                    />
                    <VictoryAxis
                      style={{
                        tickLabels: { fontSize: 6, padding: 3 }
                      }}
                    />
                    <VictoryBar
                      data={getFilteredTaskTypeData()?.map(item => ({
                        x: item.taskTypeName,
                        y: item.hours,
                        taskCount: item.count
                      })) || []}
                      style={{
                        data: {
                          fill: ({ active }) => active ? '#10B981cc' : '#10B981',
                          cursor: 'pointer'
                        }
                      }}
                      labels={({ datum }) => {
                        if (!datum || typeof datum.y !== 'number') return '';
                        const total = getFilteredTaskTypeData()?.reduce((sum, item) => sum + item.hours, 0) || 0;
                        const percentage = total > 0 ? Math.round((datum.y / total) * 100) : 0;
                        return `${percentage}%`;
                      }}
                      labelComponent={<VictoryLabel
                        style={{ fontSize: 8, fontWeight: 'bold', fill: 'black' }}
                        dx={10}
                      />}
                      events={[{
                        target: "data",
                        eventHandlers: {
                          onMouseOver: () => [
                            {
                              target: "data",
                              mutation: () => ({ active: true })
                            }
                          ],
                          onMouseOut: () => [
                            {
                              target: "data",
                              mutation: () => ({ active: false })
                            }
                          ]
                        }
                      }]}
                    />
                  </VictoryChart>
                </Box>
              </CardContent>
            </Card>

            {/* Client Distribution - Bottom Right (smaller square) */}
            <Card sx={{ gridRow: '2', gridColumn: '2' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, fontSize: '10px' }}>
                  CLIENT DISTRIBUTION
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VictoryPie
                    data={getFilteredClientData()?.map(client => ({
                      x: client.clientName,
                      y: client.hours,
                      fill: client.clientColor
                    })) || []}
                    colorScale={getFilteredClientData()?.map(client => client.clientColor) || []}
                    innerRadius={20}
                    labelRadius={25}
                    labelComponent={<VictoryLabel
                      style={{ fontSize: 8, fontWeight: 'bold' }}
                      text={({ datum }) => {
                        const total = getFilteredClientData()?.reduce((sum, client) => sum + client.hours, 0) || 0;
                        const percentage = total > 0 ? Math.round((datum.y / total) * 100) : 0;
                        return `${percentage}%`;
                      }}
                    />}
                    padding={{ left: 5, right: 5, top: 5, bottom: 5 }}
                    width={120}
                    height={100}
                    events={[{
                      target: "data",
                      eventHandlers: {
                        onMouseOver: () => [{
                          target: "data",
                          mutation: ({ style }) => ({
                            style: { ...style, fillOpacity: 0.75, cursor: 'pointer' }
                          })
                        }],
                        onMouseOut: () => [{
                          target: "data",
                          mutation: () => ({})
                        }]
                      }
                    }]}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* RIGHT SIDEBAR - Team & Clients */}
        <Box sx={{ width: '200px', display: 'flex', flexDirection: 'column', p: 0.5, gap: 0.5 }}>

          {/* Team Card */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#e3f2fd',
              py: 0.5,
              px: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '11px' }}>
                TEAM
              </Typography>
              <Button size="small" onClick={() => setSelectedTeamMembers([])} sx={{ fontSize: '9px', minWidth: '30px' }}>
                clear
              </Button>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, py: 0.25 }}>
              <List dense disablePadding>
                {getFilteredTeamMembersForSidebar().map((employee, index) => {
                  const isSelected = selectedTeamMembers.includes(employee.employeeId);
                  const isFiltered = (selectedTeamMembers.length > 0 && !isSelected) || employee.totalHours === 0;

                  return (
                    <ListItem
                      key={index}
                      onClick={() => toggleTeamMemberFilter(employee.employeeId)}
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'transparent',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '2px solid transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          opacity: 1
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '11px',
                                color: isFiltered ? '#999' : 'inherit'
                              }}
                            >
                              {employee.employeeName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={isFiltered ? 'text.disabled' : 'primary'}
                              fontWeight="bold"
                              sx={{ fontSize: '11px' }}
                            >
                              {formatHours(employee.totalHours)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Card>

          {/* Clients Card */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#e3f2fd',
              py: 0.5,
              px: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '11px' }}>
                CLIENTS
              </Typography>
              <Button size="small" onClick={() => setSelectedClients([])} sx={{ fontSize: '9px', minWidth: '30px' }}>
                clear
              </Button>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, py: 0.25 }}>
              <List dense disablePadding>
                {getFilteredClientsForSidebar().map((client, index) => {
                  const isSelected = selectedClients.includes(client.clientCode);
                  const isFiltered = (selectedClients.length > 0 && !isSelected) || client.hours === 0;

                  return (
                    <ListItem
                      key={index}
                      onClick={() => toggleClientFilter(client.clientCode)}
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'transparent',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '2px solid transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          opacity: 1
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '11px',
                                color: isFiltered ? '#999' : 'inherit'
                              }}
                            >
                              {client.clientName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={isFiltered ? 'text.disabled' : 'primary'}
                              fontWeight="bold"
                              sx={{ fontSize: '11px' }}
                            >
                              {formatHours(client.hours)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Footer with Filters */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0'
      }}>
        {/* Export Button */}
        <Button
          variant="contained"
          color="success"
          startIcon={<ExportIcon />}
          size="small"
        >
          Export Excel
        </Button>

        {/* Category Filters */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.map(category => (
            <Chip
              key={category.id}
              label={category.name}
              onClick={() => toggleCategoryFilter(category.id)}
              color={selectedCategories.includes(category.id) ? "primary" : "default"}
              variant={selectedCategories.includes(category.id) ? "filled" : "outlined"}
              sx={{
                backgroundColor: selectedCategories.includes(category.id) ? category.color : undefined,
                color: selectedCategories.includes(category.id) ? 'white' : undefined,
                borderColor: category.color
              }}
            />
          ))}
        </Box>

      </Box>
    </Dialog>
  );
};

export default AnalyticsDashboardModal;