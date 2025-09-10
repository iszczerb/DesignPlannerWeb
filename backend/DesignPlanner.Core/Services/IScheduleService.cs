using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Services
{
    public interface IScheduleService
    {
        // Calendar view operations
        Task<CalendarViewDto> GetCalendarViewAsync(ScheduleRequestDto request);
        Task<CalendarViewDto> GetEmployeeScheduleAsync(int employeeId, DateTime startDate, CalendarViewType viewType);
        
        // Assignment operations
        Task<AssignmentTaskDto> CreateAssignmentAsync(CreateAssignmentDto createDto);
        Task<AssignmentTaskDto> UpdateAssignmentAsync(UpdateAssignmentDto updateDto);
        Task<bool> DeleteAssignmentAsync(int assignmentId);
        Task<List<AssignmentTaskDto>> CreateBulkAssignmentsAsync(BulkAssignmentDto bulkDto);
        
        // Assignment queries
        Task<List<AssignmentTaskDto>> GetAssignmentsByDateRangeAsync(DateRangeDto dateRange);
        Task<List<AssignmentTaskDto>> GetEmployeeAssignmentsAsync(int employeeId, DateTime startDate, DateTime endDate);
        Task<AssignmentTaskDto?> GetAssignmentByIdAsync(int assignmentId);
        
        // Capacity and availability
        Task<CapacityResponseDto> CheckCapacityAsync(CapacityCheckDto capacityCheck);
        Task<List<CapacityResponseDto>> GetCapacityForDateRangeAsync(int employeeId, DateTime startDate, DateTime endDate);
        Task<Dictionary<DateTime, Dictionary<Slot, bool>>> GetAvailabilityMatrixAsync(int employeeId, DateTime startDate, DateTime endDate);
        
        // Calendar calculations
        DateTime GetViewStartDate(DateTime baseDate, CalendarViewType viewType);
        DateTime GetViewEndDate(DateTime startDate, CalendarViewType viewType);
        List<CalendarDayDto> GenerateCalendarDays(DateTime startDate, DateTime endDate);
        bool IsWeekend(DateTime date);
        bool IsBusinessDay(DateTime date);
        
        // Validation
        Task<bool> ValidateAssignmentAsync(CreateAssignmentDto assignment);
        Task<bool> ValidateEmployeeAvailabilityAsync(int employeeId, DateTime date, Slot slot);
        Task<List<string>> GetAssignmentConflictsAsync(CreateAssignmentDto assignment);
        
        // Statistics and reporting
        Task<Dictionary<int, int>> GetEmployeeWorkloadAsync(DateTime startDate, DateTime endDate);
        Task<Dictionary<DateTime, int>> GetDailyCapacityUtilizationAsync(DateTime startDate, DateTime endDate);
        Task<List<AssignmentTaskDto>> GetOverdueAssignmentsAsync();
        Task<List<AssignmentTaskDto>> GetUpcomingDeadlinesAsync(int days = 7);

        // Team management operations
        Task<List<object>> GetManagerTeamsAsync(int userId);
        Task<List<object>> GetAllTeamsWithManagedStatusAsync(int userId);
        Task<bool> UserCanViewTeamAsync(int userId, int teamId);
        Task<CalendarViewDto> GetTeamCalendarViewAsync(ScheduleRequestDto request);
        Task<object> GetGlobalCalendarViewAsync(int userId, ScheduleRequestDto request);
    }
}