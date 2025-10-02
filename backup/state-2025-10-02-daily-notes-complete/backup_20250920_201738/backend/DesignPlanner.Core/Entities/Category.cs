using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Interfaces;

namespace DesignPlanner.Core.Entities
{
    public class Category : ITimestampEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = "#3b82f6"; // Default color (blue)

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}