namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for displaying skill information
    /// </summary>
    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int EmployeeCount { get; set; }
    }
}