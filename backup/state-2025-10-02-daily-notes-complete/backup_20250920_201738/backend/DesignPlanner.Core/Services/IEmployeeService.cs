using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    public interface IEmployeeService
    {
        Task<UserDto?> CreateEmployeeAsync(CreateEmployeeRequestDto request, int createdByUserId);
        Task<UserDto?> UpdateEmployeeAsync(int employeeId, UpdateEmployeeRequestDto request, int updatedByUserId);
        Task<bool> DeleteEmployeeAsync(int employeeId, int deletedByUserId);
        Task<UserDto?> GetEmployeeByIdAsync(int employeeId, int requestingUserId);
        Task<EmployeeListResponseDto> GetEmployeesAsync(EmployeeQueryDto query, int requestingUserId);
        Task<bool> ResetEmployeePasswordAsync(int employeeId, string newPassword, int resetByUserId);
        Task<bool> ToggleEmployeeStatusAsync(int employeeId, bool isActive, int updatedByUserId);
        Task<bool> CanManageEmployee(int managerUserId, int employeeUserId);
        Task<List<TeamDto>> GetAvailableTeamsAsync(int requestingUserId);
    }
}