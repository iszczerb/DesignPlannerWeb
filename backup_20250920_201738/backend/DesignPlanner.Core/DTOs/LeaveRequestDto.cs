using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class LeaveRequestDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeId_Display { get; set; } = string.Empty;
        public LeaveType LeaveType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsStartDateAM { get; set; } = true;
        public bool IsEndDateAM { get; set; } = true;
        public decimal LeaveDaysRequested { get; set; }
        public string Reason { get; set; } = string.Empty;
        public LeaveStatus Status { get; set; }
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByUserName { get; set; }
        public string? ApprovalNotes { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLeaveRequestDto
    {
        public LeaveType LeaveType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsStartDateAM { get; set; } = true;
        public bool IsEndDateAM { get; set; } = true;
        public string Reason { get; set; } = string.Empty;
    }

    public class ApproveLeaveRequestDto
    {
        public int LeaveRequestId { get; set; }
        public bool IsApproved { get; set; }
        public string? ApprovalNotes { get; set; }
    }

    public class LeaveBalanceDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalAnnualLeaveDays { get; set; }
        public int UsedLeaveDays { get; set; }
        public int RemainingLeaveDays { get; set; }
        public int PendingLeaveDays { get; set; }
    }

    public class TeamLeaveOverviewDto
    {
        public DateTime Date { get; set; }
        public List<EmployeeLeaveDto> EmployeesOnLeave { get; set; } = new List<EmployeeLeaveDto>();
    }

    public class EmployeeLeaveDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public LeaveType LeaveType { get; set; }
        public bool IsAM { get; set; }
        public bool IsPM { get; set; }
        public LeaveStatus Status { get; set; }
    }

    public class UpdateLeaveBalanceDto
    {
        public int EmployeeId { get; set; }
        public int TotalAnnualLeaveDays { get; set; }
    }
}