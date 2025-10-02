using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new holiday
    /// </summary>
    public class CreateHolidayDto
    {
        /// <summary>
        /// Holiday name
        /// </summary>
        [Required(ErrorMessage = "Holiday name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Holiday name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Holiday date
        /// </summary>
        [Required(ErrorMessage = "Holiday date is required")]
        public DateTime Date { get; set; }

        /// <summary>
        /// Holiday type (Bank Holiday, Company Holiday, etc.)
        /// </summary>
        public HolidayType Type { get; set; } = HolidayType.BankHoliday;

        /// <summary>
        /// Holiday description
        /// </summary>
        [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this is a recurring holiday (annual)
        /// </summary>
        public bool IsRecurring { get; set; } = false;
    }

    /// <summary>
    /// Data transfer object for updating an existing holiday
    /// </summary>
    public class UpdateHolidayDto
    {
        /// <summary>
        /// Holiday name
        /// </summary>
        [Required(ErrorMessage = "Holiday name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Holiday name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Holiday date
        /// </summary>
        [Required(ErrorMessage = "Holiday date is required")]
        public DateTime Date { get; set; }

        /// <summary>
        /// Holiday type (Bank Holiday, Company Holiday, etc.)
        /// </summary>
        public HolidayType Type { get; set; }

        /// <summary>
        /// Holiday description
        /// </summary>
        [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this is a recurring holiday (annual)
        /// </summary>
        public bool IsRecurring { get; set; }

        /// <summary>
        /// Whether the holiday is active
        /// </summary>
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Data transfer object for holiday response data
    /// </summary>
    public class HolidayResponseDto
    {
        /// <summary>
        /// Holiday unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Holiday name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Holiday date
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Holiday type
        /// </summary>
        public HolidayType Type { get; set; }

        /// <summary>
        /// Holiday type display name
        /// </summary>
        public string TypeName => Type.ToString();

        /// <summary>
        /// Holiday description
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Whether this is a recurring holiday (annual)
        /// </summary>
        public bool IsRecurring { get; set; }

        /// <summary>
        /// Whether the holiday is active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the holiday was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When the holiday was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Day of the week for the holiday
        /// </summary>
        public string DayOfWeek => Date.DayOfWeek.ToString();

        /// <summary>
        /// Number of days until the holiday (negative if past)
        /// </summary>
        public int DaysUntilHoliday => (Date.Date - DateTime.UtcNow.Date).Days;

        /// <summary>
        /// Whether the holiday is in the past
        /// </summary>
        public bool IsPast => Date.Date < DateTime.UtcNow.Date;

        /// <summary>
        /// Whether the holiday is today
        /// </summary>
        public bool IsToday => Date.Date == DateTime.UtcNow.Date;

        /// <summary>
        /// Whether the holiday is upcoming (within next 30 days)
        /// </summary>
        public bool IsUpcoming => DaysUntilHoliday > 0 && DaysUntilHoliday <= 30;
    }

    /// <summary>
    /// Data transfer object for simple holiday information
    /// </summary>
    public class HolidaySimpleDto
    {
        /// <summary>
        /// Holiday unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Holiday name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Holiday date
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Holiday type
        /// </summary>
        public HolidayType Type { get; set; }

        /// <summary>
        /// Whether this is a recurring holiday
        /// </summary>
        public bool IsRecurring { get; set; }
    }

    /// <summary>
    /// Data transfer object for holiday list response
    /// </summary>
    public class HolidayListResponseDto
    {
        /// <summary>
        /// List of holidays
        /// </summary>
        public List<HolidayResponseDto> Holidays { get; set; } = new();

        /// <summary>
        /// Total number of holidays
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Current page number
        /// </summary>
        public int PageNumber { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Data transfer object for holiday query parameters
    /// </summary>
    public class HolidayQueryDto
    {
        /// <summary>
        /// Page number for pagination
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; } = 1000;

        /// <summary>
        /// Search term for filtering holidays
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by holiday type
        /// </summary>
        public HolidayType? Type { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Filter by recurring status
        /// </summary>
        public bool? IsRecurring { get; set; }

        /// <summary>
        /// Filter by year
        /// </summary>
        public int? Year { get; set; }

        /// <summary>
        /// Filter by month (1-12)
        /// </summary>
        public int? Month { get; set; }

        /// <summary>
        /// Filter by date range start
        /// </summary>
        public DateTime? DateFrom { get; set; }

        /// <summary>
        /// Filter by date range end
        /// </summary>
        public DateTime? DateTo { get; set; }

        /// <summary>
        /// Include only upcoming holidays
        /// </summary>
        public bool OnlyUpcoming { get; set; } = false;

        /// <summary>
        /// Field to sort by
        /// </summary>
        public string SortBy { get; set; } = "Date";

        /// <summary>
        /// Sort direction (asc or desc)
        /// </summary>
        public string SortDirection { get; set; } = "asc";
    }

    /// <summary>
    /// Data transfer object for holiday calendar response
    /// </summary>
    public class HolidayCalendarResponseDto
    {
        /// <summary>
        /// Year of the calendar
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// Month of the calendar (1-12, or null for full year)
        /// </summary>
        public int? Month { get; set; }

        /// <summary>
        /// List of holidays in the specified period
        /// </summary>
        public List<HolidaySimpleDto> Holidays { get; set; } = new();

        /// <summary>
        /// Total number of holidays in the period
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Number of bank holidays
        /// </summary>
        public int BankHolidayCount { get; set; }

        /// <summary>
        /// Number of company holidays
        /// </summary>
        public int CompanyHolidayCount { get; set; }
    }

    /// <summary>
    /// Data transfer object for bulk holiday creation
    /// </summary>
    public class BulkCreateHolidaysDto
    {
        /// <summary>
        /// List of holidays to create
        /// </summary>
        [Required(ErrorMessage = "At least one holiday is required")]
        [MinLength(1, ErrorMessage = "At least one holiday is required")]
        public List<CreateHolidayDto> Holidays { get; set; } = new();

        /// <summary>
        /// Whether to skip holidays that already exist (by name and date)
        /// </summary>
        public bool SkipExisting { get; set; } = true;
    }

    /// <summary>
    /// Request DTO for creating a holiday (alias for CreateHolidayDto)
    /// </summary>
    public class CreateHolidayRequestDto : CreateHolidayDto
    {
    }

    /// <summary>
    /// Request DTO for updating a holiday (alias for UpdateHolidayDto)
    /// </summary>
    public class UpdateHolidayRequestDto : UpdateHolidayDto
    {
    }
}