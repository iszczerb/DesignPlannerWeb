using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class AnalyticsSummaryDto
    {
        public int TotalProjects { get; set; }
        public double TotalHours { get; set; }
        public int TotalTasks { get; set; }
        public double AverageProjectClient { get; set; }
        public int TeamCount { get; set; }
        public int ActiveEmployees { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    public class ProjectHoursDto
    {
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ClientCode { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ClientColor { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryColor { get; set; } = string.Empty;
        public double Hours { get; set; }
        public int TaskCount { get; set; }
        public double Percentage { get; set; }
    }

    public class TaskTypeAnalyticsDto
    {
        public string TaskTypeName { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Hours { get; set; }
        public double Percentage { get; set; }
        public string Category { get; set; } = string.Empty;
    }

    public class ClientDistributionDto
    {
        public string ClientCode { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ClientColor { get; set; } = string.Empty;
        public double Hours { get; set; }
        public int ProjectCount { get; set; }
        public int TaskCount { get; set; }
        public double Percentage { get; set; }
    }

    public class TeamPerformanceDto
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int EmployeeCount { get; set; }
        public double TotalHours { get; set; }
        public int TotalTasks { get; set; }
        public double AverageHoursPerEmployee { get; set; }
        public double CapacityUtilization { get; set; }
    }

    public class EmployeeAnalyticsDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public double TotalHours { get; set; }
        public int TaskCount { get; set; }
        public double CapacityUtilization { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public class CategoryDistributionDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public double Hours { get; set; }
        public int TaskCount { get; set; }
        public double Percentage { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class AnalyticsFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? TeamId { get; set; }
        public List<int>? TeamIds { get; set; }  // EMPLOYEE TEAM IDs (Structural Team, Non-Structural Team, BIM, R&D)
        public int? ClientId { get; set; }
        public int? ProjectId { get; set; }
        public List<int>? CategoryIds { get; set; }  // PROJECT CATEGORY IDs (Structural Category, Non-Structural Category, Manifold, Miscellaneous)
        public CalendarViewType ViewType { get; set; } = CalendarViewType.Week;
    }
}