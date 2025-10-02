using System;
using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Entities
{
    public class Leave
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public virtual Employee Employee { get; set; } = null!;

        [Required]
        public DateTime Date { get; set; }

        public LeaveType Type { get; set; } = LeaveType.AnnualLeave;

        public LeaveDuration Duration { get; set; } = LeaveDuration.FullDay;

        public Slot? Slot { get; set; } // Only used when Duration is HalfDay

        [StringLength(200)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}