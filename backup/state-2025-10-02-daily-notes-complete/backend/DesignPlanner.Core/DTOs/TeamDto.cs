namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for displaying team information
    /// </summary>
    public class TeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int MemberCount { get; set; }
        public int ActiveMemberCount { get; set; }
        public List<TeamMemberDto>? Members { get; set; }
    }

    /// <summary>
    /// DTO for team member information
    /// </summary>
    public class TeamMemberDto
    {
        public int Id { get; set; }
        public string? EmployeeId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Position { get; set; }
        public bool IsActive { get; set; }
        public DateTime? HireDate { get; set; }
    }
}