using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;
using System.Globalization;

namespace DesignPlanner.Data.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly ApplicationDbContext _context;
        private const int MAX_TASKS_PER_SLOT = 4;

        public ScheduleService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Calendar view operations
        public async Task<CalendarViewDto> GetCalendarViewAsync(ScheduleRequestDto request)
        {
            var startDate = GetViewStartDate(request.StartDate, request.ViewType);
            var endDate = GetViewEndDate(startDate, request.ViewType);

            var employees = await GetEmployeesForViewAsync(request.EmployeeId, request.IncludeInactive);
            var assignments = await GetAssignmentsForDateRangeAsync(startDate, endDate, request.EmployeeId);

            // Get all task types from database
            var taskTypes = await _context.TaskTypes
                                .Select(tt => new TaskTypeDto
                {
                    Id = tt.Id,
                    Name = tt.Name
                })
                .ToListAsync();

            var calendarView = new CalendarViewDto
            {
                StartDate = startDate,
                EndDate = endDate,
                ViewType = request.ViewType,
                Days = GenerateCalendarDays(startDate, endDate),
                Employees = await BuildEmployeeSchedulesAsync(employees, assignments, startDate, endDate),
                TaskTypes = taskTypes
            };

            return calendarView;
        }

        public async Task<CalendarViewDto> GetEmployeeScheduleAsync(int employeeId, DateTime startDate, CalendarViewType viewType)
        {
            var request = new ScheduleRequestDto
            {
                EmployeeId = employeeId,
                StartDate = startDate,
                ViewType = viewType,
                IncludeInactive = false
            };

            return await GetCalendarViewAsync(request);
        }

        // Assignment operations
        public async Task<AssignmentTaskDto> CreateAssignmentAsync(CreateAssignmentDto createDto)
        {
            if (!await ValidateAssignmentAsync(createDto))
            {
                throw new InvalidOperationException("Assignment validation failed");
            }

            var assignment = new Assignment
            {
                TaskId = createDto.TaskId,
                EmployeeId = createDto.EmployeeId,
                AssignedDate = createDto.AssignedDate.Date,
                Slot = createDto.Slot,
                Notes = createDto.Notes,
                IsActive = true
            };

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return await GetAssignmentTaskDtoAsync(assignment.Id);
        }

        public async Task<AssignmentTaskDto> UpdateAssignmentAsync(UpdateAssignmentDto updateDto)
        {
            Console.WriteLine($"DEBUG: UpdateAssignment called with data: AssignmentId={updateDto.AssignmentId}, TaskId={updateDto.TaskId}, Priority={updateDto.Priority}, TaskStatus={updateDto.TaskStatus}, TaskTypeId={updateDto.TaskTypeId}, Notes={updateDto.Notes}");
            
            var assignment = await _context.Assignments
                .Include(a => a.Task)
                .FirstOrDefaultAsync(a => a.Id == updateDto.AssignmentId);
            
            if (assignment == null)
                throw new ArgumentException("Assignment not found");

            // Update assignment fields
            if (updateDto.TaskId.HasValue) {
                Console.WriteLine($"DEBUG: Updating TaskId from {assignment.TaskId} to {updateDto.TaskId.Value}");
                assignment.TaskId = updateDto.TaskId.Value;
            }
            if (updateDto.EmployeeId.HasValue) assignment.EmployeeId = updateDto.EmployeeId.Value;
            if (updateDto.AssignedDate.HasValue) assignment.AssignedDate = updateDto.AssignedDate.Value.Date;
            if (updateDto.Slot.HasValue) assignment.Slot = updateDto.Slot.Value;
            if (updateDto.Notes != null) assignment.Notes = updateDto.Notes;
            
            // Note: Hours are now automatically calculated based on slot task count
            // Custom hours feature has been removed
            
            if (updateDto.Priority.HasValue)
            {
                Console.WriteLine($"DEBUG: Updating Priority from {assignment.Task.Priority} to {updateDto.Priority.Value}");
                assignment.Task.Priority = updateDto.Priority.Value;
            }
            
            if (updateDto.DueDate.HasValue)
            {
                Console.WriteLine($"DEBUG: Updating DueDate from {assignment.Task.DueDate} to {updateDto.DueDate.Value}");
                assignment.Task.DueDate = updateDto.DueDate.Value;
            }
            
            if (updateDto.TaskStatus.HasValue)
            {
                Console.WriteLine($"DEBUG: Updating TaskStatus from {assignment.Task.Status} to {updateDto.TaskStatus.Value}");
                assignment.Task.Status = updateDto.TaskStatus.Value;
            }

            if (updateDto.TaskTypeId.HasValue)
            {
                Console.WriteLine($"DEBUG: Updating TaskTypeId from {assignment.Task.TaskTypeId} to {updateDto.TaskTypeId.Value}");
                assignment.Task.TaskTypeId = updateDto.TaskTypeId.Value;
            }

            await _context.SaveChangesAsync();

            return await GetAssignmentTaskDtoAsync(assignment.Id);
        }

        public async Task<bool> DeleteAssignmentAsync(int assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) return false;

            assignment.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AssignmentTaskDto>> BulkUpdateAssignmentsAsync(BulkUpdateAssignmentDto bulkUpdateDto)
        {
            Console.WriteLine($"DEBUG: BulkUpdateAssignments called for {bulkUpdateDto.AssignmentIds.Count} assignments");

            var assignments = await _context.Assignments
                .Include(a => a.Task)
                .Where(a => bulkUpdateDto.AssignmentIds.Contains(a.Id))
                .ToListAsync();

            if (assignments.Count == 0)
                throw new ArgumentException("No assignments found");

            foreach (var assignment in assignments)
            {
                // Update assignment fields
                if (bulkUpdateDto.Updates.TaskId.HasValue)
                {
                    Console.WriteLine($"DEBUG: Updating TaskId from {assignment.TaskId} to {bulkUpdateDto.Updates.TaskId.Value}");
                    assignment.TaskId = bulkUpdateDto.Updates.TaskId.Value;
                }

                // For task property updates, check if we need to create a new task instance
                bool needsNewTask = bulkUpdateDto.Updates.Priority.HasValue ||
                                   bulkUpdateDto.Updates.TaskStatus.HasValue ||
                                   bulkUpdateDto.Updates.TaskTypeId.HasValue ||
                                   bulkUpdateDto.Updates.DueDate.HasValue;

                if (needsNewTask)
                {
                    // Check if this task is shared by other assignments
                    var otherAssignments = await _context.Assignments
                        .Where(a => a.TaskId == assignment.TaskId && a.Id != assignment.Id)
                        .CountAsync();

                    if (otherAssignments > 0)
                    {
                        // Task is shared, create a new task instance for this assignment
                        Console.WriteLine($"DEBUG: Creating new task instance for assignment {assignment.Id} (shared task detected)");

                        var newTask = new ProjectTask
                        {
                            Title = assignment.Task.Title,
                            Description = assignment.Task.Description,
                            ProjectId = assignment.Task.ProjectId,
                            TaskTypeId = bulkUpdateDto.Updates.TaskTypeId ?? assignment.Task.TaskTypeId,
                            Priority = bulkUpdateDto.Updates.Priority ?? assignment.Task.Priority,
                            Status = bulkUpdateDto.Updates.TaskStatus ?? assignment.Task.Status,
                            EstimatedHours = assignment.Task.EstimatedHours,
                            ActualHours = assignment.Task.ActualHours,
                            DueDate = bulkUpdateDto.Updates.DueDate ?? assignment.Task.DueDate,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            IsActive = assignment.Task.IsActive
                        };

                        _context.ProjectTasks.Add(newTask);
                        await _context.SaveChangesAsync(); // Save to get the new task ID

                        assignment.TaskId = newTask.Id;
                        Console.WriteLine($"DEBUG: New task created with ID {newTask.Id}");
                    }
                    else
                    {
                        // Task is not shared, safe to modify directly
                        Console.WriteLine($"DEBUG: Updating existing task {assignment.TaskId} (not shared)");

                        if (bulkUpdateDto.Updates.Priority.HasValue)
                        {
                            Console.WriteLine($"DEBUG: Updating Priority from {assignment.Task.Priority} to {bulkUpdateDto.Updates.Priority.Value}");
                            assignment.Task.Priority = bulkUpdateDto.Updates.Priority.Value;
                        }

                        if (bulkUpdateDto.Updates.TaskStatus.HasValue)
                        {
                            Console.WriteLine($"DEBUG: Updating TaskStatus from {assignment.Task.Status} to {bulkUpdateDto.Updates.TaskStatus.Value}");
                            assignment.Task.Status = bulkUpdateDto.Updates.TaskStatus.Value;
                        }

                        if (bulkUpdateDto.Updates.TaskTypeId.HasValue)
                        {
                            Console.WriteLine($"DEBUG: Updating TaskTypeId from {assignment.Task.TaskTypeId} to {bulkUpdateDto.Updates.TaskTypeId.Value}");
                            assignment.Task.TaskTypeId = bulkUpdateDto.Updates.TaskTypeId.Value;
                        }

                        if (bulkUpdateDto.Updates.DueDate.HasValue)
                        {
                            Console.WriteLine($"DEBUG: Updating DueDate from {assignment.Task.DueDate} to {bulkUpdateDto.Updates.DueDate.Value}");
                            assignment.Task.DueDate = bulkUpdateDto.Updates.DueDate.Value;
                        }

                        assignment.Task.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Assignment-level updates (always safe)
                if (bulkUpdateDto.Updates.Notes != null)
                {
                    Console.WriteLine($"DEBUG: Updating Notes from '{assignment.Notes}' to '{bulkUpdateDto.Updates.Notes}'");
                    assignment.Notes = bulkUpdateDto.Updates.Notes;
                }

                assignment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Return updated assignments
            var result = new List<AssignmentTaskDto>();
            foreach (var assignment in assignments)
            {
                result.Add(await GetAssignmentTaskDtoAsync(assignment.Id));
            }

            return result;
        }

        public async Task<List<AssignmentTaskDto>> CreateBulkAssignmentsAsync(BulkAssignmentDto bulkDto)
        {
            var results = new List<AssignmentTaskDto>();

            if (bulkDto.ValidateConflicts)
            {
                foreach (var assignmentDto in bulkDto.Assignments)
                {
                    if (!await ValidateAssignmentAsync(assignmentDto))
                    {
                        if (!bulkDto.AllowOverbooking)
                        {
                            throw new InvalidOperationException($"Assignment validation failed for task {assignmentDto.TaskId}");
                        }
                    }
                }
            }

            foreach (var assignmentDto in bulkDto.Assignments)
            {
                try
                {
                    var result = await CreateAssignmentAsync(assignmentDto);
                    results.Add(result);
                }
                catch (Exception)
                {
                    if (!bulkDto.AllowOverbooking) throw;
                }
            }

            return results;
        }

        // Assignment queries
        public async Task<List<AssignmentTaskDto>> GetAssignmentsByDateRangeAsync(DateRangeDto dateRange)
        {
            var query = _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Where(a => a.IsActive && 
                           a.AssignedDate >= dateRange.StartDate.Date && 
                           a.AssignedDate <= dateRange.EndDate.Date);

            if (dateRange.EmployeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == dateRange.EmployeeId.Value);
            }

            var assignments = await query.ToListAsync();
            
            // Group assignments by date and slot to calculate automatic hours
            var result = new List<AssignmentTaskDto>();
            var groupedAssignments = assignments.GroupBy(a => new { a.AssignedDate, a.Slot, a.EmployeeId });
            
            foreach (var group in groupedAssignments)
            {
                var slotTaskCount = group.Count();
                result.AddRange(group.Select(a => MapToAssignmentTaskDto(a, slotTaskCount)));
            }
            
            return result;
        }

        public async Task<List<AssignmentTaskDto>> GetEmployeeAssignmentsAsync(int employeeId, DateTime startDate, DateTime endDate)
        {
            var dateRange = new DateRangeDto
            {
                EmployeeId = employeeId,
                StartDate = startDate,
                EndDate = endDate
            };

            return await GetAssignmentsByDateRangeAsync(dateRange);
        }

        public async Task<AssignmentTaskDto?> GetAssignmentByIdAsync(int assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .FirstOrDefaultAsync(a => a.Id == assignmentId && a.IsActive);

            if (assignment == null) return null;
            
            // For single assignment queries, we need to calculate slot task count
            var slotTaskCount = await _context.Assignments
                .Where(a => a.IsActive && 
                           a.EmployeeId == assignment.EmployeeId &&
                           a.AssignedDate == assignment.AssignedDate &&
                           a.Slot == assignment.Slot)
                .CountAsync();
                
            return MapToAssignmentTaskDto(assignment, slotTaskCount);
        }

        // Capacity and availability
        public async Task<CapacityResponseDto> CheckCapacityAsync(CapacityCheckDto capacityCheck)
        {
            var existingAssignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Where(a => a.IsActive && 
                           a.EmployeeId == capacityCheck.EmployeeId &&
                           a.AssignedDate == capacityCheck.Date.Date &&
                           a.Slot == capacityCheck.Slot)
                .ToListAsync();

            var currentCount = existingAssignments.Count;
            var isAvailable = currentCount < MAX_TASKS_PER_SLOT;
            var isOverbooked = currentCount > MAX_TASKS_PER_SLOT;

            return new CapacityResponseDto
            {
                EmployeeId = capacityCheck.EmployeeId,
                Date = capacityCheck.Date.Date,
                Slot = capacityCheck.Slot,
                CurrentAssignments = currentCount,
                MaxCapacity = MAX_TASKS_PER_SLOT,
                IsAvailable = isAvailable,
                IsOverbooked = isOverbooked,
                ExistingTasks = existingAssignments.Select(a => MapToAssignmentTaskDto(a, existingAssignments.Count)).ToList()
            };
        }

        public async Task<List<CapacityResponseDto>> GetCapacityForDateRangeAsync(int employeeId, DateTime startDate, DateTime endDate)
        {
            var results = new List<CapacityResponseDto>();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                // Only process weekdays (Monday-Friday)
                if (IsBusinessDay(currentDate))
                {
                    foreach (Slot slot in Enum.GetValues<Slot>())
                    {
                        var capacityCheck = new CapacityCheckDto
                        {
                            EmployeeId = employeeId,
                            Date = currentDate,
                            Slot = slot
                        };

                        var capacity = await CheckCapacityAsync(capacityCheck);
                        results.Add(capacity);
                    }
                }

                currentDate = currentDate.AddDays(1);
            }

            return results;
        }

        public async Task<Dictionary<DateTime, Dictionary<Slot, bool>>> GetAvailabilityMatrixAsync(int employeeId, DateTime startDate, DateTime endDate)
        {
            var matrix = new Dictionary<DateTime, Dictionary<Slot, bool>>();
            var assignments = await _context.Assignments
                .Where(a => a.IsActive && 
                           a.EmployeeId == employeeId &&
                           a.AssignedDate >= startDate.Date &&
                           a.AssignedDate <= endDate.Date)
                .GroupBy(a => new { a.AssignedDate, a.Slot })
                .Select(g => new { g.Key.AssignedDate, g.Key.Slot, Count = g.Count() })
                .ToListAsync();

            var currentDate = startDate.Date;
            while (currentDate <= endDate.Date)
            {
                // Only process weekdays (Monday-Friday)
                if (IsBusinessDay(currentDate))
                {
                    matrix[currentDate] = new Dictionary<Slot, bool>();
                    
                    foreach (Slot slot in Enum.GetValues<Slot>())
                    {
                        var assignmentCount = assignments
                            .Where(a => a.AssignedDate == currentDate && a.Slot == slot)
                            .Sum(a => a.Count);
                        
                        matrix[currentDate][slot] = assignmentCount < MAX_TASKS_PER_SLOT;
                    }
                }

                currentDate = currentDate.AddDays(1);
            }

            return matrix;
        }

        // Calendar calculations
        public DateTime GetViewStartDate(DateTime baseDate, CalendarViewType viewType)
        {
            var date = baseDate.Date;

            return viewType switch
            {
                CalendarViewType.Day => date,
                // For Week view, use the exact date provided (sliding window mode)
                // The frontend manages the window start position
                CalendarViewType.Week => SkipWeekendIfNecessary(date),
                // For BiWeek view, also use sliding window from the provided date
                CalendarViewType.BiWeek => SkipWeekendIfNecessary(date),
                CalendarViewType.Month => new DateTime(date.Year, date.Month, 1),
                _ => date
            };
        }

        public DateTime GetViewEndDate(DateTime startDate, CalendarViewType viewType)
        {
            return viewType switch
            {
                CalendarViewType.Day => startDate,
                CalendarViewType.Week => GetWeekdayEndDate(startDate, 5), // 5 weekdays
                CalendarViewType.BiWeek => GetWeekdayEndDate(startDate, 10), // 10 weekdays
                CalendarViewType.Month => GetMonthWeekdayEndDate(startDate),
                _ => startDate
            };
        }

        public List<CalendarDayDto> GenerateCalendarDays(DateTime startDate, DateTime endDate)
        {
            var days = new List<CalendarDayDto>();
            var currentDate = startDate.Date;
            var today = DateTime.Today;

            while (currentDate <= endDate.Date)
            {
                // Only include weekdays (Monday-Friday)
                if (IsBusinessDay(currentDate))
                {
                    days.Add(new CalendarDayDto
                    {
                        Date = currentDate,
                        IsToday = currentDate == today,
                        DisplayDate = currentDate.ToString("dd"),
                        DayName = currentDate.ToString("ddd", CultureInfo.InvariantCulture)
                    });
                }

                currentDate = currentDate.AddDays(1);
            }

            return days;
        }

        public bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        }

        public bool IsBusinessDay(DateTime date)
        {
            return !IsWeekend(date);
        }

        // Validation
        public async Task<bool> ValidateAssignmentAsync(CreateAssignmentDto assignment)
        {
            // Check if employee exists (all employees in DB are active)
            var employee = await _context.Employees.FindAsync(assignment.EmployeeId);
            if (employee == null) return false;

            // Check if task exists and is active
            var task = await _context.ProjectTasks.FindAsync(assignment.TaskId);
            if (task == null || !task.IsActive) return false;

            // Check capacity
            var capacity = await CheckCapacityAsync(new CapacityCheckDto
            {
                EmployeeId = assignment.EmployeeId,
                Date = assignment.AssignedDate,
                Slot = assignment.Slot
            });

            return capacity.IsAvailable;
        }

        public async Task<bool> ValidateEmployeeAvailabilityAsync(int employeeId, DateTime date, Slot slot)
        {
            var capacity = await CheckCapacityAsync(new CapacityCheckDto
            {
                EmployeeId = employeeId,
                Date = date,
                Slot = slot
            });

            return capacity.IsAvailable;
        }

        public async Task<List<string>> GetAssignmentConflictsAsync(CreateAssignmentDto assignment)
        {
            var conflicts = new List<string>();

            var employee = await _context.Employees.FindAsync(assignment.EmployeeId);
            if (employee == null)
            {
                conflicts.Add("Employee not found");
            }

            var task = await _context.ProjectTasks.FindAsync(assignment.TaskId);
            if (task == null || !task.IsActive)
            {
                conflicts.Add("Task not found or inactive");
            }

            var capacity = await CheckCapacityAsync(new CapacityCheckDto
            {
                EmployeeId = assignment.EmployeeId,
                Date = assignment.AssignedDate,
                Slot = assignment.Slot
            });

            if (!capacity.IsAvailable)
            {
                conflicts.Add($"Employee has no available capacity for {assignment.Slot} slot on {assignment.AssignedDate:yyyy-MM-dd}");
            }

            return conflicts;
        }

        // Statistics and reporting
        public async Task<Dictionary<int, int>> GetEmployeeWorkloadAsync(DateTime startDate, DateTime endDate)
        {
            var workload = await _context.Assignments
                .Where(a => a.IsActive && 
                           a.AssignedDate >= startDate.Date && 
                           a.AssignedDate <= endDate.Date)
                .GroupBy(a => a.EmployeeId)
                .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.EmployeeId, x => x.Count);

            return workload;
        }

        public async Task<Dictionary<DateTime, int>> GetDailyCapacityUtilizationAsync(DateTime startDate, DateTime endDate)
        {
            var utilization = await _context.Assignments
                .Where(a => a.IsActive && 
                           a.AssignedDate >= startDate.Date && 
                           a.AssignedDate <= endDate.Date)
                .GroupBy(a => a.AssignedDate)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Date, x => x.Count);

            return utilization;
        }

        public async Task<List<AssignmentTaskDto>> GetOverdueAssignmentsAsync()
        {
            var today = DateTime.Today;
            var assignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Where(a => a.IsActive && 
                           a.Task.DueDate.HasValue && 
                           a.Task.DueDate.Value.Date < today &&
                           a.Task.Status != DesignPlanner.Core.Enums.TaskStatus.Done)
                .ToListAsync();

            // For overdue assignments, use single task hours (4h each)
            return assignments.Select(a => MapToAssignmentTaskDto(a, 1)).ToList();
        }

        public async Task<List<AssignmentTaskDto>> GetUpcomingDeadlinesAsync(int days = 7)
        {
            var startDate = DateTime.Today;
            var endDate = startDate.AddDays(days);

            var assignments = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Where(a => a.IsActive && 
                           a.Task.DueDate.HasValue && 
                           a.Task.DueDate.Value.Date >= startDate &&
                           a.Task.DueDate.Value.Date <= endDate &&
                           a.Task.Status != DesignPlanner.Core.Enums.TaskStatus.Done)
                .ToListAsync();

            // For upcoming deadlines, use single task hours (4h each)
            return assignments.Select(a => MapToAssignmentTaskDto(a, 1)).ToList();
        }

        // Private helper methods
        private DateTime SkipWeekendIfNecessary(DateTime date)
        {
            // If the date falls on a weekend, move to the next Monday
            if (date.DayOfWeek == DayOfWeek.Saturday)
                return date.AddDays(2);
            if (date.DayOfWeek == DayOfWeek.Sunday)
                return date.AddDays(1);
            return date;
        }

        private DateTime GetWeekStart(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff);
        }
        
        private DateTime GetWeekdayEndDate(DateTime startDate, int weekdayCount)
        {
            var currentDate = startDate;
            var weekdaysFound = 0;
            
            while (weekdaysFound < weekdayCount)
            {
                if (IsBusinessDay(currentDate))
                {
                    weekdaysFound++;
                    if (weekdaysFound == weekdayCount)
                    {
                        return currentDate;
                    }
                }
                currentDate = currentDate.AddDays(1);
            }
            
            return currentDate;
        }
        
        private DateTime GetMonthWeekdayEndDate(DateTime startDate)
        {
            var endOfMonth = startDate.AddMonths(1).AddDays(-1);
            return endOfMonth;
        }

        private DateTime GetBiWeekStart(DateTime date)
        {
            var weekStart = GetWeekStart(date);
            var weekNumber = GetWeekOfYear(weekStart);
            var isOddWeek = weekNumber % 2 == 1;
            
            return isOddWeek ? weekStart : weekStart.AddDays(-7);
        }

        private int GetWeekOfYear(DateTime date)
        {
            var culture = CultureInfo.CurrentCulture;
            var calendar = culture.Calendar;
            return calendar.GetWeekOfYear(date, culture.DateTimeFormat.CalendarWeekRule, culture.DateTimeFormat.FirstDayOfWeek);
        }

        private async Task<List<Employee>> GetEmployeesForViewAsync(int? employeeId, bool includeInactive)
        {
            var query = _context.Employees.Include(e => e.Team).AsQueryable();

            if (employeeId.HasValue)
            {
                query = query.Where(e => e.Id == employeeId.Value);
            }

            // Note: All employees in database are active by definition
            // if (!includeInactive) { ... }

            return await query.Include(e => e.User).OrderBy(e => e.User.FirstName).ThenBy(e => e.User.LastName).ToListAsync();
        }

        private async Task<List<Assignment>> GetAssignmentsForDateRangeAsync(DateTime startDate, DateTime endDate, int? employeeId)
        {
            var query = _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Where(a => a.IsActive && 
                           a.AssignedDate >= startDate.Date && 
                           a.AssignedDate <= endDate.Date);

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
            }

            return await query.ToListAsync();
        }

        private async Task<List<EmployeeScheduleDto>> BuildEmployeeSchedulesAsync(List<Employee> employees, List<Assignment> assignments, DateTime startDate, DateTime endDate)
        {
            var schedules = new List<EmployeeScheduleDto>();

            foreach (var employee in employees)
            {
                var employeeAssignments = assignments.Where(a => a.EmployeeId == employee.Id).ToList();
                var dayAssignments = new List<DayAssignmentDto>();

                var currentDate = startDate.Date;
                while (currentDate <= endDate.Date)
                {
                    // Only process weekdays (Monday-Friday)
                    if (IsBusinessDay(currentDate))
                    {
                        var dayTasks = employeeAssignments.Where(a => a.AssignedDate == currentDate).ToList();
                        
                        var morningAssignments = dayTasks.Where(a => a.Slot == Slot.Morning).ToList();
                        var afternoonAssignments = dayTasks.Where(a => a.Slot == Slot.Afternoon).ToList();
                        
                        var morningTasks = morningAssignments.Select(a => MapToAssignmentTaskDto(a, morningAssignments.Count)).ToList();
                        var afternoonTasks = afternoonAssignments.Select(a => MapToAssignmentTaskDto(a, afternoonAssignments.Count)).ToList();

                        var dayAssignment = new DayAssignmentDto
                        {
                            Date = currentDate,
                            TotalAssignments = dayTasks.Count,
                            HasConflicts = morningTasks.Count > MAX_TASKS_PER_SLOT || afternoonTasks.Count > MAX_TASKS_PER_SLOT
                        };

                        if (morningTasks.Any())
                        {
                            dayAssignment.MorningSlot = new TimeSlotAssignmentDto
                            {
                                Slot = Slot.Morning,
                                Tasks = morningTasks,
                                AvailableCapacity = MAX_TASKS_PER_SLOT - morningTasks.Count,
                                IsOverbooked = morningTasks.Count > MAX_TASKS_PER_SLOT
                            };
                        }

                        if (afternoonTasks.Any())
                        {
                            dayAssignment.AfternoonSlot = new TimeSlotAssignmentDto
                            {
                                Slot = Slot.Afternoon,
                                Tasks = afternoonTasks,
                                AvailableCapacity = MAX_TASKS_PER_SLOT - afternoonTasks.Count,
                                IsOverbooked = afternoonTasks.Count > MAX_TASKS_PER_SLOT
                            };
                        }

                        dayAssignments.Add(dayAssignment);
                    }
                    
                    currentDate = currentDate.AddDays(1);
                }

                var schedule = new EmployeeScheduleDto
                {
                    EmployeeId = employee.Id,
                    EmployeeName = $"{employee.User.FirstName} {employee.User.LastName}",
                    Role = employee.Position ?? "Employee",
                    Team = employee.Team?.Name ?? "Unassigned",
                    DayAssignments = dayAssignments
                };

                schedules.Add(schedule);
            }

            return schedules;
        }

        private AssignmentTaskDto MapToAssignmentTaskDto(Assignment assignment, int? slotTaskCount = null)
        {
            var employeeName = assignment.Employee?.User != null 
                ? $"{assignment.Employee.User.FirstName?.Trim()} {assignment.Employee.User.LastName?.Trim()}".Trim()
                : "Unknown Employee";

            // Ensure we never have an empty employee name
            if (string.IsNullOrWhiteSpace(employeeName))
            {
                employeeName = $"Employee {assignment.EmployeeId}";
            }

            // Calculate automatic hours: 4 hours divided by number of tasks in the slot
            var automaticHours = CalculateAutomaticHours(slotTaskCount ?? 1);
            
            return new AssignmentTaskDto
            {
                AssignmentId = assignment.Id,
                TaskId = assignment.TaskId,
                TaskTitle = assignment.Task.Title,
                TaskTypeName = assignment.Task.TaskType?.Name ?? "Task",
                ProjectName = assignment.Task.Project.Name,
                ClientCode = assignment.Task.Project.Client.Code,
                ClientName = assignment.Task.Project.Client.Name,
                ClientColor = GetClientColor(assignment.Task.Project.Client.Code),
                AssignedDate = assignment.AssignedDate,
                Slot = assignment.Slot,
                TaskStatus = assignment.Task.Status,
                Priority = assignment.Task.Priority,
                DueDate = assignment.Task.DueDate,
                Notes = assignment.Notes,
                IsActive = assignment.IsActive,
                EmployeeId = assignment.EmployeeId,
                EmployeeName = employeeName,
                Hours = automaticHours // Use automatic calculation
            };
        }

        // Helper method to calculate automatic hours based on slot task count
        private double CalculateAutomaticHours(int taskCount)
        {
            if (taskCount <= 0) return 0;
            var hours = 4.0 / taskCount;
            return Math.Round(hours * 100) / 100; // Round to 2 decimal places
        }

        private async Task<AssignmentTaskDto> GetAssignmentTaskDtoAsync(int assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .FirstAsync(a => a.Id == assignmentId);

            // For single assignment queries, we need to calculate slot task count
            var slotTaskCount = await _context.Assignments
                .Where(a => a.IsActive && 
                           a.EmployeeId == assignment.EmployeeId &&
                           a.AssignedDate == assignment.AssignedDate &&
                           a.Slot == assignment.Slot)
                .CountAsync();
                
            return MapToAssignmentTaskDto(assignment, slotTaskCount);
        }

        private string GetClientColor(string clientCode)
        {
            // Default color scheme for clients
            return clientCode.ToUpper() switch
            {
                "AWS" => "#FF9900", // Amazon Orange
                "MSFT" => "#0078D4", // Microsoft Blue
                "GOOGLE" => "#4285F4", // Google Blue
                "EQX" => "#00A9CE", // Equinix Cyan
                "TATE" => "#E63946", // Tate Red
                _ => "#6C757D" // Default Gray
            };
        }

        // Team management operations
        public async Task<List<object>> GetManagerTeamsAsync(int userId)
        {
            // Get teams where the user is designated as a manager
            // This assumes there's a way to identify team managers - you might need to add a ManagerId to Team entity
            var managedTeams = await _context.Teams
                .Where(t => t.IsActive)
                // For now, we'll assume all teams can be managed by managers - you should add proper team management logic
                .Select(t => new
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    Description = t.Description,
                    Color = ScheduleService.GetTeamColor(t.Code),
                    MemberCount = t.Members.Count(),
                    IsManaged = true // This should be based on actual manager relationship
                })
                .ToListAsync<object>();

            return managedTeams;
        }

        public async Task<List<object>> GetAllTeamsWithManagedStatusAsync(int userId)
        {
            // Get all teams with indication of which ones the user manages
            var allTeams = await _context.Teams
                .Where(t => t.IsActive)
                .Select(t => new
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    Description = t.Description,
                    Color = ScheduleService.GetTeamColor(t.Code),
                    MemberCount = t.Members.Count(),
                    IsManaged = true // This should be based on actual manager relationship with userId
                })
                .ToListAsync<object>();

            return allTeams;
        }

        public async Task<bool> UserCanViewTeamAsync(int userId, int teamId)
        {
            // Check if user has permission to view this team
            // For now, allowing all managers to view all teams - you should implement proper permission logic
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            return user != null && (user.Role == UserRole.Manager || user.Role == UserRole.Admin);
        }

        public async Task<CalendarViewDto> GetTeamCalendarViewAsync(ScheduleRequestDto request)
        {
            var startDate = GetViewStartDate(request.StartDate, request.ViewType);
            var endDate = GetViewEndDate(startDate, request.ViewType);

            // Get employees for specific team
            var employees = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Team)
                .Where(e => e.TeamId == request.TeamId)
                .ToListAsync();

            var assignments = await GetAssignmentsForDateRangeAsync(startDate, endDate, null, request.TeamId);

            // Get all task types from database
            var taskTypes = await _context.TaskTypes
                                .Select(tt => new TaskTypeDto
                {
                    Id = tt.Id,
                    Name = tt.Name
                })
                .ToListAsync();

            var calendarView = new CalendarViewDto
            {
                StartDate = startDate,
                EndDate = endDate,
                ViewType = request.ViewType,
                Days = GenerateCalendarDays(startDate, endDate),
                Employees = await BuildEmployeeSchedulesAsync(employees, assignments, startDate, endDate),
                TaskTypes = taskTypes
            };

            return calendarView;
        }

        public async Task<object> GetGlobalCalendarViewAsync(int userId, ScheduleRequestDto request)
        {
            var startDate = GetViewStartDate(request.StartDate, request.ViewType);
            var endDate = GetViewEndDate(startDate, request.ViewType);

            // Get all teams with their employees
            var teamsWithEmployees = await _context.Teams
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Where(t => t.IsActive)
                .ToListAsync();

            // Get all assignments for the date range
            var assignments = await GetAssignmentsForDateRangeAsync(startDate, endDate);

            var result = new
            {
                StartDate = startDate,
                EndDate = endDate,
                ViewType = request.ViewType,
                Days = GenerateCalendarDays(startDate, endDate),
                Teams = await Task.WhenAll(teamsWithEmployees.Select(async team => new
                {
                    Id = team.Id,
                    Name = team.Name,
                    Code = team.Code,
                    Color = ScheduleService.GetTeamColor(team.Code),
                    IsManaged = true, // This should be based on actual manager relationship with userId
                    Employees = await BuildEmployeeSchedulesAsync(
                        team.Members.ToList(), 
                        assignments.Where(a => team.Members.Any(m => m.Id == a.EmployeeId)).ToList(),
                        startDate, 
                        endDate
                    )
                }))
            };

            return result;
        }

        private static string GetTeamColor(string teamCode)
        {
            // Default color scheme for teams
            return teamCode.ToUpper() switch
            {
                "DEV" => "#10b981", // Green
                "DESIGN" => "#8b5cf6", // Purple
                "QA" => "#f59e0b", // Yellow
                "DEVOPS" => "#ef4444", // Red
                "PM" => "#3b82f6", // Blue
                "MARKETING" => "#f97316", // Orange
                _ => "#6b7280" // Default Gray
            };
        }

        private async Task<List<Assignment>> GetAssignmentsForDateRangeAsync(DateTime startDate, DateTime endDate, int? employeeId = null, int? teamId = null)
        {
            var query = _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.Client)
                .Include(a => a.Task.TaskType)
                .Include(a => a.Employee)
                    .ThenInclude(e => e.User)
                .Include(a => a.Employee.Team)
                .Where(a => a.IsActive && a.AssignedDate >= startDate.Date && a.AssignedDate <= endDate.Date);

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
            }

            if (teamId.HasValue)
            {
                query = query.Where(a => a.Employee.TeamId == teamId.Value);
            }

            return await query.ToListAsync();
        }
    }
}