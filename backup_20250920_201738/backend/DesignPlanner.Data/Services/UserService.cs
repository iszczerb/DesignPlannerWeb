using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;
using DesignPlanner.Data.Context;
using BCrypt.Net;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for user management operations
    /// </summary>
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new user with employee record
        /// </summary>
        /// <param name="request">The user creation request</param>
        /// <param name="createdByUserId">ID of the user creating the user</param>
        /// <returns>The created user DTO</returns>
        public async Task<UserResponseDto?> CreateUserAsync(CreateUserRequestDto request, int createdByUserId)
        {
            // Check if username already exists
            if (await IsUsernameExistsAsync(request.Username))
            {
                throw new ArgumentException($"Username '{request.Username}' already exists");
            }

            // Verify team exists (optional for Admin users)
            Team? team = null;
            if (request.TeamId > 0)
            {
                team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId);
                if (team == null)
                {
                    throw new ArgumentException($"Team with ID {request.TeamId} not found");
                }
            }
            else if (request.Role != Core.Enums.UserRole.Admin)
            {
                throw new ArgumentException("Team is required for non-admin users");
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Generate employee ID - find highest existing number and increment
            var existingEmployeeIds = await _context.Employees
                .Where(e => e.EmployeeId.StartsWith("EMP"))
                .Select(e => e.EmployeeId)
                .ToListAsync();

            var maxNumber = 0;
            foreach (var empId in existingEmployeeIds)
            {
                if (empId.Length >= 6 && int.TryParse(empId.Substring(3), out var number))
                {
                    maxNumber = Math.Max(maxNumber, number);
                }
            }

            var employeeId = $"EMP{maxNumber + 1:D3}";

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create user
                var user = new User
                {
                    Username = request.Username,
                    PasswordHash = passwordHash,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Role = request.Role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    ManagedTeamIds = request.ManagedTeamIds != null && request.ManagedTeamIds.Any()
                        ? string.Join(",", request.ManagedTeamIds)
                        : null
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create employee
                var employee = new Employee
                {
                    UserId = user.Id,
                    TeamId = request.TeamId > 0 ? request.TeamId : null,
                    EmployeeId = employeeId,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Position = request.Position,
                    PhoneNumber = request.PhoneNumber,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                // Add employee skills if provided
                if (request.SkillIds?.Any() == true)
                {
                    var employeeSkills = request.SkillIds.Select(skillId => new EmployeeSkill
                    {
                        EmployeeId = employee.Id,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();

                    _context.EmployeeSkills.AddRange(employeeSkills);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return await GetUserByIdAsync(user.Id, createdByUserId);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Updates an existing user and employee record
        /// </summary>
        /// <param name="userId">ID of the user to update</param>
        /// <param name="request">The user update request</param>
        /// <param name="updatedByUserId">ID of the user updating the user</param>
        /// <returns>The updated user DTO</returns>
        public async Task<UserResponseDto?> UpdateUserAsync(int userId, UpdateUserRequestDto request, int updatedByUserId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new ArgumentException("User not found");

            // Check if username already exists (excluding current user)
            if (await IsUsernameExistsAsync(request.Username, userId))
            {
                throw new ArgumentException($"Username '{request.Username}' already exists");
            }

            // Verify team exists (optional for Admin users)
            Team? team = null;
            if (request.TeamId > 0)
            {
                team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId);
                if (team == null)
                {
                    throw new ArgumentException($"Team with ID {request.TeamId} not found");
                }
            }
            else if (request.Role != Core.Enums.UserRole.Admin)
            {
                throw new ArgumentException("Team is required for non-admin users");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update user
                user.Username = request.Username;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.Role = request.Role;
                user.IsActive = request.IsActive;
                user.UpdatedAt = DateTime.UtcNow;
                user.ManagedTeamIds = request.ManagedTeamIds != null && request.ManagedTeamIds.Any()
                    ? string.Join(",", request.ManagedTeamIds)
                    : null;

                // Update employee
                if (user.Employee != null)
                {
                    user.Employee.TeamId = request.TeamId > 0 ? request.TeamId : (int?)null;
                    user.Employee.FirstName = request.FirstName;
                    user.Employee.LastName = request.LastName;
                    user.Employee.Position = request.Position;
                    user.Employee.PhoneNumber = request.PhoneNumber;
                    user.Employee.UpdatedAt = DateTime.UtcNow;

                    // Update employee skills
                    // Remove existing skills
                    var existingSkills = user.Employee.Skills.ToList();
                    _context.EmployeeSkills.RemoveRange(existingSkills);

                    // Add new skills
                    if (request.SkillIds?.Any() == true)
                    {
                        var employeeSkills = request.SkillIds.Select(skillId => new EmployeeSkill
                        {
                            EmployeeId = user.Employee.Id,
                            SkillId = skillId,
                            CreatedAt = DateTime.UtcNow
                        }).ToList();

                        _context.EmployeeSkills.AddRange(employeeSkills);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await GetUserByIdAsync(userId, updatedByUserId);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Deletes a user permanently (also removes employee record)
        /// </summary>
        /// <param name="userId">ID of the user to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the user</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteUserAsync(int userId, int deletedByUserId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return false;

            // Check if user has assignments, leave requests, etc.
            if (user.Employee != null)
            {
                var hasAssignments = await _context.Assignments
                    .AnyAsync(a => a.EmployeeId == user.Employee.Id);

                var hasLeaveRequests = await _context.LeaveRequests
                    .AnyAsync(lr => lr.EmployeeId == user.Employee.Id);

                if (hasAssignments || hasLeaveRequests)
                {
                    throw new InvalidOperationException("Cannot delete user with existing assignments or leave requests. Please reassign or remove them first.");
                }
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Remove employee skills first
                if (user.Employee?.Skills?.Any() == true)
                {
                    _context.EmployeeSkills.RemoveRange(user.Employee.Skills);
                }

                // Remove employee
                if (user.Employee != null)
                {
                    _context.Employees.Remove(user.Employee);
                }

                // Remove user
                _context.Users.Remove(user);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Gets a user by ID with employee information
        /// </summary>
        /// <param name="userId">ID of the user to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the user</param>
        /// <returns>The user DTO if found</returns>
        public async Task<UserResponseDto?> GetUserByIdAsync(int userId, int requestingUserId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Team)
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .ThenInclude(es => es.Skill)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user != null ? MapToUserResponseDto(user) : null;
        }

        /// <summary>
        /// Gets a paginated list of users with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>Paginated user list response</returns>
        public async Task<UserListResponseDto> GetUsersAsync(UserQueryDto query, int requestingUserId)
        {
            var queryable = _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Team)
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .ThenInclude(es => es.Skill)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(u =>
                    u.Username.ToLower().Contains(searchTerm) ||
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm) ||
                    (u.Employee != null && u.Employee.Position != null && u.Employee.Position.ToLower().Contains(searchTerm)));
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(u => u.IsActive == query.IsActive.Value);
            }

            if (query.Role.HasValue)
            {
                queryable = queryable.Where(u => u.Role == query.Role.Value);
            }

            if (query.TeamId.HasValue)
            {
                queryable = queryable.Where(u => u.Employee != null && u.Employee.TeamId == query.TeamId.Value);
            }

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
                _ => queryable.OrderBy(u => u.FirstName)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var userEntities = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var users = userEntities.Select(u => MapToUserResponseDto(u)).ToList();

            return new UserListResponseDto
            {
                Users = users,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Gets all active users for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of active user DTOs</returns>
        public async Task<List<UserResponseDto>> GetActiveUsersAsync(int requestingUserId)
        {
            var userEntities = await _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Team)
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .ThenInclude(es => es.Skill)
                .Where(u => u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            var users = userEntities.Select(u => MapToUserResponseDto(u)).ToList();
            return users;
        }

        /// <summary>
        /// Checks if a username is already in use
        /// </summary>
        /// <param name="username">The username to check</param>
        /// <param name="excludeUserId">Optional user ID to exclude from the check (for updates)</param>
        /// <returns>True if the username is already in use</returns>
        public async Task<bool> IsUsernameExistsAsync(string username, int? excludeUserId = null)
        {
            var query = _context.Users.Where(u => u.Username.ToLower() == username.ToLower());

            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.Id != excludeUserId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Activates or deactivates a user
        /// </summary>
        /// <param name="userId">ID of the user to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user making the change</param>
        /// <returns>True if successful</returns>
        public async Task<bool> ToggleUserStatusAsync(int userId, bool isActive, int updatedByUserId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Changes a user's password
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="newPassword">New password</param>
        /// <param name="updatedByUserId">ID of the user making the change</param>
        /// <returns>True if successful</returns>
        public async Task<bool> ChangePasswordAsync(int userId, string newPassword, int updatedByUserId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Gets users by team ID
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of users in the team</returns>
        public async Task<List<UserResponseDto>> GetUsersByTeamAsync(int teamId, int requestingUserId)
        {
            var userEntities = await _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Team)
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .ThenInclude(es => es.Skill)
                .Where(u => u.Employee != null && u.Employee.TeamId == teamId)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            var users = userEntities.Select(u => MapToUserResponseDto(u)).ToList();
            return users;
        }

        /// <summary>
        /// Gets users by role
        /// </summary>
        /// <param name="role">User role</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of users with the specified role</returns>
        public async Task<List<UserResponseDto>> GetUsersByRoleAsync(UserRole role, int requestingUserId)
        {
            var queryable = _context.Users
                .Include(u => u.Employee)
                .ThenInclude(e => e.Team)
                .Include(u => u.Employee)
                .ThenInclude(e => e.Skills)
                .ThenInclude(es => es.Skill)
                .Where(u => u.Role == role)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName);

            var userEntities = await queryable.ToListAsync();
            var users = userEntities.Select(u => MapToUserResponseDto(u)).ToList();

            return users;
        }

        /// <summary>
        /// Maps a User entity to UserResponseDto
        /// </summary>
        /// <param name="user">The user entity</param>
        /// <returns>The user response DTO</returns>
        private UserResponseDto MapToUserResponseDto(User user)
        {
            // Get all teams the user belongs to (primary + managed)
            var allTeamIds = new List<int>();

            // Add primary team
            if (user.Employee?.TeamId != null)
            {
                allTeamIds.Add(user.Employee.TeamId.Value);
            }

            // Add managed teams
            if (!string.IsNullOrEmpty(user.ManagedTeamIds))
            {
                var managedIds = user.ManagedTeamIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(id => int.TryParse(id.Trim(), out var teamId) ? teamId : 0)
                    .Where(id => id > 0)
                    .ToList();
                allTeamIds.AddRange(managedIds);
            }

            // Remove duplicates and get unique team IDs
            allTeamIds = allTeamIds.Distinct().ToList();

            // Fetch all teams for this user
            var userTeams = new List<UserTeamDto>();
            if (allTeamIds.Any())
            {
                userTeams = _context.Teams
                    .Where(t => allTeamIds.Contains(t.Id))
                    .Select(t => new UserTeamDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        Code = t.Code
                    })
                    .ToList();
            }

            return new UserResponseDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Employee = user.Employee != null ? new UserEmployeeDto
                {
                    Id = user.Employee.Id,
                    EmployeeId = user.Employee.EmployeeId,
                    Position = user.Employee.Position,
                    PhoneNumber = user.Employee.PhoneNumber,
                    Team = user.Employee.Team != null ? new UserTeamDto
                    {
                        Id = user.Employee.Team.Id,
                        Name = user.Employee.Team.Name,
                        Code = user.Employee.Team.Code
                    } : null,
                    Teams = userTeams,
                    Skills = user.Employee.Skills?.Select(es => new UserSkillDto
                    {
                        Id = es.Skill.Id,
                        Name = es.Skill.Name,
                        Category = es.Skill.Category
                    }).ToList() ?? new List<UserSkillDto>()
                } : null,
                ManagedTeamIds = !string.IsNullOrEmpty(user.ManagedTeamIds)
                    ? user.ManagedTeamIds.Split(',').Select(int.Parse).ToList()
                    : null
            };
        }
    }
}