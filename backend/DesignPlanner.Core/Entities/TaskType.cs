using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.Entities
{
    public class TaskType
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(20)]
        public string? Color { get; set; } // Hex color for UI display

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    }
}