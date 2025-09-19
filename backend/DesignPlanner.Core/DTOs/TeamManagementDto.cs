using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new team
    /// </summary>
    public class CreateTeamDto
    {
        /// <summary>
        /// Team name
        /// </summary>
        [Required(ErrorMessage = "Team name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Team name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Team code (e.g., TEAM01, STR, BIM)
        /// </summary>
        [Required(ErrorMessage = "Team code is required")]
        [StringLength(10, MinimumLength = 2, ErrorMessage = "Team code must be between 2 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Team description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }
    }

    /// <summary>
    /// Data transfer object for updating an existing team
    /// </summary>
    public class UpdateTeamDto
    {
        /// <summary>
        /// Team name
        /// </summary>
        [Required(ErrorMessage = "Team name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Team name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Team code (e.g., TEAM01, STR, BIM)
        /// </summary>
        [Required(ErrorMessage = "Team code is required")]
        [StringLength(10, MinimumLength = 2, ErrorMessage = "Team code must be between 2 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Team description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Whether the team is active
        /// </summary>
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Data transfer object for team response data
    /// </summary>
    public class TeamResponseDto
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
        /// Team code (e.g., TEAM01, STR, BIM)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Team description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Whether the team is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the team was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Number of members in the team
        /// </summary>
        public int MemberCount { get; set; }

        /// <summary>
        /// Number of active members in the team
        /// </summary>
        public int ActiveMemberCount { get; set; }

        /// <summary>
        /// Team manager ID (user with Manager role assigned to this team)
        /// </summary>
        public int? ManagerId { get; set; }

        /// <summary>
        /// Team manager name (full name of the manager)
        /// </summary>
        public string? ManagerName { get; set; }
    }

    /// <summary>
    /// Data transfer object for simple team information
    /// </summary>
    public class TeamSimpleDto
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

        /// <summary>
        /// Whether the team is active
        /// </summary>
        public bool IsActive { get; set; }
    }


    /// <summary>
    /// Data transfer object for team with members response
    /// </summary>
    public class TeamWithMembersResponseDto : TeamResponseDto
    {
        /// <summary>
        /// List of team members
        /// </summary>
        public List<TeamMemberDto> Members { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for team list response
    /// </summary>
    public class TeamListResponseDto
    {
        /// <summary>
        /// List of teams
        /// </summary>
        public List<TeamResponseDto> Teams { get; set; } = new();

        /// <summary>
        /// Total number of teams
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
    /// Data transfer object for team query parameters
    /// </summary>
    public class TeamQueryDto
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
        /// Search term for filtering teams
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Include member count in response
        /// </summary>
        public bool IncludeMemberCount { get; set; } = true;

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
    /// Request DTO for creating a team (alias for CreateTeamDto)
    /// </summary>
    public class CreateTeamRequestDto : CreateTeamDto
    {
    }

    /// <summary>
    /// Request DTO for updating a team (alias for UpdateTeamDto)
    /// </summary>
    public class UpdateTeamRequestDto : UpdateTeamDto
    {
    }

    /// <summary>
    /// Detailed team DTO (alias for TeamResponseDto)
    /// </summary>
    public class TeamDetailDto : TeamResponseDto
    {
    }
}