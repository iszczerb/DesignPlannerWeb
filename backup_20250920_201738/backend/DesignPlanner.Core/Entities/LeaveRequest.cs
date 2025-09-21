using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Interfaces;

namespace DesignPlanner.Core.Entities
{
    public class LeaveRequest : ITimestampEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public LeaveType LeaveType { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime EndDate { get; set; }

        // AM/PM Selection for partial days
        public bool IsStartDateAM { get; set; } = true; // true = AM, false = PM
        public bool IsEndDateAM { get; set; } = true; // true = AM, false = PM

        // Calculated leave days (considering AM/PM selections)
        public decimal LeaveDaysRequested { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        public int? ApprovedByUserId { get; set; }

        [MaxLength(500)]
        public string? ApprovalNotes { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; } = null!;

        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedByUser { get; set; }
    }
}