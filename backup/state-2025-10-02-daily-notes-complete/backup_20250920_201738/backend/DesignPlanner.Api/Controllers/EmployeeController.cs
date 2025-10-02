using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.DTOs;
using System.Security.Claims;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager")]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeeController> _logger;

        public EmployeeController(IEmployeeService employeeService, ILogger<EmployeeController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateEmployee([FromBody] CreateEmployeeRequestDto request)
        {
            try
            {
                _logger.LogInformation("🔍 Received CreateEmployee request: Username={Username}, FirstName={FirstName}, LastName={LastName}, TeamId={TeamId}",
                    request.Username, request.FirstName, request.LastName, request.TeamId);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var employee = await _employeeService.CreateEmployeeAsync(request, userId.Value);
                if (employee == null)
                {
                    return BadRequest(new { message = "Employee creation failed" });
                }

                return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, new { message = "An error occurred while creating the employee" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetEmployee(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var employee = await _employeeService.GetEmployeeByIdAsync(id, userId.Value);
                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(employee);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee with ID {EmployeeId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the employee" });
            }
        }

        [HttpGet]
        public async Task<ActionResult<EmployeeListResponseDto>> GetEmployees([FromQuery] EmployeeQueryDto query)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var employees = await _employeeService.GetEmployeesAsync(query, userId.Value);
                return Ok(employees);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employees");
                return StatusCode(500, new { message = "An error occurred while retrieving employees" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateEmployee(int id, [FromBody] UpdateEmployeeRequestDto request)
        {
            _logger.LogInformation("🔍 UpdateEmployee called with id: {Id}, request: {@Request}", id, request);
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var employee = await _employeeService.UpdateEmployeeAsync(id, request, userId.Value);
                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(employee);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee with ID {EmployeeId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the employee" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEmployee(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var success = await _employeeService.DeleteEmployeeAsync(id, userId.Value);
                if (!success)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(new { message = "Employee deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee with ID {EmployeeId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the employee" });
            }
        }

        [HttpPost("{id}/reset-password")]
        public async Task<ActionResult> ResetEmployeePassword(int id, [FromBody] ResetPasswordRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var success = await _employeeService.ResetEmployeePasswordAsync(id, request.NewPassword, userId.Value);
                if (!success)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(new { message = "Password reset successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for employee with ID {EmployeeId}", id);
                return StatusCode(500, new { message = "An error occurred while resetting the password" });
            }
        }

        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult> ToggleEmployeeStatus(int id, [FromBody] ToggleStatusRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var success = await _employeeService.ToggleEmployeeStatusAsync(id, request.IsActive, userId.Value);
                if (!success)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                return Ok(new { message = $"Employee {(request.IsActive ? "activated" : "deactivated")} successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling status for employee with ID {EmployeeId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the employee status" });
            }
        }

        [HttpGet("teams")]
        public async Task<ActionResult<List<TeamDto>>> GetAvailableTeams()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var teams = await _employeeService.GetAvailableTeamsAsync(userId.Value);
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available teams");
                return StatusCode(500, new { message = "An error occurred while retrieving teams" });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(userIdClaim) ? null : int.Parse(userIdClaim);
        }
    }

    public class ToggleStatusRequestDto
    {
        public bool IsActive { get; set; }
    }
}