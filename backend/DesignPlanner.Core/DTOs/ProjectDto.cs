using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for project entity
    /// </summary>
    public class ProjectDto
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientCode { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ProjectStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? DeadlineDate { get; set; }
        public decimal? Budget { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int TaskCount { get; set; }
        public int? Duration { get; set; }
        public bool IsOverdue { get; set; }
    }
}