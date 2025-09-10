using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DesignPlanner.Core.Entities
{
    public class Employee
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int TeamId { get; set; }

        [Required]
        [MaxLength(20)]
        public string EmployeeId { get; set; } = string.Empty; // e.g., "EMP001"

        [MaxLength(100)]
        public string? Position { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public DateTime HireDate { get; set; }

        public bool IsActive { get; set; } = true;

        // Leave Management Properties
        public int TotalAnnualLeaveDays { get; set; } = 25; // Default annual leave allocation
        public int UsedLeaveDays { get; set; } = 0; // Used leave days for current year

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("TeamId")]
        public virtual Team Team { get; set; } = null!;

        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
        public virtual ICollection<EmployeeSkill> Skills { get; set; } = new List<EmployeeSkill>();
    }
}