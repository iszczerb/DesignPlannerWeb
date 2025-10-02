using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class AbsenceAllocationDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeePosition { get; set; } = string.Empty;
        public int Year { get; set; }
        public int AnnualLeaveDays { get; set; }
        public int SickDaysAllowed { get; set; }
        public int OtherLeaveDaysAllowed { get; set; }
        public double UsedAnnualLeaveDays { get; set; }
        public double UsedSickDays { get; set; }
        public double UsedOtherLeaveDays { get; set; }
        public double RemainingAnnualLeaveDays => AnnualLeaveDays - UsedAnnualLeaveDays;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AbsenceRecordDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public AbsenceType AbsenceType { get; set; }
        public string AbsenceTypeName { get; set; } = string.Empty;
        public double Hours { get; set; }
        public string? Notes { get; set; }
        public bool IsApproved { get; set; }
        public int? AssignmentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AbsenceOverviewDto
    {
        public List<AbsenceAllocationDto> Allocations { get; set; } = new();
        public List<AbsenceRecordDto> Records { get; set; } = new();
        public Dictionary<AbsenceType, double> TotalUsedDaysByType { get; set; } = new();
    }

    public class CreateAbsenceRecordDto
    {
        public int EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public AbsenceType AbsenceType { get; set; }
        public double Hours { get; set; }
        public Slot? Slot { get; set; } // For half-day leaves, specify which slot
        public string? Notes { get; set; }
        public int? AssignmentId { get; set; }
    }

    public class UpdateAbsenceAllocationDto
    {
        public int Id { get; set; }
        public int AnnualLeaveDays { get; set; }
        public int SickDaysAllowed { get; set; }
        public int OtherLeaveDaysAllowed { get; set; }
    }

    public class CreateAbsenceAllocationDto
    {
        public int EmployeeId { get; set; }
        public int Year { get; set; }
        public int AnnualLeaveDays { get; set; }
        public int SickDaysAllowed { get; set; }
        public int OtherLeaveDaysAllowed { get; set; }
    }
}