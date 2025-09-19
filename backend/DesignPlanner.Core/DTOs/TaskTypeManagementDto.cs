using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new task type
    /// </summary>
    public class CreateTaskTypeDto
    {
        /// <summary>
        /// Task type name
        /// </summary>
        [Required(ErrorMessage = "Task type name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Task type name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Task type description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// List of skill IDs for this task type
        /// </summary>
        public List<int> Skills { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for updating an existing task type
    /// </summary>
    public class UpdateTaskTypeDto
    {
        /// <summary>
        /// Task type ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Task type name
        /// </summary>
        [Required(ErrorMessage = "Task type name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Task type name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Task type description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// List of skill IDs for this task type
        /// </summary>
        public List<int> Skills { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for task type response data
    /// </summary>
    public class TaskTypeResponseDto
    {
        /// <summary>
        /// Task type unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Task type name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Task type description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// When the task type was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// List of required skills for this task type
        /// </summary>
        public List<TaskTypeSkillDto> RequiredSkills { get; set; } = new();

        /// <summary>
        /// Number of tasks using this task type
        /// </summary>
        public int TaskCount { get; set; }
    }

    /// <summary>
    /// Data transfer object for task type skill information
    /// </summary>
    public class TaskTypeSkillDto
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
    /// Data transfer object for simple task type information
    /// </summary>
    public class TaskTypeSimpleDto
    {
        /// <summary>
        /// Task type unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Task type name
        /// </summary>
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// Data transfer object for task type with qualified employees
    /// </summary>
    public class TaskTypeWithEmployeesDto : TaskTypeResponseDto
    {
        /// <summary>
        /// List of employees qualified for this task type (have all required skills)
        /// </summary>
        public List<QualifiedEmployeeDto> QualifiedEmployees { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for qualified employee information
    /// </summary>
    public class QualifiedEmployeeDto
    {
        /// <summary>
        /// Employee unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Employee full name
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Employee position
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// Team name
        /// </summary>
        public string? TeamName { get; set; }

        /// <summary>
        /// List of matching skills
        /// </summary>
        public List<string> MatchingSkills { get; set; } = new();

        /// <summary>
        /// Percentage of required skills the employee has
        /// </summary>
        public decimal SkillMatchPercentage { get; set; }
    }

    /// <summary>
    /// Data transfer object for task type list response
    /// </summary>
    public class TaskTypeListResponseDto
    {
        /// <summary>
        /// List of task types
        /// </summary>
        public List<TaskTypeResponseDto> TaskTypes { get; set; } = new();

        /// <summary>
        /// Total number of task types
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
    /// Data transfer object for task type query parameters
    /// </summary>
    public class TaskTypeQueryDto
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
        /// Search term for filtering task types
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Filter by required skill
        /// </summary>
        public int? RequiredSkillId { get; set; }

        /// <summary>
        /// Include task count in response
        /// </summary>
        public bool IncludeTaskCount { get; set; } = true;

        /// <summary>
        /// Include required skills in response
        /// </summary>
        public bool IncludeRequiredSkills { get; set; } = true;

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
    /// Request DTO for creating a task type (alias for CreateTaskTypeDto)
    /// </summary>
    public class CreateTaskTypeRequestDto : CreateTaskTypeDto
    {
    }

    /// <summary>
    /// Request DTO for updating a task type (alias for UpdateTaskTypeDto)
    /// </summary>
    public class UpdateTaskTypeRequestDto : UpdateTaskTypeDto
    {
    }
}