using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // Employee information if applicable
        public EmployeeDto? Employee { get; set; }
    }

    public class EmployeeDto
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        public TeamDto? Team { get; set; }
        public List<UserSkillDto> Skills { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for creating a new user
    /// </summary>
    public class CreateUserDto
    {
        /// <summary>
        /// User's username (must be unique)
        /// </summary>
        [Required(ErrorMessage = "Username is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters")]
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User's password
        /// </summary>
        [Required(ErrorMessage = "Password is required")]
        [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// User's first name
        /// </summary>
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "First name must be between 1 and 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Last name must be between 1 and 100 characters")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's role in the system
        /// </summary>
        [Required(ErrorMessage = "Role is required")]
        public UserRole Role { get; set; }

        /// <summary>
        /// Team ID for employee assignment (required)
        /// </summary>
        [Required(ErrorMessage = "Team is required")]
        public int TeamId { get; set; }

        /// <summary>
        /// Employee position (optional)
        /// </summary>
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string? Position { get; set; }

        /// <summary>
        /// Employee phone number (optional)
        /// </summary>
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// List of skill IDs for this user (optional)
        /// </summary>
        public List<int> SkillIds { get; set; } = new();

        /// <summary>
        /// List of team IDs that this user manages (for Manager/Admin roles)
        /// </summary>
        public List<int>? ManagedTeamIds { get; set; }
    }

    /// <summary>
    /// Data transfer object for updating an existing user
    /// </summary>
    public class UpdateUserDto
    {
        /// <summary>
        /// User ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User's username (must be unique)
        /// </summary>
        [Required(ErrorMessage = "Username is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters")]
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User's first name
        /// </summary>
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "First name must be between 1 and 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Last name must be between 1 and 100 characters")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's role in the system
        /// </summary>
        [Required(ErrorMessage = "Role is required")]
        public UserRole Role { get; set; }

        /// <summary>
        /// Team ID for employee assignment (required)
        /// </summary>
        [Required(ErrorMessage = "Team is required")]
        public int TeamId { get; set; }

        /// <summary>
        /// Employee position (optional)
        /// </summary>
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string? Position { get; set; }

        /// <summary>
        /// Employee phone number (optional)
        /// </summary>
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// List of skill IDs for this user (optional)
        /// </summary>
        public List<int> SkillIds { get; set; } = new();

        /// <summary>
        /// Whether the user is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// List of team IDs that this user manages (for Manager/Admin roles)
        /// </summary>
        public List<int>? ManagedTeamIds { get; set; }
    }

    /// <summary>
    /// Data transfer object for user response data
    /// </summary>
    public class UserResponseDto
    {
        /// <summary>
        /// User unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User's username
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User's first name
        /// </summary>
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's full name
        /// </summary>
        public string FullName => $"{FirstName} {LastName}";

        /// <summary>
        /// User's role in the system
        /// </summary>
        public UserRole Role { get; set; }

        /// <summary>
        /// Whether the user is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the user was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last login timestamp
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// Employee information
        /// </summary>
        public UserEmployeeDto? Employee { get; set; }

        /// <summary>
        /// List of team IDs that this user manages (for Manager/Admin roles)
        /// </summary>
        public List<int>? ManagedTeamIds { get; set; }
    }

    /// <summary>
    /// Data transfer object for user employee information
    /// </summary>
    public class UserEmployeeDto
    {
        /// <summary>
        /// Employee unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Employee ID string
        /// </summary>
        public string EmployeeId { get; set; } = string.Empty;

        /// <summary>
        /// Employee position
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// Employee phone number
        /// </summary>
        public string? PhoneNumber { get; set; }

        /// <summary>
        /// Team information (primary team)
        /// </summary>
        public UserTeamDto? Team { get; set; }

        /// <summary>
        /// All teams the user belongs to (primary + managed)
        /// </summary>
        public List<UserTeamDto> Teams { get; set; } = new();

        /// <summary>
        /// List of employee skills
        /// </summary>
        public List<UserSkillDto> Skills { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for user team information
    /// </summary>
    public class UserTeamDto
    {
        /// <summary>
        /// Team unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Team name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Team code
        /// </summary>
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// Data transfer object for user skill information
    /// </summary>
    public class UserSkillDto
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
    }

    /// <summary>
    /// Data transfer object for user list response
    /// </summary>
    public class UserListResponseDto
    {
        /// <summary>
        /// List of users
        /// </summary>
        public List<UserResponseDto> Users { get; set; } = new();

        /// <summary>
        /// Total number of users
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
    /// Data transfer object for user query parameters
    /// </summary>
    public class UserQueryDto
    {
        /// <summary>
        /// Page number for pagination
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; } = 1000;

        /// <summary>
        /// Search term for filtering users
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Filter by user role
        /// </summary>
        public UserRole? Role { get; set; }

        /// <summary>
        /// Filter by team ID
        /// </summary>
        public int? TeamId { get; set; }

        /// <summary>
        /// Field to sort by
        /// </summary>
        public string SortBy { get; set; } = "FirstName";

        /// <summary>
        /// Sort direction (asc or desc)
        /// </summary>
        public string SortDirection { get; set; } = "asc";
    }

    /// <summary>
    /// Request DTO for creating a user (alias for CreateUserDto)
    /// </summary>
    public class CreateUserRequestDto : CreateUserDto
    {
    }

    /// <summary>
    /// Request DTO for updating a user (alias for UpdateUserDto)
    /// </summary>
    public class UpdateUserRequestDto : UpdateUserDto
    {
    }
}