using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for holiday management operations
    /// </summary>
    public class HolidayService : IHolidayService
    {
        private readonly ApplicationDbContext _context;

        public HolidayService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new holiday
        /// </summary>
        /// <param name="request">The holiday creation request</param>
        /// <param name="createdByUserId">ID of the user creating the holiday</param>
        /// <returns>The created holiday DTO</returns>
        public async Task<HolidayResponseDto?> CreateHolidayAsync(CreateHolidayRequestDto request, int createdByUserId)
        {
            // Check if duplicate holiday exists
            if (await IsDuplicateHolidayAsync(request.Name, request.Date))
            {
                throw new ArgumentException($"Holiday '{request.Name}' on {request.Date:yyyy-MM-dd} already exists");
            }

            var holiday = new Holiday
            {
                Name = request.Name,
                Date = request.Date.Date, // Ensure only date part is stored
                Type = request.Type,
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Holidays.Add(holiday);
            await _context.SaveChangesAsync();

            return MapToHolidayResponseDto(holiday);
        }

        /// <summary>
        /// Updates an existing holiday
        /// </summary>
        /// <param name="holidayId">ID of the holiday to update</param>
        /// <param name="request">The holiday update request</param>
        /// <param name="updatedByUserId">ID of the user updating the holiday</param>
        /// <returns>The updated holiday DTO</returns>
        public async Task<HolidayResponseDto?> UpdateHolidayAsync(int holidayId, UpdateHolidayRequestDto request, int updatedByUserId)
        {
            var holiday = await _context.Holidays.FirstOrDefaultAsync(h => h.Id == holidayId);
            if (holiday == null)
                throw new ArgumentException("Holiday not found");

            // Check if duplicate holiday exists (excluding current holiday)
            if (await IsDuplicateHolidayAsync(request.Name, request.Date, holidayId))
            {
                throw new ArgumentException($"Holiday '{request.Name}' on {request.Date:yyyy-MM-dd} already exists");
            }

            holiday.Name = request.Name;
            holiday.Date = request.Date.Date; // Ensure only date part is stored
            holiday.Type = request.Type;
            holiday.Description = request.Description;
            holiday.IsActive = request.IsActive;
            holiday.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToHolidayResponseDto(holiday);
        }

        /// <summary>
        /// Soft deletes a holiday by setting IsActive to false
        /// </summary>
        /// <param name="holidayId">ID of the holiday to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the holiday</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteHolidayAsync(int holidayId, int deletedByUserId)
        {
            var holiday = await _context.Holidays.FirstOrDefaultAsync(h => h.Id == holidayId);
            if (holiday == null)
                return false;

            // Holidays can be safely deleted as they don't typically have foreign key constraints
            // But we'll use soft delete for consistency
            holiday.IsActive = false;
            holiday.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a holiday by ID
        /// </summary>
        /// <param name="holidayId">ID of the holiday to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the holiday</param>
        /// <returns>The holiday DTO if found</returns>
        public async Task<HolidayResponseDto?> GetHolidayByIdAsync(int holidayId, int requestingUserId)
        {
            var holiday = await _context.Holidays.FirstOrDefaultAsync(h => h.Id == holidayId);
            return holiday != null ? MapToHolidayResponseDto(holiday) : null;
        }

        /// <summary>
        /// Gets a paginated list of holidays with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>Paginated holiday list response</returns>
        public async Task<HolidayListResponseDto> GetHolidaysAsync(HolidayQueryDto query, int requestingUserId)
        {
            var queryable = _context.Holidays.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(h =>
                    h.Name.ToLower().Contains(searchTerm) ||
                    (h.Description != null && h.Description.ToLower().Contains(searchTerm)));
            }

            if (query.Type.HasValue)
            {
                queryable = queryable.Where(h => h.Type == query.Type.Value);
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(h => h.IsActive == query.IsActive.Value);
            }

            if (query.DateFrom.HasValue)
            {
                queryable = queryable.Where(h => h.Date >= query.DateFrom.Value.Date);
            }

            if (query.DateTo.HasValue)
            {
                queryable = queryable.Where(h => h.Date <= query.DateTo.Value.Date);
            }

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(h => h.Name)
                    : queryable.OrderBy(h => h.Name),
                "date" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(h => h.Date)
                    : queryable.OrderBy(h => h.Date),
                "type" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(h => h.Type)
                    : queryable.OrderBy(h => h.Type),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(h => h.CreatedAt)
                    : queryable.OrderBy(h => h.CreatedAt),
                _ => queryable.OrderBy(h => h.Date)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var holidays = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(h => MapToHolidayResponseDto(h))
                .ToListAsync();

            return new HolidayListResponseDto
            {
                Holidays = holidays,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Toggles the active status of a holiday
        /// </summary>
        /// <param name="holidayId">ID of the holiday to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        public async Task<bool> ToggleHolidayStatusAsync(int holidayId, bool isActive, int updatedByUserId)
        {
            var holiday = await _context.Holidays.FirstOrDefaultAsync(h => h.Id == holidayId);
            if (holiday == null)
                return false;

            holiday.IsActive = isActive;
            holiday.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets all active holidays for a specific date range
        /// </summary>
        /// <param name="startDate">Start date of the range</param>
        /// <param name="endDate">End date of the range</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>List of holiday DTOs in the specified date range</returns>
        public async Task<List<HolidayResponseDto>> GetHolidaysInRangeAsync(DateTime startDate, DateTime endDate, int requestingUserId)
        {
            var holidays = await _context.Holidays
                .Where(h => h.IsActive &&
                           h.Date >= startDate.Date &&
                           h.Date <= endDate.Date)
                .OrderBy(h => h.Date)
                .Select(h => MapToHolidayResponseDto(h))
                .ToListAsync();

            return holidays;
        }

        /// <summary>
        /// Checks if a specific date is a holiday
        /// </summary>
        /// <param name="date">The date to check</param>
        /// <param name="requestingUserId">ID of the user requesting the check</param>
        /// <returns>Holiday DTO if the date is a holiday, null otherwise</returns>
        public async Task<HolidayResponseDto?> IsHolidayAsync(DateTime date, int requestingUserId)
        {
            var holiday = await _context.Holidays
                .FirstOrDefaultAsync(h => h.IsActive && h.Date.Date == date.Date);

            return holiday != null ? MapToHolidayResponseDto(holiday) : null;
        }

        /// <summary>
        /// Gets holidays for the current year
        /// </summary>
        /// <param name="year">The year to get holidays for (default: current year)</param>
        /// <param name="requestingUserId">ID of the user requesting the holidays</param>
        /// <returns>List of holiday DTOs for the specified year</returns>
        public async Task<List<HolidayResponseDto>> GetHolidaysForYearAsync(int? year, int requestingUserId)
        {
            var targetYear = year ?? DateTime.Now.Year;
            var startDate = new DateTime(targetYear, 1, 1);
            var endDate = new DateTime(targetYear, 12, 31);

            return await GetHolidaysInRangeAsync(startDate, endDate, requestingUserId);
        }

        /// <summary>
        /// Checks if a holiday with the same name and date already exists
        /// </summary>
        /// <param name="name">The holiday name to check</param>
        /// <param name="date">The holiday date to check</param>
        /// <param name="excludeHolidayId">Optional holiday ID to exclude from the check (for updates)</param>
        /// <returns>True if a duplicate holiday exists</returns>
        public async Task<bool> IsDuplicateHolidayAsync(string name, DateTime date, int? excludeHolidayId = null)
        {
            var query = _context.Holidays.Where(h =>
                h.Name.ToLower() == name.ToLower() &&
                h.Date.Date == date.Date);

            if (excludeHolidayId.HasValue)
            {
                query = query.Where(h => h.Id != excludeHolidayId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Maps a Holiday entity to HolidayResponseDto
        /// </summary>
        /// <param name="holiday">The holiday entity</param>
        /// <returns>The holiday DTO</returns>
        private static HolidayResponseDto MapToHolidayResponseDto(Holiday holiday)
        {
            return new HolidayResponseDto
            {
                Id = holiday.Id,
                Name = holiday.Name,
                Date = holiday.Date,
                Type = holiday.Type,
                Description = holiday.Description,
                IsRecurring = false, // Default value since Holiday entity doesn't have IsRecurring property
                IsActive = holiday.IsActive,
                CreatedAt = holiday.CreatedAt,
                UpdatedAt = holiday.UpdatedAt
            };
        }
    }
}