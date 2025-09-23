using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Services
{
    public interface IAbsenceService
    {
        // Get absence data for overview modal
        Task<AbsenceOverviewDto> GetAbsenceOverviewAsync(int userId);
        Task<AbsenceOverviewDto> GetEmployeeAbsenceOverviewAsync(int userId, int employeeId);

        // Allocation management
        Task<AbsenceAllocationDto?> GetEmployeeAllocationAsync(int employeeId, int year);
        Task<List<AbsenceAllocationDto>> GetTeamAllocationsAsync(int userId, int? teamId = null);
        Task<AbsenceAllocationDto> CreateAllocationAsync(int userId, CreateAbsenceAllocationDto dto);
        Task<AbsenceAllocationDto> UpdateAllocationAsync(int userId, UpdateAbsenceAllocationDto dto);
        Task<bool> DeleteAllocationAsync(int userId, int allocationId);

        // Record management
        Task<List<AbsenceRecordDto>> GetEmployeeAbsenceRecordsAsync(int userId, int employeeId, int? year = null);
        Task<AbsenceRecordDto> CreateAbsenceRecordAsync(int userId, CreateAbsenceRecordDto dto);
        Task<bool> DeleteAbsenceRecordAsync(int userId, int recordId);
        Task<int> DeleteAbsenceRecordsByDateAsync(int userId, DateTime date, int? employeeId = null);
        Task<int> ClearAbsenceAssignmentsByDateAsync(int userId, DateTime date, int? employeeId = null);
        Task<int> DeleteLeaveTasksByDateAsync(int userId, DateTime date, int? employeeId = null);
        Task<int> DeleteAllAssignmentsByDateAsync(int userId, DateTime date, int? employeeId = null);

        // Schedule integration - creates absence record when leave is scheduled
        Task<AbsenceRecordDto?> CreateAbsenceFromScheduleAsync(int assignmentId, AbsenceType absenceType);
        Task<bool> DeleteAbsenceFromScheduleAsync(int assignmentId);

        // Analytics and reporting
        Task<Dictionary<AbsenceType, double>> GetTeamAbsenceStatsAsync(int userId, int? teamId = null, int? year = null);
        Task<List<AbsenceRecordDto>> GetUpcomingAbsencesAsync(int userId, int days = 30);

        // Validation helpers
        Task<bool> CanUserManageEmployeeAbsenceAsync(int userId, int employeeId);
        Task<bool> HasSufficientAllocationAsync(int employeeId, AbsenceType absenceType, double hours, int year);
    }
}