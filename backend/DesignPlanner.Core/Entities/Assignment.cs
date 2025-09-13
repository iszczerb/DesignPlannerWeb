using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Interfaces;

namespace DesignPlanner.Core.Entities
{
    public class Assignment : ITimestampEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime AssignedDate { get; set; }

        [Required]
        public Slot Slot { get; set; } // Morning or Afternoon

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Custom hours for this specific assignment (nullable - if null, use task's estimated hours)
        public double? Hours { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("TaskId")]
        public virtual ProjectTask Task { get; set; } = null!;

        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; } = null!;
    }
}