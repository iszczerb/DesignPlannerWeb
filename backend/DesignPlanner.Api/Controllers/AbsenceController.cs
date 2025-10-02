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
    public class AbsenceController : ControllerBase
    {
        private readonly IAbsenceService _absenceService;

        public AbsenceController(IAbsenceService absenceService)
        {
            _absenceService = absenceService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                throw new UnauthorizedAccessException("Invalid user ID in token");
            return userId;
        }

        // GET: api/absence/overview
        [HttpGet("overview")]
        public async Task<ActionResult<AbsenceOverviewDto>> GetAbsenceOverview()
        {
            try
            {
                var userId = GetUserId();
                var overview = await _absenceService.GetAbsenceOverviewAsync(userId);
                return Ok(overview);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving absence overview: {ex.Message}");
            }
        }

        // GET: api/absence/overview/{employeeId}
        [HttpGet("overview/{employeeId}")]
        public async Task<ActionResult<AbsenceOverviewDto>> GetEmployeeAbsenceOverview(int employeeId)
        {
            try
            {
                var userId = GetUserId();
                var overview = await _absenceService.GetEmployeeAbsenceOverviewAsync(userId, employeeId);
                return Ok(overview);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving employee absence overview: {ex.Message}");
            }
        }

        // GET: api/absence/allocations
        [HttpGet("allocations")]
        public async Task<ActionResult<List<AbsenceAllocationDto>>> GetTeamAllocations([FromQuery] int? teamId = null)
        {
            try
            {
                var userId = GetUserId();
                var allocations = await _absenceService.GetTeamAllocationsAsync(userId, teamId);
                return Ok(allocations);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving team allocations: {ex.Message}");
            }
        }

        // GET: api/absence/allocations/{employeeId}/{year}
        [HttpGet("allocations/{employeeId}/{year}")]
        public async Task<ActionResult<AbsenceAllocationDto>> GetEmployeeAllocation(int employeeId, int year)
        {
            try
            {
                var allocation = await _absenceService.GetEmployeeAllocationAsync(employeeId, year);
                if (allocation == null)
                    return NotFound("Allocation not found for this employee and year");

                return Ok(allocation);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving employee allocation: {ex.Message}");
            }
        }

        // POST: api/absence/allocations
        [HttpPost("allocations")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<AbsenceAllocationDto>> CreateAllocation([FromBody] CreateAbsenceAllocationDto dto)
        {
            try
            {
                var userId = GetUserId();
                var allocation = await _absenceService.CreateAllocationAsync(userId, dto);
                return CreatedAtAction(nameof(GetEmployeeAllocation),
                    new { employeeId = allocation.EmployeeId, year = allocation.Year }, allocation);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating allocation: {ex.Message}");
            }
        }

        // PUT: api/absence/allocations
        [HttpPut("allocations")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<AbsenceAllocationDto>> UpdateAllocation([FromBody] UpdateAbsenceAllocationDto dto)
        {
            try
            {
                var userId = GetUserId();
                var allocation = await _absenceService.UpdateAllocationAsync(userId, dto);
                return Ok(allocation);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating allocation: {ex.Message}");
            }
        }

        // DELETE: api/absence/allocations/{allocationId}
        [HttpDelete("allocations/{allocationId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAllocation(int allocationId)
        {
            try
            {
                var userId = GetUserId();
                var success = await _absenceService.DeleteAllocationAsync(userId, allocationId);
                if (!success)
                    return NotFound("Allocation not found");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting allocation: {ex.Message}");
            }
        }

        // GET: api/absence/records/{employeeId}
        [HttpGet("records/{employeeId}")]
        public async Task<ActionResult<List<AbsenceRecordDto>>> GetEmployeeAbsenceRecords(int employeeId, [FromQuery] int? year = null)
        {
            try
            {
                var userId = GetUserId();
                var records = await _absenceService.GetEmployeeAbsenceRecordsAsync(userId, employeeId, year);
                return Ok(records);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving absence records: {ex.Message}");
            }
        }

        // POST: api/absence/records
        [HttpPost("records")]
        [Authorize] // Allow all authenticated users - service layer will enforce team members can only create for themselves
        public async Task<ActionResult<AbsenceRecordDto>> CreateAbsenceRecord([FromBody] CreateAbsenceRecordDto dto)
        {
            try
            {
                var userId = GetUserId();
                var record = await _absenceService.CreateAbsenceRecordAsync(userId, dto);
                return CreatedAtAction(nameof(GetEmployeeAbsenceRecords),
                    new { employeeId = record.EmployeeId }, record);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating absence record: {ex.Message}");
            }
        }

        // DELETE: api/absence/records/{recordId}
        [HttpDelete("records/{recordId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAbsenceRecord(int recordId)
        {
            try
            {
                var userId = GetUserId();
                var success = await _absenceService.DeleteAbsenceRecordAsync(userId, recordId);
                if (!success)
                    return NotFound("Absence record not found");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting absence record: {ex.Message}");
            }
        }

        // POST: api/absence/schedule/{assignmentId}
        [HttpPost("schedule/{assignmentId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<AbsenceRecordDto>> CreateAbsenceFromSchedule(int assignmentId, [FromBody] AbsenceType absenceType)
        {
            try
            {
                var record = await _absenceService.CreateAbsenceFromScheduleAsync(assignmentId, absenceType);
                if (record == null)
                    return NotFound("Assignment not found");

                return Ok(record);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating absence from schedule: {ex.Message}");
            }
        }

        // DELETE: api/absence/schedule/{assignmentId}
        [HttpDelete("schedule/{assignmentId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAbsenceFromSchedule(int assignmentId)
        {
            try
            {
                var success = await _absenceService.DeleteAbsenceFromScheduleAsync(assignmentId);
                if (!success)
                    return NotFound("Absence record not found for this assignment");

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting absence from schedule: {ex.Message}");
            }
        }

        // GET: api/absence/stats
        [HttpGet("stats")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<Dictionary<AbsenceType, int>>> GetTeamAbsenceStats([FromQuery] int? teamId = null, [FromQuery] int? year = null)
        {
            try
            {
                var userId = GetUserId();
                var stats = await _absenceService.GetTeamAbsenceStatsAsync(userId, teamId, year);
                return Ok(stats);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving absence statistics: {ex.Message}");
            }
        }

        // GET: api/absence/upcoming
        [HttpGet("upcoming")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<AbsenceRecordDto>>> GetUpcomingAbsences([FromQuery] int days = 30)
        {
            try
            {
                var userId = GetUserId();
                var upcoming = await _absenceService.GetUpcomingAbsencesAsync(userId, days);
                return Ok(upcoming);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving upcoming absences: {ex.Message}");
            }
        }

        // GET: api/absence/validate/{employeeId}/{absenceType}/{hours}/{year}
        [HttpGet("validate/{employeeId}/{absenceType}/{hours}/{year}")]
        public async Task<ActionResult<bool>> ValidateAllocation(int employeeId, AbsenceType absenceType, double hours, int year)
        {
            try
            {
                var hasAllocation = await _absenceService.HasSufficientAllocationAsync(employeeId, absenceType, hours, year);
                return Ok(hasAllocation);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error validating allocation: {ex.Message}");
            }
        }

        // DELETE: api/absence/records-by-date
        [HttpDelete("records-by-date")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAbsenceRecordsByDate([FromQuery] string date, [FromQuery] int? employeeId = null)
        {
            Console.WriteLine($"🚨🚨🚨 DELETION ENDPOINT CALLED: records-by-date, date={date}, employeeId={employeeId}");
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format");
                }

                var userId = GetUserId();
                var deletedCount = await _absenceService.DeleteAbsenceRecordsByDateAsync(userId, parsedDate, employeeId);

                Console.WriteLine($"🚨🚨🚨 DELETION RESULT: {deletedCount} absence records deleted");
                return Ok(new { deletedCount });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting absence records: {ex.Message}");
            }
        }

        // DELETE: api/absence/assignments-by-date
        [HttpDelete("assignments-by-date")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> ClearAbsenceAssignmentsByDate([FromQuery] string date, [FromQuery] int? employeeId = null)
        {
            Console.WriteLine($"🚨🚨🚨 DELETION ENDPOINT CALLED: assignments-by-date, date={date}, employeeId={employeeId}");
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format");
                }

                var userId = GetUserId();
                var clearedCount = await _absenceService.ClearAbsenceAssignmentsByDateAsync(userId, parsedDate, employeeId);

                Console.WriteLine($"🚨🚨🚨 DELETION RESULT: {clearedCount} absence assignments cleared");
                return Ok(new { clearedCount });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error clearing absence assignments: {ex.Message}");
            }
        }

        // DELETE: api/absence/leave-tasks-by-date
        [HttpDelete("leave-tasks-by-date")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteLeaveTasksByDate([FromQuery] string date, [FromQuery] int? employeeId = null)
        {
            Console.WriteLine($"🚨🚨🚨 DELETION ENDPOINT CALLED: leave-tasks-by-date, date={date}, employeeId={employeeId}");
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format");
                }

                var userId = GetUserId();
                var deletedCount = await _absenceService.DeleteLeaveTasksByDateAsync(userId, parsedDate, employeeId);

                Console.WriteLine($"🚨🚨🚨 DELETION RESULT: {deletedCount} leave task assignments deleted");
                return Ok(new { deletedCount });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting leave tasks: {ex.Message}");
            }
        }

        // DELETE: api/absence/assignments-all-by-date
        [HttpDelete("assignments-all-by-date")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteAllAssignmentsByDate([FromQuery] string date, [FromQuery] int? employeeId = null)
        {
            Console.WriteLine($"🚨🚨🚨 NEW DELETION ENDPOINT CALLED: assignments-all-by-date, date={date}, employeeId={employeeId}");
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                {
                    return BadRequest("Invalid date format");
                }

                var userId = GetUserId();
                var deletedCount = await _absenceService.DeleteAllAssignmentsByDateAsync(userId, parsedDate, employeeId);

                Console.WriteLine($"🚨🚨🚨 NEW DELETION RESULT: {deletedCount} ALL assignments deleted");
                return Ok(new { deletedCount });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting all assignments: {ex.Message}");
            }
        }
    }
}