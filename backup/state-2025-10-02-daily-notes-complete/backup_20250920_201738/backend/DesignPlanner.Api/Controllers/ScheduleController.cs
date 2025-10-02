using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;
using System.Security.Claims;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;
        private readonly ILogger<ScheduleController> _logger;
        private readonly ApplicationDbContext _context;

        public ScheduleController(IScheduleService scheduleService, ILogger<ScheduleController> logger, ApplicationDbContext context)
        {
            _scheduleService = scheduleService;
            _logger = logger;
            _context = context;
        }

        // GET: api/schedule/calendar
        [HttpGet("calendar")]
        public async Task<ActionResult<CalendarViewDto>> GetCalendarView([FromQuery] ScheduleRequestDto request)
        {
            try
            {
                // Role-based access control
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Team members can only see their own schedule unless they're managers
                if (userRole != "Manager" && userRole != "Admin")
                {
                    if (request.EmployeeId != userId && request.EmployeeId != null)
                    {
                        return Forbid("You can only view your own schedule");
                    }
                    request.EmployeeId = userId;
                }

                var calendarView = await _scheduleService.GetCalendarViewAsync(request);
                return Ok(calendarView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving calendar view");
                return StatusCode(500, "An error occurred while retrieving the calendar view");
            }
        }

        // GET: api/schedule/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<CalendarViewDto>> GetEmployeeSchedule(
            int employeeId, 
            [FromQuery] DateTime startDate, 
            [FromQuery] CalendarViewType viewType = CalendarViewType.Week)
        {
            try
            {
                // Role-based access control
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin" && employeeId != userId)
                {
                    return Forbid("You can only view your own schedule");
                }

                var schedule = await _scheduleService.GetEmployeeScheduleAsync(employeeId, startDate, viewType);
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee schedule for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving the employee schedule");
            }
        }

        // GET: api/schedule/assignments
        [HttpGet("assignments")]
        public async Task<ActionResult<List<AssignmentTaskDto>>> GetAssignmentsByDateRange([FromQuery] DateRangeDto dateRange)
        {
            try
            {
                // Role-based access control
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin")
                {
                    if (dateRange.EmployeeId != userId && dateRange.EmployeeId != null)
                    {
                        return Forbid("You can only view your own assignments");
                    }
                    dateRange.EmployeeId = userId;
                }

                var assignments = await _scheduleService.GetAssignmentsByDateRangeAsync(dateRange);
                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assignments");
                return StatusCode(500, "An error occurred while retrieving assignments");
            }
        }

        // GET: api/schedule/assignments/{assignmentId}
        [HttpGet("assignments/{assignmentId}")]
        public async Task<ActionResult<AssignmentTaskDto>> GetAssignmentById(int assignmentId)
        {
            try
            {
                var assignment = await _scheduleService.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                {
                    return NotFound("Assignment not found");
                }

                // Role-based access control - users can only see their own assignments
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin")
                {
                    // Would need to get employee ID from assignment - for now allowing all
                    // In a real implementation, you'd check if the assignment belongs to the user
                }

                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "An error occurred while retrieving the assignment");
            }
        }

        // POST: api/schedule/assignments
        [HttpPost("assignments")]
        [Authorize] // Allow any authenticated user to create assignments
        public async Task<ActionResult<AssignmentTaskDto>> CreateAssignment([FromBody] CreateAssignmentDto createDto)
        {
            _logger.LogInformation($"📥 CreateAssignment called with: TaskId={createDto?.TaskId}, EmployeeId={createDto?.EmployeeId}, ProjectId={createDto?.ProjectId}, TaskTypeId={createDto?.TaskTypeId}, AssignedDate={createDto?.AssignedDate}");

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("❌ ModelState validation failed: {Errors}", string.Join(", ", ModelState.SelectMany(x => x.Value.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))));
                    return BadRequest(ModelState);
                }

                var assignment = await _scheduleService.CreateAssignmentAsync(createDto);
                _logger.LogInformation($"✅ Assignment created and returning: TaskTitle={assignment.TaskTitle}, ProjectName={assignment.ProjectName}, ClientCode={assignment.ClientCode}, ClientColor={assignment.ClientColor}");
                return CreatedAtAction(nameof(GetAssignmentById), new { assignmentId = assignment.AssignmentId }, assignment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assignment");
                return StatusCode(500, "An error occurred while creating the assignment");
            }
        }

        // PUT: api/schedule/assignments
        [HttpPut("assignments")]
        [Authorize] // Allow any authenticated user to update assignments
        public async Task<ActionResult<AssignmentTaskDto>> UpdateAssignment([FromBody] UpdateAssignmentDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var assignment = await _scheduleService.UpdateAssignmentAsync(updateDto);
                return Ok(assignment);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating assignment {AssignmentId}", updateDto.AssignmentId);
                return StatusCode(500, "An error occurred while updating the assignment");
            }
        }

        // DELETE: api/schedule/assignments/{assignmentId}
        [HttpDelete("assignments/{assignmentId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAssignment(int assignmentId)
        {
            try
            {
                var result = await _scheduleService.DeleteAssignmentAsync(assignmentId);
                if (!result)
                {
                    return NotFound("Assignment not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "An error occurred while deleting the assignment");
            }
        }

        // POST: api/schedule/assignments/bulk
        [HttpPost("assignments/bulk")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<AssignmentTaskDto>>> CreateBulkAssignments([FromBody] BulkAssignmentDto bulkDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var assignments = await _scheduleService.CreateBulkAssignmentsAsync(bulkDto);
                return Ok(assignments);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bulk assignments");
                return StatusCode(500, "An error occurred while creating bulk assignments");
            }
        }

        // PUT: api/schedule/assignments/bulk
        [HttpPut("assignments/bulk")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<AssignmentTaskDto>>> UpdateBulkAssignments([FromBody] BulkUpdateAssignmentDto bulkUpdateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var assignments = await _scheduleService.BulkUpdateAssignmentsAsync(bulkUpdateDto);
                return Ok(assignments);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bulk assignments");
                return StatusCode(500, "An error occurred while updating bulk assignments");
            }
        }

        // GET: api/schedule/capacity/check
        [HttpGet("capacity/check")]
        public async Task<ActionResult<CapacityResponseDto>> CheckCapacity([FromQuery] CapacityCheckDto capacityCheck)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var capacity = await _scheduleService.CheckCapacityAsync(capacityCheck);
                return Ok(capacity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking capacity");
                return StatusCode(500, "An error occurred while checking capacity");
            }
        }

        // GET: api/schedule/capacity/employee/{employeeId}
        [HttpGet("capacity/employee/{employeeId}")]
        public async Task<ActionResult<List<CapacityResponseDto>>> GetEmployeeCapacity(
            int employeeId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                // Role-based access control
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin" && employeeId != userId)
                {
                    return Forbid("You can only view your own capacity");
                }

                var capacity = await _scheduleService.GetCapacityForDateRangeAsync(employeeId, startDate, endDate);
                return Ok(capacity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee capacity for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving employee capacity");
            }
        }

        // GET: api/schedule/availability/{employeeId}
        [HttpGet("availability/{employeeId}")]
        public async Task<ActionResult<Dictionary<DateTime, Dictionary<Slot, bool>>>> GetAvailabilityMatrix(
            int employeeId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                // Role-based access control
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin" && employeeId != userId)
                {
                    return Forbid("You can only view your own availability");
                }

                var availability = await _scheduleService.GetAvailabilityMatrixAsync(employeeId, startDate, endDate);
                return Ok(availability);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving availability matrix for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving availability matrix");
            }
        }

        // POST: api/schedule/validate
        [HttpPost("validate")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<object>> ValidateAssignment([FromBody] CreateAssignmentDto assignment)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var isValid = await _scheduleService.ValidateAssignmentAsync(assignment);
                var conflicts = new List<string>();

                if (!isValid)
                {
                    conflicts = await _scheduleService.GetAssignmentConflictsAsync(assignment);
                }

                return Ok(new
                {
                    isValid,
                    conflicts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating assignment");
                return StatusCode(500, "An error occurred while validating the assignment");
            }
        }

        // GET: api/schedule/workload
        [HttpGet("workload")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<Dictionary<int, int>>> GetEmployeeWorkload(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var workload = await _scheduleService.GetEmployeeWorkloadAsync(startDate, endDate);
                return Ok(workload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee workload");
                return StatusCode(500, "An error occurred while retrieving employee workload");
            }
        }

        // GET: api/schedule/utilization
        [HttpGet("utilization")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<Dictionary<DateTime, int>>> GetDailyCapacityUtilization(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var utilization = await _scheduleService.GetDailyCapacityUtilizationAsync(startDate, endDate);
                return Ok(utilization);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving capacity utilization");
                return StatusCode(500, "An error occurred while retrieving capacity utilization");
            }
        }

        // GET: api/schedule/overdue
        [HttpGet("overdue")]
        public async Task<ActionResult<List<AssignmentTaskDto>>> GetOverdueAssignments()
        {
            try
            {
                var overdue = await _scheduleService.GetOverdueAssignmentsAsync();
                
                // Role-based filtering for non-managers
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin")
                {
                    // Filter to only show user's own overdue assignments
                    // This would need employee lookup in real implementation
                    overdue = overdue; // For now, showing all
                }

                return Ok(overdue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overdue assignments");
                return StatusCode(500, "An error occurred while retrieving overdue assignments");
            }
        }

        // GET: api/schedule/deadlines
        [HttpGet("deadlines")]
        public async Task<ActionResult<List<AssignmentTaskDto>>> GetUpcomingDeadlines([FromQuery] int days = 7)
        {
            try
            {
                var deadlines = await _scheduleService.GetUpcomingDeadlinesAsync(days);
                
                // Role-based filtering for non-managers
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (userRole != "Manager" && userRole != "Admin")
                {
                    // Filter to only show user's own upcoming deadlines
                    // This would need employee lookup in real implementation
                    deadlines = deadlines; // For now, showing all
                }

                return Ok(deadlines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming deadlines");
                return StatusCode(500, "An error occurred while retrieving upcoming deadlines");
            }
        }

        // GET: api/schedule/teams
        [HttpGet("teams")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<object>>> GetManagerTeams()
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Get teams that the current user manages
                var managedTeams = await _scheduleService.GetManagerTeamsAsync(userId);
                
                return Ok(managedTeams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving manager teams");
                return StatusCode(500, "An error occurred while retrieving manager teams");
            }
        }

        // GET: api/schedule/teams/all
        [HttpGet("teams/all")]
        [Authorize] // Temporarily simplified - any authenticated user
        public async Task<ActionResult<List<object>>> GetAllTeams()
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Get all teams with their managed status for current user
                var allTeams = await _scheduleService.GetAllTeamsWithManagedStatusAsync(userId);
                
                return Ok(allTeams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all teams");
                return StatusCode(500, "An error occurred while retrieving all teams");
            }
        }

        // GET: api/schedule/team/{teamId}/calendar
        [HttpGet("team/{teamId}/calendar")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<CalendarViewDto>> GetTeamCalendarView(int teamId, [FromQuery] ScheduleRequestDto request)
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Check if user has permission to view this team
                var hasPermission = await _scheduleService.UserCanViewTeamAsync(userId, teamId);
                if (!hasPermission && userRole != "Admin")
                {
                    return Forbid("You don't have permission to view this team");
                }

                // Get calendar view for specific team
                request.TeamId = teamId;
                var calendarView = await _scheduleService.GetTeamCalendarViewAsync(request);
                
                return Ok(calendarView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team calendar view for team {TeamId}", teamId);
                return StatusCode(500, "An error occurred while retrieving team calendar view");
            }
        }

        // GET: api/schedule/calendar/global
        [HttpGet("calendar/global")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<object>> GetGlobalCalendarView([FromQuery] ScheduleRequestDto request)
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Get global view with all teams and their managed status
                var globalView = await _scheduleService.GetGlobalCalendarViewAsync(userId, request);
                
                return Ok(globalView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving global calendar view");
                return StatusCode(500, "An error occurred while retrieving global calendar view");
            }
        }

        // POST: api/schedule/fix-manager-role
        [HttpPost("fix-manager-role")]
        public async Task<ActionResult> FixManagerRole()
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "manager");
                if (user == null)
                {
                    return NotFound("Manager user not found");
                }

                var oldRole = user.Role;
                user.Role = UserRole.Manager; // Set to correct Manager role (2)
                await _context.SaveChangesAsync();

                _logger.LogInformation("Manager role updated successfully from {OldRole} to {NewRole}",
                    oldRole, UserRole.Manager);

                return Ok(new {
                    message = "Manager role updated successfully",
                    oldRole = $"{oldRole} ({(int)oldRole})",
                    newRole = $"Manager ({(int)UserRole.Manager})"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fixing manager role");
                return StatusCode(500, "An error occurred while fixing manager role");
            }
        }

        // POST: api/schedule/fix-teams
        [HttpPost("fix-teams")]
        public async Task<ActionResult> FixTeams()
        {
            try
            {
                _logger.LogInformation("Starting team fix process...");

                // Get existing teams
                var existingTeams = await _context.Teams.ToListAsync();
                _logger.LogInformation("Found {Count} existing teams: {Teams}",
                    existingTeams.Count,
                    string.Join(", ", existingTeams.Select(t => t.Name)));

                // Remove existing teams
                if (existingTeams.Any())
                {
                    _context.Teams.RemoveRange(existingTeams);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Removed existing teams");
                }

                // Create correct teams
                var correctTeams = new List<DesignPlanner.Core.Entities.Team>
                {
                    new DesignPlanner.Core.Entities.Team
                    {
                        Id = 1,
                        Name = "Structural",
                        Description = "Structural engineering team",
                        Code = "STR",
                        IsActive = true,
                        CreatedAt = new DateTime(2025, 1, 1)
                    },
                    new DesignPlanner.Core.Entities.Team
                    {
                        Id = 2,
                        Name = "Non-Structural",
                        Description = "Non-structural engineering team",
                        Code = "NST",
                        IsActive = true,
                        CreatedAt = new DateTime(2025, 1, 1)
                    },
                    new DesignPlanner.Core.Entities.Team
                    {
                        Id = 3,
                        Name = "BIM",
                        Description = "Building Information Modeling team",
                        Code = "BIM",
                        IsActive = true,
                        CreatedAt = new DateTime(2025, 1, 1)
                    },
                    new DesignPlanner.Core.Entities.Team
                    {
                        Id = 4,
                        Name = "R&D",
                        Description = "Research and Development team",
                        Code = "RND",
                        IsActive = true,
                        CreatedAt = new DateTime(2025, 1, 1)
                    }
                };

                _context.Teams.AddRange(correctTeams);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created correct teams: {Teams}",
                    string.Join(", ", correctTeams.Select(t => t.Name)));

                return Ok(new {
                    message = "Teams fixed successfully",
                    teamsCreated = correctTeams.Select(t => new { t.Id, t.Name, t.Code }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fixing teams");
                return StatusCode(500, "An error occurred while fixing teams: " + ex.Message);
            }
        }
    }
}