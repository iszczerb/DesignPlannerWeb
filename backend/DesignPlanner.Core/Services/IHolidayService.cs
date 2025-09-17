using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for holiday management operations
    /// </summary>
    public interface IHolidayService
    {
        /// <summary>
        /// Creates a new holiday
        /// </summary>
        /// <param name="request">The holiday creation request</param>
        /// <param name="createdByUserId">ID of the user creating the holiday</param>
        /// <returns>The created holiday DTO</returns>
        Task<HolidayResponseDto?> CreateHolidayAsync(CreateHolidayRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing holiday
        /// </summary>
        /// <param name="holidayId">ID of the holiday to update</param>
        /// <param name="request">The holiday update request</param>
        /// <param name="updatedByUserId">ID of the user updating the holiday</param>
        /// <returns>The updated holiday DTO</returns>
        Task<HolidayResponseDto?> UpdateHolidayAsync(int holidayId, UpdateHolidayRequestDto request, int updatedByUserId);

        /// <summary>
        /// Soft deletes a holiday by setting IsActive to false
        /// </summary>
        /// <param name="holidayId">ID of the holiday to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the holiday</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteHolidayAsync(int holidayId, int deletedByUserId);

        /// <summary>
        /// Gets a holiday by ID
        /// </summary>
        /// <param name="holidayId">ID of the holiday to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the holiday</param>
        /// <returns>The holiday DTO if found</returns>
        Task<HolidayResponseDto?> GetHolidayByIdAsync(int holidayId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of holidays with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>Paginated holiday list response</returns>
        Task<HolidayListResponseDto> GetHolidaysAsync(HolidayQueryDto query, int requestingUserId);

        /// <summary>
        /// Toggles the active status of a holiday
        /// </summary>
        /// <param name="holidayId">ID of the holiday to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        Task<bool> ToggleHolidayStatusAsync(int holidayId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Gets all active holidays for a specific date range
        /// </summary>
        /// <param name="startDate">Start date of the range</param>
        /// <param name="endDate">End date of the range</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>List of holiday DTOs in the specified date range</returns>
        Task<List<HolidayResponseDto>> GetHolidaysInRangeAsync(DateTime startDate, DateTime endDate, int requestingUserId);

        /// <summary>
        /// Checks if a specific date is a holiday
        /// </summary>
        /// <param name="date">The date to check</param>
        /// <param name="requestingUserId">ID of the user requesting the check</param>
        /// <returns>Holiday DTO if the date is a holiday, null otherwise</returns>
        Task<HolidayResponseDto?> IsHolidayAsync(DateTime date, int requestingUserId);

        /// <summary>
        /// Gets holidays for the current year
        /// </summary>
        /// <param name="year">The year to get holidays for (default: current year)</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>List of holiday DTOs for the specified year</returns>
        Task<List<HolidayResponseDto>> GetHolidaysForYearAsync(int? year, int requestingUserId);

        /// <summary>
        /// Checks if a holiday with the same name and date already exists
        /// </summary>
        /// <param name="name">The holiday name to check</param>
        /// <param name="date">The holiday date to check</param>
        /// <param name="excludeHolidayId">Optional holiday ID to exclude from the check (for updates)</param>
        /// <returns>True if a duplicate holiday exists</returns>
        Task<bool> IsDuplicateHolidayAsync(string name, DateTime date, int? excludeHolidayId = null);
    }
}