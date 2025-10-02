using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for displaying holiday information
    /// </summary>
    public class HolidayDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public HolidayType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsRecurring { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int DaysUntil { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}