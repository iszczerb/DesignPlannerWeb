using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.Entities
{
    public class Client
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty; // AWS, MSFT, GOOGLE, EQX, TATE

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(255)]
        public string? ContactEmail { get; set; }

        [MaxLength(20)]
        public string? ContactPhone { get; set; }

        [MaxLength(200)]
        public string? Address { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}