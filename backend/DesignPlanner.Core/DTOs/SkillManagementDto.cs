using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new skill
    /// </summary>
    public class CreateSkillDto
    {
        /// <summary>
        /// Skill name
        /// </summary>
        [Required(ErrorMessage = "Skill name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Skill description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Skill category (e.g., "Technical", "Design", "Management")
        /// </summary>
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }
    }

    /// <summary>
    /// Data transfer object for updating an existing skill
    /// </summary>
    public class UpdateSkillDto
    {
        /// <summary>
        /// Skill name
        /// </summary>
        [Required(ErrorMessage = "Skill name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Skill description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Skill category (e.g., "Technical", "Design", "Management")
        /// </summary>
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }

        /// <summary>
        /// Whether the skill is active
        /// </summary>
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Data transfer object for skill response data
    /// </summary>
    public class SkillResponseDto
    {
        /// <summary>
        /// Skill unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Skill name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Skill description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Skill category (e.g., "Technical", "Design", "Management")
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Whether the skill is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the skill was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Number of employees with this skill
        /// </summary>
        public int EmployeeCount { get; set; }
    }

    /// <summary>
    /// Data transfer object for simple skill information
    /// </summary>
    public class SkillSimpleDto
    {
        /// <summary>
        /// Skill unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Skill name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Skill category
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Whether the skill is active
        /// </summary>
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// Data transfer object for employee skill information
    /// </summary>
    public class EmployeeSkillDto
    {
        /// <summary>
        /// Employee unique identifier
        /// </summary>
        public int EmployeeId { get; set; }

        /// <summary>
        /// Employee full name
        /// </summary>
        public string EmployeeName { get; set; } = string.Empty;

        /// <summary>
        /// Employee position
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// Team name
        /// </summary>
        public string? TeamName { get; set; }

        /// <summary>
        /// Skill proficiency level (1-5)
        /// </summary>
        public int ProficiencyLevel { get; set; }

        /// <summary>
        /// When the skill was assigned
        /// </summary>
        public DateTime AssignedAt { get; set; }
    }

    /// <summary>
    /// Data transfer object for skill with employees response
    /// </summary>
    public class SkillWithEmployeesResponseDto : SkillResponseDto
    {
        /// <summary>
        /// List of employees with this skill
        /// </summary>
        public List<EmployeeSkillDto> Employees { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for skill list response
    /// </summary>
    public class SkillListResponseDto
    {
        /// <summary>
        /// List of skills
        /// </summary>
        public List<SkillResponseDto> Skills { get; set; } = new();

        /// <summary>
        /// Total number of skills
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
    /// Data transfer object for skill query parameters
    /// </summary>
    public class SkillQueryDto
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
        /// Search term for filtering skills
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by category
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Include employee count in response
        /// </summary>
        public bool IncludeEmployeeCount { get; set; } = true;

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
    /// Data transfer object for skill categories response
    /// </summary>
    public class SkillCategoriesResponseDto
    {
        /// <summary>
        /// List of unique skill categories
        /// </summary>
        public List<string> Categories { get; set; } = new();

        /// <summary>
        /// Total number of categories
        /// </summary>
        public int TotalCount { get; set; }
    }

    /// <summary>
    /// Request DTO for creating a skill (alias for CreateSkillDto)
    /// </summary>
    public class CreateSkillRequestDto : CreateSkillDto
    {
    }

    /// <summary>
    /// Request DTO for updating a skill (alias for UpdateSkillDto)
    /// </summary>
    public class UpdateSkillRequestDto : UpdateSkillDto
    {
    }
}