using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class CalendarViewDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public CalendarViewType ViewType { get; set; }
        public List<CalendarDayDto> Days { get; set; } = new List<CalendarDayDto>();
        public List<EmployeeScheduleDto> Employees { get; set; } = new List<EmployeeScheduleDto>();
        public List<TaskTypeDto> TaskTypes { get; set; } = new List<TaskTypeDto>();
    }

    public class CalendarDayDto
    {
        public DateTime Date { get; set; }
        public bool IsToday { get; set; }
        public string DisplayDate { get; set; } = string.Empty;
        public string DayName { get; set; } = string.Empty;
        // Note: IsWeekend property removed as we only support weekdays (Monday-Friday)
    }

    public class EmployeeScheduleDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Team { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public List<DayAssignmentDto> DayAssignments { get; set; } = new List<DayAssignmentDto>();
    }

    public class DayAssignmentDto
    {
        public DateTime Date { get; set; }
        public TimeSlotAssignmentDto? MorningSlot { get; set; }
        public TimeSlotAssignmentDto? AfternoonSlot { get; set; }
        public int TotalAssignments { get; set; }
        public bool HasConflicts { get; set; }
    }

    public class TimeSlotAssignmentDto
    {
        public Slot Slot { get; set; }
        public List<AssignmentTaskDto> Tasks { get; set; } = new List<AssignmentTaskDto>();
        public int AvailableCapacity { get; set; }
        public bool IsOverbooked { get; set; }
    }

    public class AssignmentTaskDto
    {
        public int AssignmentId { get; set; }
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string TaskTypeName { get; set; } = string.Empty;
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ClientCode { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string ClientColor { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; }
        public Slot Slot { get; set; }
        public DesignPlanner.Core.Enums.TaskStatus TaskStatus { get; set; }
        public TaskPriority Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public double? Hours { get; set; }
    }

    public class ClientDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public int ClientId { get; set; }
    }

    public class TaskTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProjectTaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int TaskTypeId { get; set; }
        public string TaskTypeName { get; set; } = string.Empty;
        public TaskPriority Priority { get; set; }
        public DesignPlanner.Core.Enums.TaskStatus Status { get; set; }
    }

}