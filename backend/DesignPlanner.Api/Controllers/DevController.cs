using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.Enums;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace DesignPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DevController> _logger;

    public DevController(ApplicationDbContext context, ILogger<DevController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("update-admin-user")]
    public async Task<IActionResult> UpdateAdminUser()
    {
        try
        {
            // Find the user with username "manager"
            var adminUser = await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Username == "manager");

            if (adminUser == null)
            {
                return NotFound("Admin user with username 'manager' not found");
            }

            // Update username from "manager" to "admin"
            adminUser.Username = "admin";
            adminUser.Role = UserRole.Admin; // Ensure role is Admin

            // Update the employee record to change initials from JM to IS
            if (adminUser.Employee != null)
            {
                adminUser.Employee.FirstName = "I";
                adminUser.Employee.LastName = "S";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin user updated successfully: username changed to 'admin', initials changed to 'IS'");

            return Ok(new {
                message = "Admin user updated successfully",
                username = adminUser.Username,
                role = adminUser.Role.ToString(),
                firstName = adminUser.Employee?.FirstName,
                lastName = adminUser.Employee?.LastName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update admin user");
            return StatusCode(500, "Failed to update admin user");
        }
    }

    [HttpGet("debug-users")]
    public async Task<IActionResult> DebugUsers()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Team)
                .Select(u => new {
                    UserId = u.Id,
                    Username = u.Username,
                    UserRole = u.Role.ToString(),
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    EmployeeId = u.Employee != null ? u.Employee.Id : (int?)null,
                    TeamId = u.Employee != null ? u.Employee.TeamId : (int?)null,
                    TeamName = u.Employee != null && u.Employee.Team != null ? u.Employee.Team.Name : null
                })
                .ToListAsync();

            var teams = await _context.Teams
                .Select(t => new {
                    TeamId = t.Id,
                    TeamName = t.Name
                })
                .ToListAsync();

            return Ok(new {
                message = "Database debug info",
                users = users,
                teams = teams,
                totalUsers = users.Count,
                totalTeams = teams.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get debug info");
            return StatusCode(500, "Failed to get debug info");
        }
    }

    [HttpPost("delete-weekend-assignments")]
    public async Task<IActionResult> DeleteWeekendAssignments()
    {
        try
        {
            var weekendAssignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                .Include(a => a.Employee)
                .Where(a => a.IsActive &&
                           (a.AssignedDate.DayOfWeek == DayOfWeek.Saturday ||
                            a.AssignedDate.DayOfWeek == DayOfWeek.Sunday))
                .ToListAsync();

            _logger.LogInformation($"Found {weekendAssignments.Count} weekend assignments to delete");

            foreach (var assignment in weekendAssignments)
            {
                _logger.LogInformation($"Deleting assignment ID {assignment.Id}: {assignment.Task.Title} - {assignment.Task.Project.Name} - {assignment.AssignedDate:yyyy-MM-dd} ({assignment.AssignedDate.DayOfWeek})");
                assignment.IsActive = false; // Soft delete
            }

            var deletedCount = await _context.SaveChangesAsync();

            return Ok(new {
                message = $"Successfully deleted {weekendAssignments.Count} weekend assignments",
                deletedAssignments = weekendAssignments.Select(a => new {
                    assignmentId = a.Id,
                    taskTitle = a.Task.Title,
                    projectName = a.Task.Project.Name,
                    employeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                    assignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
                    dayOfWeek = a.AssignedDate.DayOfWeek.ToString()
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete weekend assignments");
            return StatusCode(500, "Failed to delete weekend assignments");
        }
    }

    [HttpPost("fix-weekend-assignments")]
    public async Task<IActionResult> FixWeekendAssignments()
    {
        try
        {
            // Direct SQL to disable weekend assignments
            var sql = @"
                UPDATE Assignments
                SET IsActive = 0
                WHERE IsActive = 1
                AND (strftime('%w', AssignedDate) = '0' OR strftime('%w', AssignedDate) = '6')";

            var affectedRows = await _context.Database.ExecuteSqlRawAsync(sql);

            _logger.LogInformation($"Disabled {affectedRows} weekend assignments");

            return Ok(new {
                message = $"Successfully disabled {affectedRows} weekend assignments",
                sql = sql
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fix weekend assignments");
            return StatusCode(500, "Failed to fix weekend assignments");
        }
    }

    [HttpGet("debug-assignments")]
    public async Task<IActionResult> DebugAssignments()
    {
        try
        {
            var assignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Team)
                .OrderBy(a => a.AssignedDate)
                .Select(a => new {
                    AssignmentId = a.Id,
                    TaskTitle = a.Task.Title,
                    ProjectName = a.Task.Project.Name,
                    ClientName = a.Task.Project.Client.Name,
                    TaskTypeName = a.Task.TaskType.Name,
                    EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                    TeamName = a.Employee.Team != null ? a.Employee.Team.Name : "No Team",
                    AssignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = a.AssignedDate.DayOfWeek.ToString(),
                    Hours = a.Hours ?? 1,
                    CreatedAt = a.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    IsActive = a.IsActive
                })
                .ToListAsync();

            var summary = new {
                TotalAssignments = assignments.Count,
                TotalHours = assignments.Sum(a => a.Hours),
                UniqueProjects = assignments.Select(a => a.ProjectName).Distinct().Count(),
                UniqueEmployees = assignments.Select(a => a.EmployeeName).Distinct().Count(),
                DateRange = assignments.Any() ? $"{assignments.First().AssignedDate} to {assignments.Last().AssignedDate}" : "No assignments"
            };

            return Ok(new {
                message = "All active assignments in database",
                summary = summary,
                assignments = assignments
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get assignments debug info");
            return StatusCode(500, "Failed to get assignments debug info");
        }
    }

    [HttpGet("debug-all-assignments")]
    public async Task<IActionResult> DebugAllAssignments()
    {
        try
        {
            var assignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Team)
                .OrderBy(a => a.AssignedDate)
                .Select(a => new {
                    AssignmentId = a.Id,
                    TaskTitle = a.Task.Title,
                    ProjectName = a.Task.Project.Name,
                    ClientName = a.Task.Project.Client.Name,
                    TaskTypeName = a.Task.TaskType.Name,
                    EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                    TeamName = a.Employee.Team != null ? a.Employee.Team.Name : "No Team",
                    AssignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = a.AssignedDate.DayOfWeek.ToString(),
                    Hours = a.Hours ?? 1,
                    CreatedAt = a.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                    IsActive = a.IsActive
                })
                .ToListAsync();

            var summary = new {
                TotalAssignments = assignments.Count,
                ActiveAssignments = assignments.Count(a => a.IsActive),
                InactiveAssignments = assignments.Count(a => !a.IsActive),
                TotalHours = assignments.Sum(a => a.Hours),
                ActiveHours = assignments.Where(a => a.IsActive).Sum(a => a.Hours),
                InactiveHours = assignments.Where(a => !a.IsActive).Sum(a => a.Hours),
                UniqueProjects = assignments.Select(a => a.ProjectName).Distinct().Count(),
                UniqueEmployees = assignments.Select(a => a.EmployeeName).Distinct().Count(),
                DateRange = assignments.Any() ? $"{assignments.First().AssignedDate} to {assignments.Last().AssignedDate}" : "No assignments"
            };

            return Ok(new {
                message = "ALL assignments in database (active and inactive)",
                summary = summary,
                assignments = assignments
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all assignments debug info");
            return StatusCode(500, "Failed to get all assignments debug info");
        }
    }

    [HttpPost("delete-weekend-assignments-safe")]
    public async Task<IActionResult> DeleteWeekendAssignmentsSafe()
    {
        try
        {
            // Find only assignments from Saturday (Sept 20) and Sunday (Sept 21) - weekend days
            var weekendAssignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                .Include(a => a.Employee)
                .Where(a => a.AssignedDate.Date == new DateTime(2025, 9, 20) || // Saturday Sept 20, 2025
                           a.AssignedDate.Date == new DateTime(2025, 9, 21))   // Sunday Sept 21, 2025
                .ToListAsync();

            _logger.LogInformation($"Found {weekendAssignments.Count} weekend assignments from Sept 20-21 to delete");

            var assignmentsToShow = weekendAssignments.Select(a => new {
                assignmentId = a.Id,
                taskTitle = a.Task.Title,
                projectName = a.Task.Project.Name,
                employeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                assignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
                dayOfWeek = a.AssignedDate.DayOfWeek.ToString(),
                isActive = a.IsActive
            }).ToList();

            return Ok(new {
                message = $"Found {weekendAssignments.Count} weekend assignments from Sept 20-21 (PREVIEW ONLY - NOT DELETED YET)",
                willDelete = assignmentsToShow,
                note = "Call /delete-weekend-assignments-confirmed to actually delete these"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to preview weekend assignments");
            return StatusCode(500, "Failed to preview weekend assignments");
        }
    }

    [HttpPost("delete-weekend-assignments-confirmed")]
    public async Task<IActionResult> DeleteWeekendAssignmentsConfirmed()
    {
        try
        {
            // Delete only assignments from Saturday (Sept 20) and Sunday (Sept 21)
            var weekendAssignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                .Include(a => a.Employee)
                .Where(a => a.AssignedDate.Date == new DateTime(2025, 9, 20) || // Saturday Sept 20, 2025
                           a.AssignedDate.Date == new DateTime(2025, 9, 21))   // Sunday Sept 21, 2025
                .ToListAsync();

            _logger.LogInformation($"DELETING {weekendAssignments.Count} weekend assignments from Sept 20-21");

            var deletedAssignments = weekendAssignments.Select(a => new {
                assignmentId = a.Id,
                taskTitle = a.Task.Title,
                projectName = a.Task.Project.Name,
                employeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                assignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
                dayOfWeek = a.AssignedDate.DayOfWeek.ToString()
            }).ToList();

            // Actually delete the assignments
            _context.Assignments.RemoveRange(weekendAssignments);
            var deletedCount = await _context.SaveChangesAsync();

            return Ok(new {
                message = $"Successfully DELETED {weekendAssignments.Count} weekend assignments from Sept 20-21",
                deletedAssignments = deletedAssignments,
                deletedCount = deletedCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete weekend assignments");
            return StatusCode(500, "Failed to delete weekend assignments");
        }
    }

    [HttpGet("debug-projects-categories")]
    public async Task<IActionResult> DebugProjectsCategories()
    {
        try
        {
            var projects = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.Category)
                .Select(p => new {
                    ProjectId = p.Id,
                    ProjectName = p.Name,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null
                })
                .ToListAsync();

            var categories = await _context.Categories
                .Select(c => new {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    CategoryColor = c.Color
                })
                .ToListAsync();

            return Ok(new {
                message = "Projects and Categories debug info",
                projects = projects,
                categories = categories,
                totalProjects = projects.Count,
                projectsWithCategories = projects.Count(p => p.CategoryId != null),
                projectsWithoutCategories = projects.Count(p => p.CategoryId == null)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get projects-categories debug info");
            return StatusCode(500, "Failed to get projects-categories debug info");
        }
    }

    [HttpPost("fix-user-passwords")]
    public async Task<IActionResult> FixUserPasswords()
    {
        try
        {
            var users = await _context.Users
                .Where(u => u.Username != "admin")
                .ToListAsync();

            var updatedUsers = new List<object>();

            foreach (var user in users)
            {
                // Hash the password using the same method as AuthService
                var hashedPassword = HashPasswordSHA256("password123");
                user.PasswordHash = hashedPassword;

                updatedUsers.Add(new {
                    userId = user.Id,
                    username = user.Username,
                    passwordChanged = true
                });

                _logger.LogInformation($"Updated password hash for user {user.Username}");
            }

            await _context.SaveChangesAsync();

            return Ok(new {
                message = $"Successfully updated password hashes for {users.Count} users",
                defaultPassword = "password123",
                updatedUsers = updatedUsers,
                note = "All users can now login with 'password123'"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fix user passwords");
            return StatusCode(500, "Failed to fix user passwords");
        }
    }

    private static string HashPasswordSHA256(string password)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    [HttpPost("set-manager-teams")]
    public async Task<IActionResult> SetManagerTeams()
    {
        try
        {
            // Set tcastanha to manage teams 2 (Structural) and 5 (R&D)
            var manager = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == "tcastanha");

            if (manager == null)
            {
                return NotFound("Manager user 'tcastanha' not found");
            }

            manager.ManagedTeamIds = "2,5";
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated manager {Username} to manage teams: {ManagedTeamIds}",
                manager.Username, manager.ManagedTeamIds);

            return Ok(new {
                message = "Manager teams updated successfully",
                username = manager.Username,
                managedTeamIds = manager.ManagedTeamIds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set manager teams");
            return StatusCode(500, "Failed to set manager teams");
        }
    }

    [HttpGet("test-auth")]
    public async Task<IActionResult> TestAuth()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        return Ok(new {
            userId = userId,
            userName = userName,
            userRole = userRole,
            isAuthenticated = User.Identity?.IsAuthenticated,
            claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
        });
    }

    [HttpGet("user-team-management")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserTeamManagement()
    {
        var userTeamManagement = await _context.UserTeamManagements
            .Include(utm => utm.User)
            .Include(utm => utm.Team)
            .Select(utm => new {
                Id = utm.Id,
                UserId = utm.UserId,
                TeamId = utm.TeamId,
                UserName = utm.User.Username,
                TeamName = utm.Team.Name,
                CreatedAt = utm.CreatedAt
            })
            .ToListAsync();

        return Ok(new {
            message = "UserTeamManagement data",
            data = userTeamManagement,
            totalRecords = userTeamManagement.Count
        });
    }

}