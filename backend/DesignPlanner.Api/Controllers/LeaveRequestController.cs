using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;
using System.Security.Claims;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveRequestController : ControllerBase
    {
        private readonly ILeaveService _leaveService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<LeaveRequestController> _logger;

        public LeaveRequestController(
            ILeaveService leaveService, 
            INotificationService notificationService,
            ILogger<LeaveRequestController> logger)
        {
            _leaveService = leaveService;
            _notificationService = notificationService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private int GetEmployeeIdFromUser()
        {
            // Assuming the employee ID is stored in a custom claim or retrieved via service
            var employeeIdClaim = User.FindFirst("EmployeeId")?.Value;
            return int.TryParse(employeeIdClaim, out var employeeId) ? employeeId : 0;
        }

        /// <summary>
        /// Get leave balance for current employee
        /// </summary>
        [HttpGet("balance")]
        public async Task<ActionResult<LeaveBalanceDto>> GetMyLeaveBalance()
        {
            try
            {
                var employeeId = GetEmployeeIdFromUser();
                if (employeeId == 0)
                    return BadRequest("Employee ID not found");

                var balance = await _leaveService.GetEmployeeLeaveBalanceAsync(employeeId);
                return Ok(balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leave balance");
                return StatusCode(500, "An error occurred while retrieving leave balance");
            }
        }

        /// <summary>
        /// Get leave balance for specific employee (managers only)
        /// </summary>
        [HttpGet("balance/{employeeId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<LeaveBalanceDto>> GetEmployeeLeaveBalance(int employeeId)
        {
            try
            {
                var balance = await _leaveService.GetEmployeeLeaveBalanceAsync(employeeId);
                return Ok(balance);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee leave balance for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving leave balance");
            }
        }

        /// <summary>
        /// Calculate leave days for a date range
        /// </summary>
        [HttpPost("calculate-days")]
        public async Task<ActionResult<decimal>> CalculateLeaveDays([FromBody] CalculateLeaveDaysRequest request)
        {
            try
            {
                var days = await _leaveService.CalculateLeaveDaysAsync(
                    request.StartDate, 
                    request.EndDate, 
                    request.IsStartDateAM, 
                    request.IsEndDateAM);
                
                return Ok(days);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating leave days");
                return StatusCode(500, "An error occurred while calculating leave days");
            }
        }

        /// <summary>
        /// Create a new leave request
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<LeaveRequestDto>> CreateLeaveRequest([FromBody] CreateLeaveRequestDto request)
        {
            try
            {
                var employeeId = GetEmployeeIdFromUser();
                if (employeeId == 0)
                    return BadRequest("Employee ID not found");

                var leaveRequest = await _leaveService.CreateLeaveRequestAsync(employeeId, request);
                
                // Send notification for annual leave requests (requires approval)
                if (leaveRequest.LeaveType == LeaveType.AnnualLeave)
                {
                    // Get employee name for notification (this would need to be implemented in service)
                    var employeeName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Employee";
                    await _notificationService.NotifyLeaveRequestSubmittedAsync(
                        leaveRequest.Id,
                        employeeName,
                        leaveRequest.LeaveType.ToString()
                    );
                }
                
                // Convert to DTO for response
                var dto = new LeaveRequestDto
                {
                    Id = leaveRequest.Id,
                    EmployeeId = leaveRequest.EmployeeId,
                    LeaveType = leaveRequest.LeaveType,
                    StartDate = leaveRequest.StartDate,
                    EndDate = leaveRequest.EndDate,
                    IsStartDateAM = leaveRequest.IsStartDateAM,
                    IsEndDateAM = leaveRequest.IsEndDateAM,
                    LeaveDaysRequested = leaveRequest.LeaveDaysRequested,
                    Reason = leaveRequest.Reason,
                    Status = leaveRequest.Status,
                    CreatedAt = leaveRequest.CreatedAt
                };

                return CreatedAtAction(nameof(GetLeaveRequest), new { id = leaveRequest.Id }, dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating leave request");
                return StatusCode(500, "An error occurred while creating the leave request");
            }
        }

        /// <summary>
        /// Get current employee's leave requests
        /// </summary>
        [HttpGet("my-requests")]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetMyLeaveRequests()
        {
            try
            {
                var employeeId = GetEmployeeIdFromUser();
                if (employeeId == 0)
                    return BadRequest("Employee ID not found");

                var requests = await _leaveService.GetEmployeeLeaveRequestsAsync(employeeId);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee leave requests");
                return StatusCode(500, "An error occurred while retrieving leave requests");
            }
        }

        /// <summary>
        /// Get specific leave request
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequestDto>> GetLeaveRequest(int id)
        {
            try
            {
                var employeeId = GetEmployeeIdFromUser();
                var requests = await _leaveService.GetEmployeeLeaveRequestsAsync(employeeId);
                var request = requests.FirstOrDefault(r => r.Id == id);
                
                if (request == null)
                    return NotFound();

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leave request {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the leave request");
            }
        }

        /// <summary>
        /// Get pending leave requests (managers only)
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetPendingLeaveRequests()
        {
            try
            {
                var requests = await _leaveService.GetPendingLeaveRequestsAsync();
                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending leave requests");
                return StatusCode(500, "An error occurred while retrieving pending leave requests");
            }
        }

        /// <summary>
        /// Approve or reject leave request (managers only)
        /// </summary>
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> ApproveLeaveRequest(int id, [FromBody] ApproveLeaveRequestDto approvalDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == 0)
                    return BadRequest("User ID not found");

                approvalDto.LeaveRequestId = id;
                var success = await _leaveService.ApproveLeaveRequestAsync(id, currentUserId, approvalDto);
                
                if (!success)
                    return NotFound("Leave request not found");

                // Send notification to employee about the decision
                // Note: This would need the employee's user ID, which should be retrieved from the leave request
                var managerName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Manager";
                // await _notificationService.NotifyLeaveRequestProcessedAsync(employeeUserId, approvalDto.IsApproved, leaveType, managerName);

                return Ok(new { message = approvalDto.IsApproved ? "Leave request approved" : "Leave request rejected" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving leave request {Id}", id);
                return StatusCode(500, "An error occurred while processing the approval");
            }
        }

        /// <summary>
        /// Get team leave overview for date range (managers only)
        /// </summary>
        [HttpGet("team-overview")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<TeamLeaveOverviewDto>>> GetTeamLeaveOverview([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var overview = await _leaveService.GetTeamLeaveOverviewAsync(startDate, endDate);
                return Ok(overview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team leave overview");
                return StatusCode(500, "An error occurred while retrieving team leave overview");
            }
        }

        /// <summary>
        /// Update employee leave balance (managers only)
        /// </summary>
        [HttpPut("balance/{employeeId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> UpdateEmployeeLeaveBalance(int employeeId, [FromBody] UpdateLeaveBalanceDto updateDto)
        {
            try
            {
                updateDto.EmployeeId = employeeId;
                var success = await _leaveService.UpdateEmployeeLeaveBalanceAsync(updateDto);
                
                if (!success)
                    return NotFound("Employee not found");

                return Ok(new { message = "Leave balance updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating leave balance for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while updating leave balance");
            }
        }

        /// <summary>
        /// Get leave requests for date range (for calendar integration)
        /// </summary>
        [HttpGet("date-range")]
        public async Task<ActionResult<List<LeaveRequestDto>>> GetLeaveRequestsForDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var requests = await _leaveService.GetLeaveRequestsForDateRangeAsync(startDate, endDate);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leave requests for date range");
                return StatusCode(500, "An error occurred while retrieving leave requests");
            }
        }

        /// <summary>
        /// Check if dates have leave conflicts
        /// </summary>
        [HttpPost("check-conflict")]
        public async Task<ActionResult<bool>> CheckLeaveConflict([FromBody] CheckLeaveConflictRequest request)
        {
            try
            {
                var employeeId = GetEmployeeIdFromUser();
                if (employeeId == 0)
                    return BadRequest("Employee ID not found");

                var hasConflict = await _leaveService.HasLeaveConflictAsync(employeeId, request.StartDate, request.EndDate);
                return Ok(hasConflict);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking leave conflict");
                return StatusCode(500, "An error occurred while checking leave conflict");
            }
        }
    }

    // Request DTOs for specific endpoints
    public class CalculateLeaveDaysRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsStartDateAM { get; set; } = true;
        public bool IsEndDateAM { get; set; } = true;
    }

    public class CheckLeaveConflictRequest
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}