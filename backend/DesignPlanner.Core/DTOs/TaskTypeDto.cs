namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for displaying task type information
    /// </summary>
    public class TaskTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<RequiredSkillDto> RequiredSkills { get; set; } = new();
        public int TaskCount { get; set; }
    }

    /// <summary>
    /// DTO for required skill for a task type
    /// </summary>
    public class RequiredSkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
    }
}