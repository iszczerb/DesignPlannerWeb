using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    public interface IAnalyticsService
    {
        Task<AnalyticsSummaryDto> GetAnalyticsSummaryAsync(AnalyticsFilterDto filter);
        Task<List<ProjectHoursDto>> GetProjectHoursAsync(AnalyticsFilterDto filter);
        Task<List<TaskTypeAnalyticsDto>> GetTaskTypeAnalyticsAsync(AnalyticsFilterDto filter);
        Task<List<ClientDistributionDto>> GetClientDistributionAsync(AnalyticsFilterDto filter);
        Task<List<TeamPerformanceDto>> GetTeamPerformanceAsync(AnalyticsFilterDto filter);
        Task<List<EmployeeAnalyticsDto>> GetEmployeeAnalyticsAsync(AnalyticsFilterDto filter);
        Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync(AnalyticsFilterDto filter);
    }
}