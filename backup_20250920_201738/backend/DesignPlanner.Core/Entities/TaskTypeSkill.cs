using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.Entities
{
    public class TaskTypeSkill
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaskTypeId { get; set; }

        [Required]
        public int SkillId { get; set; }

        /// <summary>
        /// Whether this skill is required or optional for the task type
        /// </summary>
        public bool IsRequired { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual TaskType TaskType { get; set; } = null!;
        public virtual Skill Skill { get; set; } = null!;
    }
}