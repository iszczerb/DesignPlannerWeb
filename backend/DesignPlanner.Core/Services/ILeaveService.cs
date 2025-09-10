using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Services
{
    public interface ILeaveService
    {
        Task<decimal> CalculateLeaveDaysAsync(DateTime startDate, DateTime endDate, bool isStartDateAM, bool isEndDateAM);
        Task<LeaveBalanceDto> GetEmployeeLeaveBalanceAsync(int employeeId);
        Task<List<LeaveRequestDto>> GetPendingLeaveRequestsAsync();
        Task<List<LeaveRequestDto>> GetEmployeeLeaveRequestsAsync(int employeeId);
        Task<bool> CanRequestLeaveAsync(int employeeId, decimal requestedDays, LeaveType leaveType);
        Task<LeaveRequest> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto request);
        Task<bool> ApproveLeaveRequestAsync(int requestId, int approvedByUserId, ApproveLeaveRequestDto approvalDto);
        Task<List<TeamLeaveOverviewDto>> GetTeamLeaveOverviewAsync(DateTime startDate, DateTime endDate);
        Task<bool> UpdateEmployeeLeaveBalanceAsync(UpdateLeaveBalanceDto updateDto);
        Task<List<LeaveRequestDto>> GetLeaveRequestsForDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<bool> HasLeaveConflictAsync(int employeeId, DateTime startDate, DateTime endDate);
    }
}