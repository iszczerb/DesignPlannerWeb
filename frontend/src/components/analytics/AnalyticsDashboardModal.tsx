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
  InputLabel,
  Menu,
  Checkbox,
  ListItemIcon,
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  Tooltip,
  Legend,
} from 'recharts';
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
  const [teamFilters, setTeamFilters] = useState<number[]>([]); // Team IDs for filtering - empty array means show all teams
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);
  const [teamFilterAnchorEl, setTeamFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [allOriginalEmployeeAnalytics, setAllOriginalEmployeeAnalytics] = useState<EmployeeAnalyticsDto[]>([]); // Cache original data for available teams


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
  }, [open, timelineMode, currentPeriod, selectedProjects, selectedTeamMembers, selectedClients, selectedCategories, teamFilters]);

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
        // FIXED: Now use backend team filtering for managers - backend handles role-based filtering correctly

        // IMPORTANT: DO NOT CONFUSE TEAMS AND CATEGORIES!
        // TEAMS: Employee groups (Structural Team, Non-Structural Team, BIM Team, R&D Team)
        // CATEGORIES: Project types (Structural Category, Non-Structural Category, Manifold, Miscellaneous)
        // They have similar names but are COMPLETELY DIFFERENT entities!
        // teamIds in the filter refers to EMPLOYEE TEAMS, not PROJECT CATEGORIES

        // Let backend handle team filtering for managers (backend will filter by managed teams automatically)
        // Additional frontend team filtering for Admin/Manager users to filter within their managed teams
        ...(teamFilters.length > 0 && {
          teamIds: teamFilters // These are EMPLOYEE TEAM IDs for additional filtering
        }),

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

        // Cache original employee data for available teams calculation (only when no filters)
        if (teamFilters.length === 0 && selectedCategories.length === 0) {
          setAllOriginalEmployeeAnalytics(employeeData);
        }
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

  const toggleTeamFilter = (teamId: number) => {
    setTeamFilters(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const clearTeamFilters = () => {
    setTeamFilters([]);
  };

  const handleTeamFilterToggle = (event: React.MouseEvent<HTMLElement>) => {
    setTeamFilterAnchorEl(event.currentTarget);
    setTeamFilterOpen(!teamFilterOpen);
  };

  const handleTeamFilterClose = () => {
    setTeamFilterOpen(false);
    setTeamFilterAnchorEl(null);
  };

  // Get only teams that have employees with data in the ORIGINAL period (before any team filtering)
  const getAvailableTeams = () => {
    const availableTeamIds = new Set<number>();

    // Use ORIGINAL employee data, not filtered data, to determine available teams
    const dataToUse = allOriginalEmployeeAnalytics.length > 0 ? allOriginalEmployeeAnalytics : employeeAnalytics;

    dataToUse.forEach(emp => {
      if (emp.totalHours > 0) {
        const team = teams.find(t => t.name === emp.teamName);
        if (team) {
          availableTeamIds.add(team.id);
        }
      }
    });

    return teams.filter(team => availableTeamIds.has(team.id));
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
          overflow: 'visible'
        }
      }}
    >
      {/* Single Compact Header - Matching Reference */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        px: 4,
        py: 1,
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '90px'
      }}>

        {/* Single Row Layout */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          width: '100%',
          gap: 0.5,
          position: 'relative',
          height: '100%'
        }}>

        {/* Toggle centered at top - absolute positioning */}
        <Box sx={{
          position: 'absolute',
          left: '50%',
          top: '0px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          zIndex: 10,
          width: 'auto'
        }}>
          <ToggleButtonGroup
            value={timelineMode}
            exclusive
            onChange={handleTimelineChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                backgroundColor: '#00265C',
                color: 'white',
                border: '1px solid #00265C',
                fontSize: '12px',
                px: 1.5,
                py: 0.5,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#003d7a'
                },
                '&.Mui-selected': {
                  backgroundColor: '#001a3d',
                  color: 'white'
                }
              }
            }}
          >
            <ToggleButton value="DAILY">DAILY</ToggleButton>
            <ToggleButton value="WEEKLY">WEEKLY</ToggleButton>
            <ToggleButton value="MONTHLY">MONTHLY</ToggleButton>
            <ToggleButton value="YEARLY">YEARLY</ToggleButton>
          </ToggleButtonGroup>

          {/* Date aligned centered */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={() => navigatePeriod('prev')} size="small" sx={{ color: '#00265C' }}>
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle2"
              sx={{
                width: '150px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                color: '#00265C'
              }}
            >
              {formatPeriodDisplay()}
            </Typography>
            <IconButton onClick={() => navigatePeriod('next')} size="small" sx={{ color: '#00265C' }}>
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>
          {/* Left Logo */}
          <Box onClick={goToCurrentPeriod} sx={{ cursor: 'pointer' }}>
            <img
              src="/assets/logos/design-planner-logo.png"
              alt="Design Planner"
              style={{ height: '50px', width: 'auto' }}
            />
          </Box>

          {/* 2 KPIs BEFORE toggle - grouped */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Card sx={{ minWidth: '120px', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{
                textAlign: 'center',
                py: 0.5,
                px: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px', fontWeight: 600 }}>
                  PROJECTS
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px', color: '#00265C' }}>
                  {getFilteredSummary().totalProjects}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: '120px', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{
                textAlign: 'center',
                py: 0.5,
                px: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px', fontWeight: 600 }}>
                  HOURS
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px', color: '#00265C' }}>
                  {formatHours(getFilteredSummary().totalHours)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Spacer for center area */}
          <Box sx={{ width: '80px' }} />

          {/* 2 KPIs AFTER toggle - grouped */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Card sx={{ minWidth: '120px', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{
                textAlign: 'center',
                py: 0.5,
                px: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px', fontWeight: 600 }}>
                  TASKS
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px', color: '#00265C' }}>
                  {getFilteredSummary().totalTasks}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: '120px', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{
                textAlign: 'center',
                py: 0.5,
                px: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px', fontWeight: 600 }}>
                  PROJ/CLIENT
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '18px', color: '#00265C' }}>
                  {getFilteredSummary().averageProjectClient.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Right Logo + Close */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              src="/assets/logos/tate-logo.png"
              alt="Tate"
              style={{ height: '50px', width: 'auto' }}
            />
            <IconButton onClick={onClose} size="medium" sx={{ color: '#00265C' }}>
              <CloseIcon fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main Content - 3 Column Layout */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        height: 'calc(100vh - 200px)' // Reserve space for taller header and footer
      }}>

        {/* LEFT SIDEBAR - Projects */}
        <Box sx={{ width: '280px', display: 'flex', flexDirection: 'column', p: 0.5 }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#00265C',
              py: 0.5,
              px: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '16px', color: 'white' }}>
                PROJECTS
              </Typography>
              <Button size="small" onClick={() => setSelectedProjects([])} sx={{ fontSize: '12px', minWidth: '30px', color: 'white' }}>
                clear
              </Button>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 0.25 }}>
              <Box>
                {getFilteredProjectsForSidebar().map((project, index) => {
                  const isSelected = selectedProjects.includes(project.projectCode);
                  // CRITICAL: Check if project should be greyed out due to ANY active filters
                  const isFiltered = (selectedProjects.length > 0 && !isSelected) ||
                                   (project.hours === 0); // Grey out if hours reduced to 0 by other filters

                  return (
                    <Card
                      key={index}
                      onClick={() => toggleProjectFilter(project.projectCode)}
                      sx={{
                        mb: 0.5,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'white',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '1px solid #e0e0e0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transform: 'translateY(-1px)',
                          opacity: 1
                        }
                      }}
                    >
                      <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isFiltered ? '#999' : '#333'
                            }}
                          >
                            {project.projectCode}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: isFiltered ? '#999' : '#00265C',
                            }}
                          >
                            {formatHours(project.hours)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Card>
        </Box>

        {/* CENTER - Charts and Summary */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0.5, gap: 0.5 }}>


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
            <Card sx={{ gridRow: '1', gridColumn: '1', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 0.5, pr: 0.5, pb: 0, pl: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '14px', color: '#00265C' }}>
                    PROJECT HOURS
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as ColorMode)}
                      variant="outlined"
                      sx={{ fontSize: '12px', height: '32px' }}
                    >
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="client">Client</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const projectData = getProjectChartData() || [];
                        const total = projectData.reduce((sum, p) => sum + p.hours, 0);
                        return projectData.map(p => ({
                          name: p.projectCode,
                          value: p.hours,
                          percentage: total > 0 ? Math.round((p.hours / total) * 100) : 0,
                          fill: colorMode === 'client' ? p.clientColor :
                                colorMode === 'category' ? p.categoryColor : '#3B82F6',
                          projectName: p.projectName,
                          clientName: p.clientName,
                          categoryName: p.categoryName
                        }));
                      })()}
                      margin={{ top: 80, right: 5, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#605e5c', fontFamily: 'Roboto, sans-serif' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#605e5c', fontFamily: 'Roboto, sans-serif' }}
                        tickFormatter={(value) => `${value}h`}
                        grid={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}h`,
                          'Hours'
                        ]}
                        labelFormatter={(label: string) => `Project: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        itemStyle={{
                          color: '#3B82F6'
                        }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 2, 2]}
                        fill={(entry: any) => entry.fill}
                        isAnimationActive={true}
                        animationDuration={200}
                        animationEasing="ease-out"
                        animationBegin={0}
                        onMouseEnter={(data, index) => {}}
                        onMouseLeave={() => {}}
                      >
                        {(() => {
                          const projectData = getProjectChartData() || [];
                          return projectData.map((p, index) => {
                            const fillColor = colorMode === 'client' ? p.clientColor : colorMode === 'category' ? p.categoryColor : '#3B82F6';
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={fillColor}
                                style={{
                                  filter: 'brightness(1)',
                                  cursor: 'pointer',
                                  transition: 'filter 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.filter = 'brightness(1.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.filter = 'brightness(1)';
                                }}
                              />
                            );
                          });
                        })()}
                        <LabelList
                          dataKey="percentage"
                          position="top"
                          formatter={(value: number) => `${value}%`}
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            fill: '#323130',
                            fontFamily: 'Roboto, sans-serif'
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Category Distribution - Top Right (smaller square) */}
            <Card sx={{ gridRow: '1', gridColumn: '2', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 0.5, pr: 0.5, pb: 0, pl: 1.5 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, fontSize: '14px', color: '#00265C' }}>
                  CATEGORY DISTRIBUTION
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0, height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const categoryData = getFilteredCategoryData() || [];
                          const total = categoryData.reduce((sum, cat) => sum + cat.hours, 0);
                          return categoryData.map(cat => ({
                            name: cat.categoryName,
                            value: cat.hours,
                            color: cat.color,
                            percentage: total > 0 ? Math.round((cat.hours / total) * 100) : 0
                          }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={250}
                        animationEasing="ease-out"
                        animationBegin={0}
                        activeOpacity={0.8}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="14px"
                              fontWeight="700"
                              fontFamily="Roboto, sans-serif"
                            >
                              {`${Math.round(percent * 100)}%`}
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {(() => {
                          const categoryData = getFilteredCategoryData() || [];
                          return categoryData.map((cat, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={cat.color}
                              style={{
                                filter: 'brightness(1)',
                                cursor: 'pointer',
                                transition: 'filter 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.filter = 'brightness(1.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.filter = 'brightness(1)';
                              }}
                            />
                          ));
                        })()}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}h`,
                          `${name}`
                        ]}
                        labelFormatter={(label: string) => `Category: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: '12px',
                          paddingLeft: '10px',
                          lineHeight: '24px'
                        }}
                        formatter={(value, entry) => (
                          <span style={{ color: '#000000', fontSize: '12px' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Task Types Chart - Bottom Left */}
            <Card sx={{
              gridRow: '2',
              gridColumn: '1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 0.5, pr: 0.5, pb: 0, pl: 1.5 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, fontSize: '14px', color: '#00265C' }}>
                  TASK TYPES
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0, height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={(() => {
                        const taskTypeData = getFilteredTaskTypeData() || [];
                        const total = taskTypeData.reduce((sum, item) => sum + item.hours, 0);
                        const chartData = taskTypeData.map(item => ({
                          name: item.taskTypeName,
                          value: item.hours,
                          percentage: total > 0 ? Math.round((item.hours / total) * 100) : 0,
                          taskCount: item.count
                        }));
                        return chartData;
                      })()}
                      margin={{ top: 80, right: 60, left: 5, bottom: 0 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 'dataMax']}
                        tick={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#605e5c', fontFamily: 'Roboto, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}h`,
                          'Hours'
                        ]}
                        labelFormatter={(label: string) => `Task Type: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10B981"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={30}
                        isAnimationActive={true}
                        animationDuration={200}
                        animationEasing="ease-out"
                        animationBegin={0}
                      >
                        {(() => {
                          const taskTypeData = getFilteredTaskTypeData() || [];
                          return taskTypeData.map((item, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="#10B981"
                              style={{
                                filter: 'brightness(1)',
                                cursor: 'pointer',
                                transition: 'filter 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.filter = 'brightness(1.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.filter = 'brightness(1)';
                              }}
                            />
                          ));
                        })()}
                        <LabelList
                          dataKey="percentage"
                          position="right"
                          formatter={(value: number) => `${value}%`}
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            fill: '#323130',
                            fontFamily: 'Roboto, sans-serif'
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Client Distribution - Bottom Right (smaller square) */}
            <Card sx={{
              gridRow: '2',
              gridColumn: '2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 0.5, pr: 0.5, pb: 0, pl: 1.5 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, fontSize: '14px', color: '#00265C' }}>
                  CLIENT DISTRIBUTION
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0, height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const clientData = getFilteredClientData() || [];
                          const total = clientData.reduce((sum, client) => sum + client.hours, 0);
                          return clientData.map(client => ({
                            name: client.clientName,
                            value: client.hours,
                            color: client.clientColor,
                            percentage: total > 0 ? Math.round((client.hours / total) * 100) : 0
                          }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={250}
                        animationEasing="ease-out"
                        animationBegin={0}
                        activeOpacity={0.8}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="14px"
                              fontWeight="700"
                              fontFamily="Roboto, sans-serif"
                            >
                              {`${Math.round(percent * 100)}%`}
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {(() => {
                          const clientData = getFilteredClientData() || [];
                          return clientData.map((client, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={client.clientColor}
                              style={{
                                filter: 'brightness(1)',
                                cursor: 'pointer',
                                transition: 'filter 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.filter = 'brightness(1.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.filter = 'brightness(1)';
                              }}
                            />
                          ));
                        })()}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}h`,
                          `${name}`
                        ]}
                        labelFormatter={(label: string) => `Client: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: '12px',
                          paddingLeft: '10px',
                          lineHeight: '24px'
                        }}
                        formatter={(value, entry) => (
                          <span style={{ color: '#000000', fontSize: '12px' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* RIGHT SIDEBAR - Team & Clients */}
        <Box sx={{ width: '280px', display: 'flex', flexDirection: 'column', p: 0.5, gap: 0.5 }}>

          {/* Team Card */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#00265C',
              py: 0.5,
              px: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '16px', color: 'white' }}>
                TEAM
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleTeamFilterToggle}
                  sx={{
                    fontSize: '12px',
                    minWidth: '50px',
                    color: 'white',
                    backgroundColor: teamFilters.length > 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  {teamFilters.length > 0 ? `filter (${teamFilters.length})` : 'filter'}
                </Button>
                <Button size="small" onClick={() => setSelectedTeamMembers([])} sx={{ fontSize: '12px', minWidth: '30px', color: 'white' }}>
                  clear
                </Button>
              </Box>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 0.25 }}>
              <Box>
                {getFilteredTeamMembersForSidebar().map((employee, index) => {
                  const isSelected = selectedTeamMembers.includes(employee.employeeId);
                  const isFiltered = (selectedTeamMembers.length > 0 && !isSelected) || employee.totalHours === 0;

                  return (
                    <Card
                      key={index}
                      onClick={() => toggleTeamMemberFilter(employee.employeeId)}
                      sx={{
                        mb: 0.5,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'white',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '1px solid #e0e0e0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transform: 'translateY(-1px)',
                          opacity: 1
                        }
                      }}
                    >
                      <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isFiltered ? '#999' : '#333'
                            }}
                          >
                            {employee.employeeName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: isFiltered ? '#999' : '#00265C',
                            }}
                          >
                            {formatHours(employee.totalHours)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Card>

          {/* Clients Card */}
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{
              backgroundColor: '#00265C',
              py: 0.5,
              px: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '16px', color: 'white' }}>
                CLIENTS
              </Typography>
              <Button size="small" onClick={() => setSelectedClients([])} sx={{ fontSize: '12px', minWidth: '30px', color: 'white' }}>
                clear
              </Button>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 0.25 }}>
              <Box>
                {getFilteredClientsForSidebar().map((client, index) => {
                  const isSelected = selectedClients.includes(client.clientCode);
                  const isFiltered = (selectedClients.length > 0 && !isSelected) || client.hours === 0;

                  return (
                    <Card
                      key={index}
                      onClick={() => toggleClientFilter(client.clientCode)}
                      sx={{
                        mb: 0.5,
                        backgroundColor: isSelected
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'white',
                        border: isSelected
                          ? '2px solid #3B82F6'
                          : '1px solid #e0e0e0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        opacity: isFiltered ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '2px solid #3B82F6',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transform: 'translateY(-1px)',
                          opacity: 1
                        }
                      }}
                    >
                      <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isFiltered ? '#999' : '#333'
                            }}
                          >
                            {client.clientName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: isFiltered ? '#999' : '#00265C',
                            }}
                          >
                            {formatHours(client.hours)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Team Filter Dropdown */}
      {teamFilterOpen && teamFilterAnchorEl && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
            onClick={handleTeamFilterClose}
          />
          <Card
            sx={{
              position: 'fixed',
              top: (() => {
                const rect = teamFilterAnchorEl.getBoundingClientRect();
                return rect.bottom + 8;
              })(),
              left: (() => {
                const rect = teamFilterAnchorEl.getBoundingClientRect();
                return Math.max(8, rect.left - 150); // Position to left of button, but not off screen
              })(),
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '280px',
              maxWidth: '350px',
              maxHeight: '60vh',
              overflow: 'auto',
              zIndex: 9999
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#00265C' }}>
                  Filter Teams
                </Typography>
                <IconButton onClick={handleTeamFilterClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearTeamFilters}
                  disabled={teamFilters.length === 0}
                  sx={{
                    color: '#00265C',
                    borderColor: '#00265C',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 38, 92, 0.1)'
                    }
                  }}
                >
                  Clear All Filters
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Select teams to filter data:
              </Typography>

              <Box>
                {getAvailableTeams().map((team) => (
                  <Box
                    key={team.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTeamFilter(team.id);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 38, 92, 0.1)'
                      }
                    }}
                  >
                    <Checkbox
                      checked={teamFilters.includes(team.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTeamFilter(team.id);
                      }}
                      size="small"
                      sx={{
                        color: '#00265C',
                        '&.Mui-checked': {
                          color: '#00265C'
                        },
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '14px' }}>
                      {team.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Footer with Filters */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 1.5,
        backgroundColor: '#00265C',
        borderTop: '1px solid #e2e8f0'
      }}>
        {/* Category Filters */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.map(category => (
            <Chip
              key={category.id}
              label={category.name}
              onClick={() => toggleCategoryFilter(category.id)}
              sx={{
                backgroundColor: selectedCategories.includes(category.id) ? '#001a3d' : category.color,
                color: 'white',
                borderColor: category.color,
                '&:hover': {
                  backgroundColor: selectedCategories.includes(category.id) ? '#001a3d' : category.color,
                  filter: 'brightness(1.1)'
                }
              }}
            />
          ))}
        </Box>

      </Box>
    </Dialog>
  );
};

export default AnalyticsDashboardModal;