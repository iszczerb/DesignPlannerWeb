using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.Enums;

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

}