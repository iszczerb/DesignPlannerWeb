using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Entities
{
    public class AbsenceRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public AbsenceType AbsenceType { get; set; }

        [Required]
        public double Hours { get; set; }

        // For half-day leaves, specify which slot (Morning/Afternoon)
        public Slot? Slot { get; set; }

        public string? Notes { get; set; }

        public bool IsApproved { get; set; } = true; // Default approved for now

        // Link to Assignment if this absence was created from schedule
        public int? AssignmentId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Employee Employee { get; set; } = null!;
        public virtual Assignment? Assignment { get; set; }
    }
}