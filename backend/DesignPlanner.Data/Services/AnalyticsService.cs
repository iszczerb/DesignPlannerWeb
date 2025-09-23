using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AnalyticsSummaryDto> GetAnalyticsSummaryAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            // Include related data for calculations
            var assignments = await query
                .Include(a => a.Employee)
                .Include(a => a.Task)
                .Include(a => a.Task.Project)
                .Include(a => a.Task.Project.Client)
                .Include(a => a.Task.TaskType)
                .ToListAsync();

            var totalTasks = assignments.Count;
            var totalHours = assignments.Sum(a => a.Hours ?? 1);
            var totalProjects = assignments.Select(a => a.Task.ProjectId).Distinct().Count();
            var activeEmployees = assignments.Select(a => a.EmployeeId).Distinct().Count();
            var teamCount = await _context.Teams.CountAsync();

            // Calculate average projects per client
            var clientProjectCounts = assignments
                .GroupBy(a => a.Task.Project.ClientId)
                .Select(g => g.Select(a => a.Task.ProjectId).Distinct().Count())
                .ToList();
            var averageProjectClient = clientProjectCounts.Any() ? clientProjectCounts.Average() : 0;

            return new AnalyticsSummaryDto
            {
                TotalProjects = totalProjects,
                TotalHours = totalHours,
                TotalTasks = totalTasks,
                AverageProjectClient = Math.Round(averageProjectClient, 2),
                TeamCount = teamCount,
                ActiveEmployees = activeEmployees,
                PeriodStart = filter.StartDate ?? DateTime.MinValue,
                PeriodEnd = filter.EndDate ?? DateTime.MaxValue
            };
        }

        public async Task<List<ProjectHoursDto>> GetProjectHoursAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            var projectData = await query
                .Include(a => a.Task)
                .Include(a => a.Task.Project)
                .Include(a => a.Task.Project.Client)
                .Include(a => a.Task.Project.Category)
                .GroupBy(a => new {
                    a.Task.ProjectId,
                    ProjectName = a.Task.Project.Name,
                    ClientName = a.Task.Project.Client.Name,
                    ClientCode = a.Task.Project.Client.Code,
                    ClientColor = a.Task.Project.Client.Color,
                    CategoryId = a.Task.Project.Category != null ? a.Task.Project.Category.Id : 0,
                    CategoryName = a.Task.Project.Category != null ? a.Task.Project.Category.Name : "Uncategorized",
                    CategoryColor = a.Task.Project.Category != null ? a.Task.Project.Category.Color : "#6B7280"
                })
                .Select(g => new ProjectHoursDto
                {
                    ProjectCode = g.Key.ProjectName.Substring(0, Math.Min(g.Key.ProjectName.Length, 10)),
                    ProjectName = g.Key.ProjectName,
                    ClientCode = g.Key.ClientCode,
                    ClientName = g.Key.ClientName,
                    ClientColor = g.Key.ClientColor ?? "#3B82F6",
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.CategoryName,
                    CategoryColor = g.Key.CategoryColor ?? "#6B7280",
                    Hours = g.Sum(a => a.Hours ?? 1),
                    TaskCount = g.Count(),
                    Percentage = 0 // Will calculate after getting total
                })
                .ToListAsync();

            // Calculate percentages
            var totalHours = projectData.Sum(p => p.Hours);
            if (totalHours > 0)
            {
                foreach (var project in projectData)
                {
                    project.Percentage = Math.Round((project.Hours / totalHours) * 100, 2);
                }
            }

            return projectData.OrderByDescending(p => p.Hours).ToList();
        }

        public async Task<List<TaskTypeAnalyticsDto>> GetTaskTypeAnalyticsAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            var taskTypeData = await query
                .Include(a => a.Task)
                .Include(a => a.Task.TaskType)
                .GroupBy(a => new {
                    TaskTypeName = a.Task.TaskType.Name
                })
                .Select(g => new TaskTypeAnalyticsDto
                {
                    TaskTypeName = g.Key.TaskTypeName,
                    Category = "General",
                    Count = g.Count(),
                    Hours = g.Sum(a => a.Hours ?? 1),
                    Percentage = 0 // Will calculate after getting total
                })
                .ToListAsync();

            // Calculate percentages
            var totalHours = taskTypeData.Sum(t => t.Hours);
            if (totalHours > 0)
            {
                foreach (var taskType in taskTypeData)
                {
                    taskType.Percentage = Math.Round((taskType.Hours / totalHours) * 100, 2);
                }
            }

            return taskTypeData.OrderByDescending(t => t.Hours).ToList();
        }

        public async Task<List<ClientDistributionDto>> GetClientDistributionAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            var clientData = await query
                .Include(a => a.Task)
                .Include(a => a.Task.Project)
                .Include(a => a.Task.Project.Client)
                .GroupBy(a => new {
                    a.Task.Project.Client.Id,
                    ClientName = a.Task.Project.Client.Name,
                    ClientCode = a.Task.Project.Client.Code,
                    ClientColor = a.Task.Project.Client.Color
                })
                .Select(g => new ClientDistributionDto
                {
                    ClientCode = g.Key.ClientCode,
                    ClientName = g.Key.ClientName,
                    ClientColor = g.Key.ClientColor ?? "#3B82F6",
                    Hours = g.Sum(a => a.Hours ?? 1),
                    ProjectCount = g.Select(a => a.Task.ProjectId).Distinct().Count(),
                    TaskCount = g.Count(),
                    Percentage = 0 // Will calculate after getting total
                })
                .ToListAsync();

            // Calculate percentages
            var totalHours = clientData.Sum(c => c.Hours);
            if (totalHours > 0)
            {
                foreach (var client in clientData)
                {
                    client.Percentage = Math.Round((client.Hours / totalHours) * 100, 2);
                }
            }

            return clientData.OrderByDescending(c => c.Hours).ToList();
        }

        public async Task<List<TeamPerformanceDto>> GetTeamPerformanceAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            // First, get team data without the complex EmployeeIds list
            var teamData = await query
                .Include(a => a.Employee)
                .Include(a => a.Employee.Team)
                .Where(a => a.Employee.TeamId.HasValue)
                .GroupBy(a => new { TeamId = a.Employee.TeamId!.Value, TeamName = a.Employee.Team.Name })
                .Select(g => new
                {
                    TeamId = g.Key.TeamId,
                    TeamName = g.Key.TeamName,
                    TotalHours = g.Sum(a => a.Hours ?? 1),
                    TaskCount = g.Count()
                })
                .ToListAsync();

            var result = new List<TeamPerformanceDto>();

            foreach (var team in teamData)
            {
                // Get distinct employee count for this team separately
                var employeeCount = await query
                    .Where(a => a.Employee.TeamId == team.TeamId)
                    .Select(a => a.EmployeeId)
                    .Distinct()
                    .CountAsync();

                var averageHoursPerEmployee = employeeCount > 0 ? (double)team.TotalHours / employeeCount : 0;

                // Calculate capacity utilization (assuming 8 hours per day per employee for the period)
                var daysInPeriod = 1; // Default to 1 day
                if (filter.StartDate.HasValue && filter.EndDate.HasValue)
                {
                    daysInPeriod = Math.Max(1, (filter.EndDate.Value - filter.StartDate.Value).Days + 1);
                }

                var maxCapacity = employeeCount * 8 * daysInPeriod; // 8 hours per day per employee
                var capacityUtilization = maxCapacity > 0 ? (team.TotalHours / maxCapacity) * 100 : 0;

                result.Add(new TeamPerformanceDto
                {
                    TeamId = team.TeamId,
                    TeamName = team.TeamName,
                    EmployeeCount = employeeCount,
                    TotalHours = team.TotalHours,
                    TotalTasks = team.TaskCount,
                    AverageHoursPerEmployee = Math.Round(averageHoursPerEmployee, 2),
                    CapacityUtilization = Math.Round(Math.Min(capacityUtilization, 100), 2) // Cap at 100%
                });
            }

            return result.OrderByDescending(t => t.TotalHours).ToList();
        }

        public async Task<List<EmployeeAnalyticsDto>> GetEmployeeAnalyticsAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            var employeeData = await query
                .Include(a => a.Employee)
                .Include(a => a.Employee.Team)
                .Include(a => a.Employee.User)
                .GroupBy(a => new {
                    a.EmployeeId,
                    a.Employee.FirstName,
                    a.Employee.LastName,
                    TeamName = a.Employee.Team.Name,
                    Role = a.Employee.User.Role
                })
                .Select(g => new
                {
                    EmployeeId = g.Key.EmployeeId,
                    FirstName = g.Key.FirstName,
                    LastName = g.Key.LastName,
                    TeamName = g.Key.TeamName,
                    Role = g.Key.Role,
                    TotalHours = g.Sum(a => a.Hours ?? 1),
                    TaskCount = g.Count()
                })
                .ToListAsync();

            var result = new List<EmployeeAnalyticsDto>();

            foreach (var employee in employeeData)
            {
                // Calculate capacity utilization (assuming 8 hours per day for the period)
                var daysInPeriod = 1; // Default to 1 day
                if (filter.StartDate.HasValue && filter.EndDate.HasValue)
                {
                    daysInPeriod = Math.Max(1, (filter.EndDate.Value - filter.StartDate.Value).Days + 1);
                }

                var maxCapacity = 8 * daysInPeriod; // 8 hours per day
                var capacityUtilization = maxCapacity > 0 ? (employee.TotalHours / maxCapacity) * 100 : 0;

                result.Add(new EmployeeAnalyticsDto
                {
                    EmployeeId = employee.EmployeeId,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    TeamName = employee.TeamName ?? "Unassigned",
                    TotalHours = employee.TotalHours,
                    TaskCount = employee.TaskCount,
                    CapacityUtilization = Math.Round(Math.Min(capacityUtilization, 100), 2), // Cap at 100%
                    Role = employee.Role.ToString()
                });
            }

            return result.OrderByDescending(e => e.TotalHours).ToList();
        }

        public async Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync(AnalyticsFilterDto filter)
        {
            var query = _context.Assignments.Where(a => a.IsActive).AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate >= filter.StartDate.Value);
            }
            if (filter.EndDate.HasValue)
            {
                query = query.Where(a => a.AssignedDate <= filter.EndDate.Value);
            }
            // EMPLOYEE TEAM FILTERING
            if (filter.TeamIds != null && filter.TeamIds.Any())
            {
                query = query.Where(a => a.Employee.TeamId.HasValue && filter.TeamIds.Contains(a.Employee.TeamId.Value));
            }
            if (filter.TeamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == filter.TeamId.Value);
            }
            // SPECIFIC EMPLOYEE FILTERING (for TeamMember role)
            if (filter.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == filter.EmployeeId.Value);
            }
            // PROJECT CATEGORY FILTERING (NOT TEAM!)
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(a => a.Task.Project.CategoryId.HasValue && filter.CategoryIds.Contains(a.Task.Project.CategoryId.Value));
            }

            var categoryData = await query
                .Include(a => a.Task)
                .Include(a => a.Task.Project)
                .Include(a => a.Task.Project.Category)
                .GroupBy(a => new {
                    CategoryName = a.Task.Project.Category != null ? a.Task.Project.Category.Name : "Uncategorized",
                    CategoryColor = a.Task.Project.Category != null ? a.Task.Project.Category.Color : "#6B7280"
                })
                .Select(g => new CategoryDistributionDto
                {
                    CategoryName = g.Key.CategoryName,
                    Hours = g.Sum(a => a.Hours ?? 1),
                    TaskCount = g.Count(),
                    Color = g.Key.CategoryColor ?? "#3B82F6",
                    Percentage = 0 // Will calculate after getting total
                })
                .ToListAsync();

            // Calculate percentages
            var totalHours = categoryData.Sum(c => c.Hours);
            if (totalHours > 0)
            {
                foreach (var category in categoryData)
                {
                    category.Percentage = Math.Round((category.Hours / totalHours) * 100, 2);
                }
            }

            return categoryData.OrderByDescending(c => c.Hours).ToList();
        }
    }
}