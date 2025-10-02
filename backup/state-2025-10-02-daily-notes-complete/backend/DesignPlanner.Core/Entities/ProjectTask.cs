using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Interfaces;

namespace DesignPlanner.Core.Entities
{
    public class ProjectTask : ITimestampEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int TaskTypeId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DesignPlanner.Core.Enums.TaskStatus Status { get; set; } = DesignPlanner.Core.Enums.TaskStatus.NotStarted;

        [Required]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        public int EstimatedHours { get; set; } = 1;

        public int? ActualHours { get; set; }

        public DateTime? DueDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; } = null!;

        [ForeignKey("TaskTypeId")]
        public virtual TaskType TaskType { get; set; } = null!;

        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    }
}