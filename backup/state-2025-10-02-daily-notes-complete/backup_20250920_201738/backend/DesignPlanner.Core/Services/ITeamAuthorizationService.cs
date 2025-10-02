using DesignPlanner.Core.Entities;

namespace DesignPlanner.Core.Services
{
    public interface ITeamAuthorizationService
    {
        /// <summary>
        /// Check if user can manage (edit/create/delete tasks) for a specific team
        /// </summary>
        Task<bool> CanManageTeamAsync(int userId, int teamId);

        /// <summary>
        /// Check if user can view schedules for a specific team
        /// </summary>
        Task<bool> CanViewTeamAsync(int userId, int teamId);

        /// <summary>
        /// Check if user can manage (edit/create/delete tasks) for a specific employee
        /// </summary>
        Task<bool> CanManageEmployeeAsync(int userId, int employeeId);

        /// <summary>
        /// Check if user can view schedule for a specific employee
        /// </summary>
        Task<bool> CanViewEmployeeAsync(int userId, int employeeId);

        /// <summary>
        /// Get all teams that user can manage
        /// </summary>
        Task<List<Team>> GetManagedTeamsAsync(int userId);

        /// <summary>
        /// Get all teams that user can view (including managed teams)
        /// </summary>
        Task<List<Team>> GetViewableTeamsAsync(int userId);

        /// <summary>
        /// Get all employees that user can manage
        /// </summary>
        Task<List<Employee>> GetManagedEmployeesAsync(int userId);

        /// <summary>
        /// Get all employees that user can view (including managed employees)
        /// </summary>
        Task<List<Employee>> GetViewableEmployeesAsync(int userId);

        /// <summary>
        /// Check if user has admin privileges
        /// </summary>
        Task<bool> IsAdminAsync(int userId);

        /// <summary>
        /// Check if user has manager privileges
        /// </summary>
        Task<bool> IsManagerAsync(int userId);

        /// <summary>
        /// Filter assignment operations based on user permissions
        /// </summary>
        Task<bool> CanModifyAssignmentAsync(int userId, int assignmentId);

        /// <summary>
        /// Validate bulk operations permissions
        /// </summary>
        Task<bool> CanPerformBulkOperationsAsync(int userId, List<int> employeeIds);
    }
}