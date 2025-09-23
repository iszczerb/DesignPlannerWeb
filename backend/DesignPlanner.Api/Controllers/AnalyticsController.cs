using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using System.Security.Claims;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly ApplicationDbContext _context;

        public AnalyticsController(IAnalyticsService analyticsService, ApplicationDbContext context)
        {
            _analyticsService = analyticsService;
            _context = context;
        }

        [HttpPost("summary")]
        public async Task<ActionResult<AnalyticsSummaryDto>> GetAnalyticsSummary([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var summary = await _analyticsService.GetAnalyticsSummaryAsync(filteredFilter);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error generating analytics summary: {ex.Message}");
            }
        }

        [HttpPost("project-hours")]
        public async Task<ActionResult<List<ProjectHoursDto>>> GetProjectHours([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var projectHours = await _analyticsService.GetProjectHoursAsync(filteredFilter);
                return Ok(projectHours);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting project hours: {ex.Message}");
            }
        }

        [HttpPost("task-type-analytics")]
        public async Task<ActionResult<List<TaskTypeAnalyticsDto>>> GetTaskTypeAnalytics([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var taskTypeAnalytics = await _analyticsService.GetTaskTypeAnalyticsAsync(filteredFilter);
                return Ok(taskTypeAnalytics);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting task type analytics: {ex.Message}");
            }
        }

        [HttpPost("client-distribution")]
        public async Task<ActionResult<List<ClientDistributionDto>>> GetClientDistribution([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var clientDistribution = await _analyticsService.GetClientDistributionAsync(filteredFilter);
                return Ok(clientDistribution);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting client distribution: {ex.Message}");
            }
        }

        [HttpPost("team-performance")]
        public async Task<ActionResult<List<TeamPerformanceDto>>> GetTeamPerformance([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var teamPerformance = await _analyticsService.GetTeamPerformanceAsync(filteredFilter);
                return Ok(teamPerformance);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting team performance: {ex.Message}");
            }
        }

        [HttpPost("employee-analytics")]
        public async Task<ActionResult<List<EmployeeAnalyticsDto>>> GetEmployeeAnalytics([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var employeeAnalytics = await _analyticsService.GetEmployeeAnalyticsAsync(filteredFilter);
                return Ok(employeeAnalytics);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting employee analytics: {ex.Message}");
            }
        }

        [HttpPost("category-distribution")]
        public async Task<ActionResult<List<CategoryDistributionDto>>> GetCategoryDistribution([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var filteredFilter = await ApplyRoleBasedFiltering(filter);
                var categoryDistribution = await _analyticsService.GetCategoryDistributionAsync(filteredFilter);
                return Ok(categoryDistribution);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting category distribution: {ex.Message}");
            }
        }

        private async Task<AnalyticsFilterDto> ApplyRoleBasedFiltering(AnalyticsFilterDto filter)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Debug logging
            Console.WriteLine($"🔍 ANALYTICS FILTERING START:");
            Console.WriteLine($"   UserId={userId}, Role={userRole}");
            Console.WriteLine($"   filter.TeamIds is null? {filter.TeamIds == null}");
            if (filter.TeamIds != null)
            {
                Console.WriteLine($"   filter.TeamIds.Count = {filter.TeamIds.Count}");
                Console.WriteLine($"   filter.TeamIds content = [{string.Join(",", filter.TeamIds)}]");
            }

            // Admin users can see all data - no filtering needed
            if (userRole == UserRole.Admin.ToString())
            {
                Console.WriteLine($"🔍 ADMIN USER: No filtering applied, showing all data");
                return filter;
            }

            // Manager users should only see their managed teams
            if (userRole == UserRole.Manager.ToString())
            {
                // Use EXACT same logic as ScheduleService.GetGlobalCalendarViewAsync
                var managedTeamIds = await _context.UserTeamManagements
                    .Where(utm => utm.UserId == userId)
                    .Select(utm => utm.TeamId)
                    .ToListAsync();

                Console.WriteLine($"🔍 MANAGER USER: Found managed teams from UserTeamManagements: [{string.Join(",", managedTeamIds)}]");

                // If no managed teams found, return empty filter (show no data)
                if (!managedTeamIds.Any())
                {
                    Console.WriteLine($"🔍 MANAGER USER: No managed teams found - returning empty filter");
                    filter.TeamIds = new List<int>();
                    return filter;
                }

                // CRITICAL: ALWAYS filter by managed teams for managers
                // Even if no specific teams were requested, limit to manager's teams
                if (filter.TeamIds == null || !filter.TeamIds.Any())
                {
                    // No team filter specified - use ALL managed teams
                    filter.TeamIds = managedTeamIds;
                    Console.WriteLine($"🔍 MANAGER USER: No team filter specified, using all managed teams: [{string.Join(",", managedTeamIds)}]");
                }
                else
                {
                    // Team filter was specified - intersect with managed teams only
                    var originalTeamIds = filter.TeamIds.ToList();
                    filter.TeamIds = filter.TeamIds.Intersect(managedTeamIds).ToList();
                    Console.WriteLine($"🔍 MANAGER USER: Filtered requested teams {string.Join(",", originalTeamIds)} down to managed teams: [{string.Join(",", filter.TeamIds)}]");
                }

                Console.WriteLine($"🔍 FINAL FILTER: TeamIds = [{string.Join(",", filter.TeamIds)}]");
                return filter;
            }

            // TeamMember users should only see their own data
            if (userRole == UserRole.TeamMember.ToString())
            {
                // Get the employee ID for this user
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                if (employee != null)
                {
                    Console.WriteLine($"🔍 TEAMMEMBER USER: Found employee ID {employee.Id} for user {userId}");
                    filter.EmployeeId = employee.Id;
                    Console.WriteLine($"🔍 FINAL FILTER: EmployeeId = {filter.EmployeeId}");
                }
                else
                {
                    Console.WriteLine($"🔍 TEAMMEMBER USER: No employee found for user {userId} - returning empty filter");
                    // No employee record found - return empty filter to show no data
                    filter.EmployeeId = -1; // Use invalid ID to ensure no data is returned
                }

                return filter;
            }

            // Default case - should not reach here
            Console.WriteLine($"🔍 UNKNOWN ROLE: Returning empty filter");
            filter.EmployeeId = -1; // Use invalid ID to ensure no data is returned
            return filter;
        }
    }
}