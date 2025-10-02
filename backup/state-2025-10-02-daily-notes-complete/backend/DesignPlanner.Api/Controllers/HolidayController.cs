using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing holidays
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HolidayController : ControllerBase
    {
        private readonly IHolidayService _holidayService;
        private readonly ILogger<HolidayController> _logger;

        public HolidayController(IHolidayService holidayService, ILogger<HolidayController> logger)
        {
            _holidayService = holidayService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current user ID from JWT token
        /// </summary>
        /// <returns>User ID or 0 if not found</returns>
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("id") ?? User.FindFirst("sub");
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        /// <summary>
        /// Get all holidays
        /// </summary>
        /// <returns>List of holidays</returns>
        [HttpGet]
        public async Task<ActionResult<HolidayListResponseDto>> GetHolidays([FromQuery] HolidayQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new HolidayQueryDto();
                var holidays = await _holidayService.GetHolidaysAsync(query, userId);
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holidays");
                return StatusCode(500, "An error occurred while retrieving holidays");
            }
        }

        /// <summary>
        /// Get a specific holiday by ID
        /// </summary>
        /// <param name="id">Holiday ID</param>
        /// <returns>Holiday details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<HolidayResponseDto>> GetHoliday(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holiday = await _holidayService.GetHolidayByIdAsync(id, userId);
                if (holiday == null)
                {
                    return NotFound("Holiday not found");
                }

                return Ok(holiday);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holiday {HolidayId}", id);
                return StatusCode(500, "An error occurred while retrieving the holiday");
            }
        }

        /// <summary>
        /// Create a new holiday
        /// </summary>
        /// <param name="createDto">Holiday creation data</param>
        /// <returns>Created holiday</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<HolidayResponseDto>> CreateHoliday([FromBody] CreateHolidayRequestDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holiday = await _holidayService.CreateHolidayAsync(createDto, userId);
                return CreatedAtAction(nameof(GetHoliday), new { id = holiday.Id }, holiday);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating holiday");
                return StatusCode(500, "An error occurred while creating the holiday");
            }
        }

        /// <summary>
        /// Update an existing holiday
        /// </summary>
        /// <param name="id">Holiday ID</param>
        /// <param name="updateDto">Holiday update data</param>
        /// <returns>Updated holiday</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<HolidayResponseDto>> UpdateHoliday(int id, [FromBody] UpdateHolidayRequestDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holiday = await _holidayService.UpdateHolidayAsync(id, updateDto, userId);
                return Ok(holiday);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating holiday {HolidayId}", id);
                return StatusCode(500, "An error occurred while updating the holiday");
            }
        }

        /// <summary>
        /// Delete a holiday
        /// </summary>
        /// <param name="id">Holiday ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteHoliday(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _holidayService.DeleteHolidayAsync(id, userId);
                if (!result)
                {
                    return NotFound("Holiday not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting holiday {HolidayId}", id);
                return StatusCode(500, "An error occurred while deleting the holiday");
            }
        }

        /// <summary>
        /// Get holidays by year
        /// </summary>
        /// <param name="year">Year to filter by</param>
        /// <returns>List of holidays in the specified year</returns>
        [HttpGet("year/{year}")]
        public async Task<ActionResult<List<HolidayResponseDto>>> GetHolidaysByYear(int year)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holidays = await _holidayService.GetHolidaysForYearAsync(year, userId);
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holidays for year {Year}", year);
                return StatusCode(500, "An error occurred while retrieving holidays by year");
            }
        }

        /// <summary>
        /// Get holidays by date range
        /// </summary>
        /// <param name="startDate">Start date</param>
        /// <param name="endDate">End date</param>
        /// <returns>List of holidays in the date range</returns>
        [HttpGet("range")]
        public async Task<ActionResult<List<HolidayResponseDto>>> GetHolidaysByDateRange(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                if (startDate > endDate)
                {
                    return BadRequest("Start date cannot be after end date");
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holidays = await _holidayService.GetHolidaysInRangeAsync(startDate, endDate, userId);
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holidays for date range {StartDate} to {EndDate}", startDate, endDate);
                return StatusCode(500, "An error occurred while retrieving holidays by date range");
            }
        }

        /// <summary>
        /// Get holidays by type
        /// </summary>
        /// <param name="type">Holiday type</param>
        /// <returns>List of holidays of the specified type</returns>
        [HttpGet("type/{type}")]
        public async Task<ActionResult<List<HolidayResponseDto>>> GetHolidaysByType(HolidayType type)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new HolidayQueryDto { Type = type };
                var result = await _holidayService.GetHolidaysAsync(query, userId);
                var holidays = result.Holidays;
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holidays of type {HolidayType}", type);
                return StatusCode(500, "An error occurred while retrieving holidays by type");
            }
        }

        /// <summary>
        /// Get active holidays
        /// </summary>
        /// <returns>List of active holidays</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<HolidayResponseDto>>> GetActiveHolidays()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new HolidayQueryDto();
                var result = await _holidayService.GetHolidaysAsync(query, userId);
                var holidays = result.Holidays;
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active holidays");
                return StatusCode(500, "An error occurred while retrieving active holidays");
            }
        }

        /// <summary>
        /// Get upcoming holidays
        /// </summary>
        /// <param name="days">Number of days to look ahead (default: 30)</param>
        /// <returns>List of upcoming holidays</returns>
        [HttpGet("upcoming")]
        public async Task<ActionResult<List<HolidayResponseDto>>> GetUpcomingHolidays([FromQuery] int days = 30)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var startDate = DateTime.Today;
                var endDate = DateTime.Today.AddDays(days);
                var holidays = await _holidayService.GetHolidaysInRangeAsync(startDate, endDate, userId);
                return Ok(holidays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming holidays");
                return StatusCode(500, "An error occurred while retrieving upcoming holidays");
            }
        }

        /// <summary>
        /// Check if a specific date is a holiday
        /// </summary>
        /// <param name="date">Date to check</param>
        /// <returns>Holiday information if the date is a holiday, null otherwise</returns>
        [HttpGet("check")]
        public async Task<ActionResult<HolidayResponseDto?>> CheckHolidayByDate([FromQuery] DateTime date)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var holiday = await _holidayService.IsHolidayAsync(date, userId);
                return Ok(holiday);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking holiday for date {Date}", date);
                return StatusCode(500, "An error occurred while checking holiday by date");
            }
        }

        /// <summary>
        /// Import holidays from external source or bulk create
        /// </summary>
        /// <param name="holidays">List of holidays to import</param>
        /// <returns>Import result summary</returns>
        [HttpPost("import")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<object>> ImportHolidays([FromBody] List<CreateHolidayRequestDto> holidays)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // Bulk create is not available in the interface, create individually
                var createdHolidays = new List<HolidayResponseDto>();
                foreach (var holiday in holidays)
                {
                    var created = await _holidayService.CreateHolidayAsync(holiday, userId);
                    if (created != null)
                    {
                        createdHolidays.Add(created);
                    }
                }
                var result = new { Created = createdHolidays.Count, Total = holidays.Count };
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing holidays");
                return StatusCode(500, "An error occurred while importing holidays");
            }
        }

        /// <summary>
        /// Get holiday statistics
        /// </summary>
        /// <returns>Holiday statistics by type and year</returns>
        [HttpGet("statistics")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<object>> GetHolidayStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // Statistics method doesn't exist in interface, return not implemented
                return StatusCode(501, "Holiday statistics functionality not implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving holiday statistics");
                return StatusCode(500, "An error occurred while retrieving holiday statistics");
            }
        }
    }
}