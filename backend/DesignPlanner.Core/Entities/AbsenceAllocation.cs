using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.Entities
{
    public class AbsenceAllocation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        public int AnnualLeaveDays { get; set; }

        public int SickDaysAllowed { get; set; } = 0; // Usually unlimited, but can set limit

        public int OtherLeaveDaysAllowed { get; set; } = 0; // Other leave days allocation

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Employee Employee { get; set; } = null!;
    }
}