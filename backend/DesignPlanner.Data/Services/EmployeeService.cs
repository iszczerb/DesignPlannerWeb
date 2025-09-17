using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;

        public EmployeeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto?> CreateEmployeeAsync(CreateEmployeeRequestDto request, int createdByUserId)
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                throw new ArgumentException("Username is already taken");
            }

            // Create user
            var user = new User
            {
                Username = request.Username,
                PasswordHash = HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create employee with required team
            var employee = new Employee
            {
                UserId = user.Id,
                TeamId = request.TeamId,
                EmployeeId = request.EmployeeId,
                Position = request.Position,
                PhoneNumber = request.PhoneNumber,
                TotalAnnualLeaveDays = 25, // Default
                UsedLeaveDays = 0,
                CreatedAt = DateTime.UtcNow
                };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            // Reload user with employee data
            user = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .FirstAsync(u => u.Id == user.Id);

            return MapToUserDto(user);
        }

        public async Task<UserDto?> UpdateEmployeeAsync(int employeeId, UpdateEmployeeRequestDto request, int updatedByUserId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                throw new ArgumentException("Employee not found");


            // Update user
            employee.User.FirstName = request.FirstName;
            employee.User.LastName = request.LastName;
            employee.User.Role = request.Role;
            // employee.User.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration

            // Update employee
            employee.TeamId = request.TeamId;
            
            employee.EmployeeId = request.EmployeeId ?? employee.EmployeeId;
            employee.Position = request.Position;
            
            // employee.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration

            await _context.SaveChangesAsync();

            // Reload with full data
            var updatedUser = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .FirstAsync(u => u.Id == employee.UserId);

            return MapToUserDto(updatedUser);
        }

        public async Task<bool> DeleteEmployeeAsync(int employeeId, int deletedByUserId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                return false;

            // Soft delete - deactivate user only (all employees in DB are active)
            employee.User.IsActive = false;
            // employee.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration
            // employee.User.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> GetEmployeeByIdAsync(int employeeId, int requestingUserId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Team)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                return null;

            return MapToUserDto(employee.User);
        }

        public async Task<EmployeeListResponseDto> GetEmployeesAsync(EmployeeQueryDto query, int requestingUserId)
        {
            var queryable = _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .Where(u => u.Employee != null)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(u =>
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    u.Username.ToLower().Contains(searchTerm) ||
                    (u.Employee!.EmployeeId != null && u.Employee.EmployeeId.ToLower().Contains(searchTerm)));
            }

            if (query.Role.HasValue)
            {
                queryable = queryable.Where(u => u.Role == query.Role.Value);
            }

            if (query.TeamId.HasValue)
            {
                queryable = queryable.Where(u => u.Employee!.TeamId == query.TeamId.Value);
            }

            // Note: All employees in database are active by definition

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "firstname" => query.SortDirection.ToLower() == "desc" 
                    ? queryable.OrderByDescending(u => u.FirstName) 
                    : queryable.OrderBy(u => u.FirstName),
                "lastname" => query.SortDirection.ToLower() == "desc" 
                    ? queryable.OrderByDescending(u => u.LastName) 
                    : queryable.OrderBy(u => u.LastName),
                "username" => query.SortDirection.ToLower() == "desc" 
                    ? queryable.OrderByDescending(u => u.Username) 
                    : queryable.OrderBy(u => u.Username),
                "role" => query.SortDirection.ToLower() == "desc" 
                    ? queryable.OrderByDescending(u => u.Role) 
                    : queryable.OrderBy(u => u.Role),
                "createdat" => query.SortDirection.ToLower() == "desc" 
                    ? queryable.OrderByDescending(u => u.CreatedAt) 
                    : queryable.OrderBy(u => u.CreatedAt),
                _ => queryable.OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var employees = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(u => new EmployeeListItemDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    EmployeeId = u.Employee!.EmployeeId,
                    Position = u.Employee.Position,
                    TeamName = u.Employee.Team != null ? u.Employee.Team.Name : null
                })
                .ToListAsync();

            return new EmployeeListResponseDto
            {
                Employees = employees,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        public async Task<bool> ResetEmployeePasswordAsync(int employeeId, string newPassword, int resetByUserId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                return false;

            employee.User.PasswordHash = HashPassword(newPassword);
            // employee.User.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleEmployeeStatusAsync(int employeeId, bool isActive, int updatedByUserId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                return false;

            employee.User.IsActive = isActive;
            // Note: All employees in database are active by definition
            // employee.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration
            // employee.User.UpdatedAt = DateTime.UtcNow; // Disabled to prevent data regeneration

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CanManageEmployee(int managerUserId, int employeeUserId)
        {
            var manager = await _context.Users.FirstOrDefaultAsync(u => u.Id == managerUserId);
            if (manager == null)
                return false;

            // Admins can manage anyone
            if (manager.Role == UserRole.Admin)
                return true;

            // Managers can manage team members (for now, allowing all team members)
            if (manager.Role == UserRole.Manager)
                return true;

            return false;
        }

        public async Task<List<TeamDto>> GetAvailableTeamsAsync(int requestingUserId)
        {
            var teams = await _context.Teams
                .Where(t => t.IsActive)
                .Select(t => new TeamDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description
                })
                .ToListAsync();

            return teams;
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Employee = user.Employee != null ? new EmployeeDto
                {
                    Id = user.Employee.Id,
                    EmployeeId = user.Employee.EmployeeId,
                    Position = user.Employee.Position,
                    Team = user.Employee.Team != null ? new TeamDto
                    {
                        Id = user.Employee.Team.Id,
                        Name = user.Employee.Team.Name,
                        Description = user.Employee.Team.Description
                    } : null
                } : null
            };
        }
    }
}