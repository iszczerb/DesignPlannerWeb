namespace DesignPlanner.Core.Enums
{
    // Updated for weekdays-only (Monday-Friday) calendar system
    public enum CalendarViewType
    {
        Day = 1,        // 1 weekday
        Week = 5,       // 5 weekdays (Mon-Fri)
        BiWeek = 10,    // 10 weekdays (2 work weeks)
        Month = 23      // ~20-23 weekdays (average weekdays in a month)
    }
}