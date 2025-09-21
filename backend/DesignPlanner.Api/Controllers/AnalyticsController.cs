using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpPost("summary")]
        public async Task<ActionResult<AnalyticsSummaryDto>> GetAnalyticsSummary([FromBody] AnalyticsFilterDto filter)
        {
            try
            {
                var summary = await _analyticsService.GetAnalyticsSummaryAsync(filter);
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
                var projectHours = await _analyticsService.GetProjectHoursAsync(filter);
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
                var taskTypeAnalytics = await _analyticsService.GetTaskTypeAnalyticsAsync(filter);
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
                var clientDistribution = await _analyticsService.GetClientDistributionAsync(filter);
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
                var teamPerformance = await _analyticsService.GetTeamPerformanceAsync(filter);
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
                var employeeAnalytics = await _analyticsService.GetEmployeeAnalyticsAsync(filter);
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
                var categoryDistribution = await _analyticsService.GetCategoryDistributionAsync(filter);
                return Ok(categoryDistribution);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting category distribution: {ex.Message}");
            }
        }
    }
}