using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Interfaces;

namespace DesignPlanner.Core.Entities
{
    public class Project : ITimestampEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClientId { get; set; }

        public int? CategoryId { get; set; }


        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public ProjectStatus Status { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public DateTime? DeadlineDate { get; set; }



        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; } = null!;

        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        public virtual ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    }
}