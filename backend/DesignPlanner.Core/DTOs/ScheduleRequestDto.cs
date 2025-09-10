using DesignPlanner.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    public class ScheduleRequestDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public CalendarViewType ViewType { get; set; }

        public int? EmployeeId { get; set; } // Null means all employees
        
        public int? TeamId { get; set; } // Null means all teams

        public bool IncludeInactive { get; set; } = false;
    }

    public class CreateAssignmentDto
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime AssignedDate { get; set; }

        [Required]
        public Slot Slot { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateAssignmentDto
    {
        [Required]
        public int AssignmentId { get; set; }

        public int? TaskId { get; set; }

        public int? EmployeeId { get; set; }

        public DateTime? AssignedDate { get; set; }

        public Slot? Slot { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class BulkAssignmentDto
    {
        public List<CreateAssignmentDto> Assignments { get; set; } = new List<CreateAssignmentDto>();
        public bool ValidateConflicts { get; set; } = true;
        public bool AllowOverbooking { get; set; } = false;
    }

    public class CapacityCheckDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public Slot Slot { get; set; }
    }

    public class CapacityResponseDto
    {
        public int EmployeeId { get; set; }
        public DateTime Date { get; set; }
        public Slot Slot { get; set; }
        public int CurrentAssignments { get; set; }
        public int MaxCapacity { get; set; } = 4; // Max 4 tasks per slot
        public bool IsAvailable { get; set; }
        public bool IsOverbooked { get; set; }
        public List<AssignmentTaskDto> ExistingTasks { get; set; } = new List<AssignmentTaskDto>();
    }

    public class DateRangeDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public int? EmployeeId { get; set; }
    }
}