using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new project
    /// </summary>
    public class CreateProjectDto
    {
        /// <summary>
        /// Client identifier for the project
        /// </summary>
        [Required(ErrorMessage = "Client is required")]
        public int ClientId { get; set; }

        /// <summary>
        /// Project code (e.g., AWS001, MSF023)
        /// </summary>
        [Required(ErrorMessage = "Project code is required")]
        [StringLength(10, MinimumLength = 3, ErrorMessage = "Project code must be between 3 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Project name
        /// </summary>
        [Required(ErrorMessage = "Project name is required")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Project name must be between 3 and 200 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Project description
        /// </summary>
        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Project status
        /// </summary>
        public ProjectStatus Status { get; set; } = ProjectStatus.Planning;

        /// <summary>
        /// Project start date
        /// </summary>
        [Required(ErrorMessage = "Start date is required")]
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Project end date (optional)
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Project deadline date (optional)
        /// </summary>
        public DateTime? DeadlineDate { get; set; }

        /// <summary>
        /// Project budget (optional)
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Budget must be a positive number")]
        public decimal? Budget { get; set; }
    }

    /// <summary>
    /// Data transfer object for updating an existing project
    /// </summary>
    public class UpdateProjectDto
    {
        /// <summary>
        /// Project unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Client identifier for the project
        /// </summary>
        [Required(ErrorMessage = "Client is required")]
        public int ClientId { get; set; }

        /// <summary>
        /// Project code (e.g., AWS001, MSF023)
        /// </summary>
        [Required(ErrorMessage = "Project code is required")]
        [StringLength(10, MinimumLength = 3, ErrorMessage = "Project code must be between 3 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Project name
        /// </summary>
        [Required(ErrorMessage = "Project name is required")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Project name must be between 3 and 200 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Project description
        /// </summary>
        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Project status
        /// </summary>
        public ProjectStatus Status { get; set; }

        /// <summary>
        /// Project start date
        /// </summary>
        [Required(ErrorMessage = "Start date is required")]
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Project end date (optional)
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Project deadline date (optional)
        /// </summary>
        public DateTime? DeadlineDate { get; set; }

        /// <summary>
        /// Project budget (optional)
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Budget must be a positive number")]
        public decimal? Budget { get; set; }

        /// <summary>
        /// Whether the project is active
        /// </summary>
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Data transfer object for project response data
    /// </summary>
    public class ProjectResponseDto
    {
        /// <summary>
        /// Project unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Client identifier
        /// </summary>
        public int ClientId { get; set; }

        /// <summary>
        /// Client name
        /// </summary>
        public string ClientName { get; set; } = string.Empty;

        /// <summary>
        /// Client code
        /// </summary>
        public string ClientCode { get; set; } = string.Empty;

        /// <summary>
        /// Project code (e.g., AWS001, MSF023)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Project name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Project description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Project status
        /// </summary>
        public ProjectStatus Status { get; set; }

        /// <summary>
        /// Project status display name
        /// </summary>
        public string StatusName => Status.ToString();

        /// <summary>
        /// Project start date
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Project end date
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Project deadline date
        /// </summary>
        public DateTime? DeadlineDate { get; set; }

        /// <summary>
        /// Project budget
        /// </summary>
        public decimal? Budget { get; set; }

        /// <summary>
        /// Whether the project is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the project was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When the project was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Number of tasks in the project
        /// </summary>
        public int TaskCount { get; set; }

        /// <summary>
        /// Project duration in days
        /// </summary>
        public int? DurationInDays => EndDate?.Subtract(StartDate).Days;

        /// <summary>
        /// Whether the project is overdue
        /// </summary>
        public bool IsOverdue => DeadlineDate.HasValue && DeadlineDate < DateTime.UtcNow && Status != ProjectStatus.Completed;
    }

    /// <summary>
    /// Data transfer object for project list response
    /// </summary>
    public class ProjectListResponseDto
    {
        /// <summary>
        /// List of projects
        /// </summary>
        public List<ProjectResponseDto> Projects { get; set; } = new();

        /// <summary>
        /// Total number of projects
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Current page number
        /// </summary>
        public int PageNumber { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Data transfer object for project query parameters
    /// </summary>
    public class ProjectQueryDto
    {
        /// <summary>
        /// Page number for pagination
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Search term for filtering projects
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by client
        /// </summary>
        public int? ClientId { get; set; }

        /// <summary>
        /// Filter by project status
        /// </summary>
        public ProjectStatus? Status { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Filter by start date from
        /// </summary>
        public DateTime? StartDateFrom { get; set; }

        /// <summary>
        /// Filter by start date to
        /// </summary>
        public DateTime? StartDateTo { get; set; }

        /// <summary>
        /// Field to sort by
        /// </summary>
        public string SortBy { get; set; } = "Name";

        /// <summary>
        /// Sort direction (asc or desc)
        /// </summary>
        public string SortDirection { get; set; } = "asc";
    }

    /// <summary>
    /// Request DTO for creating a project (alias for CreateProjectDto)
    /// </summary>
    public class CreateProjectRequestDto : CreateProjectDto
    {
    }

    /// <summary>
    /// Request DTO for updating a project (alias for UpdateProjectDto)
    /// </summary>
    public class UpdateProjectRequestDto : UpdateProjectDto
    {
    }
}