using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.Entities
{
    public class Team
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty; // e.g., "TEAM01"

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Employee> Members { get; set; } = new List<Employee>();
    }
}