using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    public class AbsenceService : IAbsenceService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITeamAuthorizationService _authService;

        public AbsenceService(ApplicationDbContext context, ITeamAuthorizationService authService)
        {
            _context = context;
            _authService = authService;
        }

        public async Task<AbsenceOverviewDto> GetAbsenceOverviewAsync(int userId)
        {
            var currentEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (currentEmployee == null)
                throw new UnauthorizedAccessException("User is not an employee");

            return await GetEmployeeAbsenceOverviewAsync(userId, currentEmployee.Id);
        }

        public async Task<AbsenceOverviewDto> GetEmployeeAbsenceOverviewAsync(int userId, int employeeId)
        {
            if (!await CanUserManageEmployeeAbsenceAsync(userId, employeeId))
                throw new UnauthorizedAccessException("Cannot access this employee's absence data");

            var currentYear = DateTime.UtcNow.Year;
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                throw new ArgumentException("Employee not found");

            // Get or create current year allocation
            var allocation = await GetOrCreateAllocationAsync(employeeId, currentYear);

            // Get absence records for current year
            var records = await _context.AbsenceRecords
                .Include(ar => ar.Employee)
                .ThenInclude(e => e.User)
                .Where(ar => ar.EmployeeId == employeeId && ar.StartDate.Year == currentYear)
                .OrderByDescending(ar => ar.StartDate)
                .ToListAsync();

            var recordDtos = records.Select(MapToRecordDto).ToList();

            // Calculate used days by type
            var usedDaysByType = records
                .GroupBy(r => r.AbsenceType)
                .ToDictionary(g => g.Key, g => g.Sum(r => r.Hours / 8.0)); // Assuming 8 hours = 1 day

            var allocationDto = MapToAllocationDto(allocation, usedDaysByType);

            return new AbsenceOverviewDto
            {
                Allocations = new List<AbsenceAllocationDto> { allocationDto },
                Records = recordDtos,
                TotalUsedDaysByType = usedDaysByType
            };
        }

        public async Task<AbsenceAllocationDto?> GetEmployeeAllocationAsync(int employeeId, int year)
        {
            var allocation = await _context.AbsenceAllocations
                .Include(aa => aa.Employee)
                .ThenInclude(e => e.User)
                .FirstOrDefaultAsync(aa => aa.EmployeeId == employeeId && aa.Year == year);

            if (allocation == null) return null;

            // Calculate used days
            var usedDays = await CalculateUsedDaysAsync(employeeId, year);
            return MapToAllocationDto(allocation, usedDays);
        }

        public async Task<List<AbsenceAllocationDto>> GetTeamAllocationsAsync(int userId, int? teamId = null)
        {
            var currentYear = DateTime.Now.Year;
            var currentUser = await _context.Users.Include(u => u.Employee).FirstOrDefaultAsync(u => u.Id == userId);

            Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - userId: {userId}");
            Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - currentUser: {currentUser?.Username}");
            Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - currentUser.Employee: {currentUser?.Employee?.Id}");

            // Get managed employees (for managers/admins)
            var managedEmployees = await _authService.GetManagedEmployeesAsync(userId);

            Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - managedEmployees count BEFORE: {managedEmployees.Count}");

            // If user is not a manager and has no managed employees, return only their own allocation
            if (managedEmployees.Count == 0 && currentUser?.Employee != null)
            {
                Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - Adding current user's employee to list");
                managedEmployees = new List<Employee> { currentUser.Employee };
            }

            Console.WriteLine($"🔍🔍 GetTeamAllocationsAsync - managedEmployees count AFTER: {managedEmployees.Count}");

            // Filter by team if specified
            if (teamId.HasValue)
            {
                managedEmployees = managedEmployees.Where(e => e.TeamId == teamId.Value).ToList();
            }

            var result = new List<AbsenceAllocationDto>();

            // For each managed employee (or own employee), get or create their allocation
            foreach (var employee in managedEmployees)
            {
                var allocation = await _context.AbsenceAllocations
                    .Include(aa => aa.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(aa => aa.EmployeeId == employee.Id && aa.Year == currentYear);

                if (allocation == null)
                {
                    // Create default allocation if none exists (only for annual leave - others are usage-only)
                    allocation = new AbsenceAllocation
                    {
                        EmployeeId = employee.Id,
                        Year = currentYear,
                        AnnualLeaveDays = 25, // Default annual leave days
                        SickDaysAllowed = 0, // No allocation limit for sick days - usage only
                        OtherLeaveDaysAllowed = 0, // No allocation limit for other leave - usage only
                        Employee = employee
                    };

                    _context.AbsenceAllocations.Add(allocation);
                    await _context.SaveChangesAsync();

                    // Reload with includes
                    allocation = await _context.AbsenceAllocations
                        .Include(aa => aa.Employee)
                        .ThenInclude(e => e.User)
                        .FirstAsync(aa => aa.Id == allocation.Id);
                }

                var usedDays = await CalculateUsedDaysAsync(allocation.EmployeeId, allocation.Year);
                result.Add(MapToAllocationDto(allocation, usedDays));
            }

            return result.OrderBy(r => r.EmployeeName).ToList();
        }

        public async Task<AbsenceAllocationDto> CreateAllocationAsync(int userId, CreateAbsenceAllocationDto dto)
        {
            if (!await _authService.CanManageEmployeeAsync(userId, dto.EmployeeId))
                throw new UnauthorizedAccessException("Cannot manage this employee's allocations");

            // Check if allocation already exists
            var existing = await _context.AbsenceAllocations
                .FirstOrDefaultAsync(aa => aa.EmployeeId == dto.EmployeeId && aa.Year == dto.Year);

            if (existing != null)
                throw new InvalidOperationException("Allocation for this employee and year already exists");

            var allocation = new AbsenceAllocation
            {
                EmployeeId = dto.EmployeeId,
                Year = dto.Year,
                AnnualLeaveDays = dto.AnnualLeaveDays,
                SickDaysAllowed = dto.SickDaysAllowed,
                OtherLeaveDaysAllowed = dto.OtherLeaveDaysAllowed
            };

            _context.AbsenceAllocations.Add(allocation);
            await _context.SaveChangesAsync();

            // Reload with includes
            allocation = await _context.AbsenceAllocations
                .Include(aa => aa.Employee)
                .ThenInclude(e => e.User)
                .FirstAsync(aa => aa.Id == allocation.Id);

            var usedDays = await CalculateUsedDaysAsync(allocation.EmployeeId, allocation.Year);
            return MapToAllocationDto(allocation, usedDays);
        }

        public async Task<AbsenceAllocationDto> UpdateAllocationAsync(int userId, UpdateAbsenceAllocationDto dto)
        {
            var allocation = await _context.AbsenceAllocations
                .Include(aa => aa.Employee)
                .ThenInclude(e => e.User)
                .FirstOrDefaultAsync(aa => aa.Id == dto.Id);

            if (allocation == null)
                throw new ArgumentException("Allocation not found");

            if (!await _authService.CanManageEmployeeAsync(userId, allocation.EmployeeId))
                throw new UnauthorizedAccessException("Cannot manage this employee's allocations");

            allocation.AnnualLeaveDays = dto.AnnualLeaveDays;
            allocation.SickDaysAllowed = dto.SickDaysAllowed;
            allocation.OtherLeaveDaysAllowed = dto.OtherLeaveDaysAllowed;
            allocation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var usedDays = await CalculateUsedDaysAsync(allocation.EmployeeId, allocation.Year);
            return MapToAllocationDto(allocation, usedDays);
        }

        public async Task<bool> DeleteAllocationAsync(int userId, int allocationId)
        {
            var allocation = await _context.AbsenceAllocations
                .FirstOrDefaultAsync(aa => aa.Id == allocationId);

            if (allocation == null) return false;

            if (!await _authService.CanManageEmployeeAsync(userId, allocation.EmployeeId))
                throw new UnauthorizedAccessException("Cannot manage this employee's allocations");

            _context.AbsenceAllocations.Remove(allocation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AbsenceRecordDto>> GetEmployeeAbsenceRecordsAsync(int userId, int employeeId, int? year = null)
        {
            if (!await CanUserManageEmployeeAbsenceAsync(userId, employeeId))
                throw new UnauthorizedAccessException("Cannot access this employee's absence records");

            var query = _context.AbsenceRecords
                .Include(ar => ar.Employee)
                .ThenInclude(e => e.User)
                .Where(ar => ar.EmployeeId == employeeId);

            if (year.HasValue)
            {
                query = query.Where(ar => ar.StartDate.Year == year.Value);
            }

            var records = await query
                .OrderByDescending(ar => ar.StartDate)
                .ToListAsync();

            return records.Select(MapToRecordDto).ToList();
        }

        public async Task<AbsenceRecordDto> CreateAbsenceRecordAsync(int userId, CreateAbsenceRecordDto dto)
        {
            // Allow managers/admins to create for anyone they manage, OR allow users to create for themselves
            var currentUserEmployee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
            var isCreatingForSelf = currentUserEmployee != null && currentUserEmployee.Id == dto.EmployeeId;

            if (!isCreatingForSelf && !await _authService.CanManageEmployeeAsync(userId, dto.EmployeeId))
                throw new UnauthorizedAccessException("Cannot manage this employee's absences");

            // Validate allocation if annual leave
            if (dto.AbsenceType == AbsenceType.AnnualLeave)
            {
                var hasAllocation = await HasSufficientAllocationAsync(dto.EmployeeId, dto.AbsenceType, dto.Hours, dto.StartDate.Year);
                if (!hasAllocation)
                    throw new InvalidOperationException("Insufficient annual leave allocation");
            }

            var record = new AbsenceRecord
            {
                EmployeeId = dto.EmployeeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                AbsenceType = dto.AbsenceType,
                Hours = dto.Hours,
                Slot = dto.Slot, // For half-day leaves, specify which slot
                Notes = dto.Notes,
                AssignmentId = dto.AssignmentId,
                IsApproved = true // Auto-approve for now
            };

            _context.AbsenceRecords.Add(record);
            await _context.SaveChangesAsync();

            // Reload with includes
            record = await _context.AbsenceRecords
                .Include(ar => ar.Employee)
                .ThenInclude(e => e.User)
                .FirstAsync(ar => ar.Id == record.Id);

            return MapToRecordDto(record);
        }

        public async Task<bool> DeleteAbsenceRecordAsync(int userId, int recordId)
        {
            var record = await _context.AbsenceRecords
                .FirstOrDefaultAsync(ar => ar.Id == recordId);

            if (record == null) return false;

            if (!await _authService.CanManageEmployeeAsync(userId, record.EmployeeId))
                throw new UnauthorizedAccessException("Cannot manage this employee's absences");

            _context.AbsenceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteAbsenceRecordsByDateAsync(int userId, DateTime date, int? employeeId = null)
        {
            Console.WriteLine($"🔍 DeleteAbsenceRecordsByDateAsync called with date: {date:yyyy-MM-dd}, userId: {userId}, employeeId: {employeeId}");

            // First, let's see what records exist
            var allRecords = await _context.AbsenceRecords.ToListAsync();
            Console.WriteLine($"🔍 Total AbsenceRecords in database: {allRecords.Count}");
            foreach (var record in allRecords)
            {
                Console.WriteLine($"🔍 Record ID: {record.Id}, EmployeeId: {record.EmployeeId}, StartDate: {record.StartDate:yyyy-MM-dd}, EndDate: {record.EndDate:yyyy-MM-dd}, AbsenceType: {record.AbsenceType}");
            }

            // Get all absence records for the specified date using date range (more reliable than .Date)
            var startOfDay = date.Date;
            var endOfDay = date.Date.AddDays(1);
            var query = _context.AbsenceRecords
                .Where(ar => ar.StartDate >= startOfDay && ar.StartDate < endOfDay);

            Console.WriteLine($"🔍 Looking for records between {startOfDay:yyyy-MM-dd} and {endOfDay:yyyy-MM-dd}");
            Console.WriteLine($"🔍 Input date parameter: {date:yyyy-MM-dd HH:mm:ss}");

            // If employeeId is specified, filter by employee
            if (employeeId.HasValue)
            {
                query = query.Where(ar => ar.EmployeeId == employeeId.Value);

                // Check if user can manage this specific employee
                if (!await _authService.CanManageEmployeeAsync(userId, employeeId.Value))
                    throw new UnauthorizedAccessException("Cannot manage this employee's absences");
            }
            else
            {
                // If no specific employee, ensure user can manage all affected employees
                var recordsToDelete = await query.ToListAsync();
                var employeeIds = recordsToDelete.Select(r => r.EmployeeId).Distinct().ToList();

                foreach (var empId in employeeIds)
                {
                    if (!await _authService.CanManageEmployeeAsync(userId, empId))
                        throw new UnauthorizedAccessException($"Cannot manage absences for employee {empId}");
                }
            }

            var records = await query.ToListAsync();
            var deletedCount = records.Count;

            Console.WriteLine($"🔍 Found {deletedCount} records to delete");

            if (deletedCount > 0)
            {
                _context.AbsenceRecords.RemoveRange(records);
                await _context.SaveChangesAsync();
                Console.WriteLine($"🔍 Successfully deleted {deletedCount} records");
            }

            return deletedCount;
        }

        public async Task<int> ClearAbsenceAssignmentsByDateAsync(int userId, DateTime date, int? employeeId = null)
        {
            Console.WriteLine($"🔍 ClearAbsenceAssignmentsByDateAsync called with date: {date:yyyy-MM-dd}, userId: {userId}, employeeId: {employeeId}");

            // Get all assignments for the specified date that have absence type set using date range
            var startOfDay = date.Date;
            var endOfDay = date.Date.AddDays(1);
            var query = _context.Assignments
                .Where(a => a.AssignedDate >= startOfDay && a.AssignedDate < endOfDay && a.AbsenceType.HasValue);

            Console.WriteLine($"🔍 Looking for assignments between {startOfDay:yyyy-MM-dd} and {endOfDay:yyyy-MM-dd} with AbsenceType set");

            // If employeeId is specified, filter by employee
            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);

                // Check if user can manage this specific employee
                if (!await _authService.CanManageEmployeeAsync(userId, employeeId.Value))
                    throw new UnauthorizedAccessException("Cannot manage this employee's assignments");
            }
            else
            {
                // If no specific employee, ensure user can manage all affected employees
                var assignmentsToUpdate = await query.ToListAsync();
                var employeeIds = assignmentsToUpdate.Select(a => a.EmployeeId).Distinct().ToList();

                foreach (var empId in employeeIds)
                {
                    if (!await _authService.CanManageEmployeeAsync(userId, empId))
                        throw new UnauthorizedAccessException($"Cannot manage assignments for employee {empId}");
                }
            }

            var assignments = await query.ToListAsync();
            var clearedCount = assignments.Count;

            Console.WriteLine($"🔍 Found {clearedCount} assignments with AbsenceType to clear");
            foreach (var assignment in assignments)
            {
                Console.WriteLine($"🔍 Assignment ID: {assignment.Id}, EmployeeId: {assignment.EmployeeId}, AssignedDate: {assignment.AssignedDate:yyyy-MM-dd}, AbsenceType: {assignment.AbsenceType}");
            }

            if (clearedCount > 0)
            {
                // Clear the AbsenceType field from these assignments
                foreach (var assignment in assignments)
                {
                    assignment.AbsenceType = null;
                    _context.Assignments.Update(assignment);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"🔍 Successfully cleared AbsenceType from {clearedCount} assignments");
            }

            return clearedCount;
        }

        public async Task<int> DeleteLeaveTasksByDateAsync(int userId, DateTime date, int? employeeId = null)
        {
            Console.WriteLine($"🔍 DeleteLeaveTasksByDateAsync called with date: {date:yyyy-MM-dd}, userId: {userId}, employeeId: {employeeId}");

            // Get all task assignments for the specified date that are leave-related
            var startOfDay = date.Date;
            var endOfDay = date.Date.AddDays(1);

            var query = _context.Assignments
                .Include(a => a.Task)
                .ThenInclude(t => t.TaskType)
                .Where(a => a.AssignedDate >= startOfDay && a.AssignedDate < endOfDay && a.IsActive)
                .Where(a => IsLeaveTaskType(a.Task.TaskType.Name));

            Console.WriteLine($"🔍 Looking for leave task assignments between {startOfDay:yyyy-MM-dd} and {endOfDay:yyyy-MM-dd}");

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
                if (!await _authService.CanManageEmployeeAsync(userId, employeeId.Value))
                    throw new UnauthorizedAccessException("Cannot manage this employee's assignments");
            }

            var assignments = await query.ToListAsync();
            var deletedCount = assignments.Count;

            Console.WriteLine($"🔍 Found {deletedCount} leave task assignments to delete");
            foreach (var assignment in assignments)
            {
                Console.WriteLine($"🔍 Assignment ID: {assignment.Id}, EmployeeId: {assignment.EmployeeId}, AssignedDate: {assignment.AssignedDate:yyyy-MM-dd}, TaskType: {assignment.Task.TaskType.Name}");
            }

            if (deletedCount > 0)
            {
                _context.Assignments.RemoveRange(assignments);
                await _context.SaveChangesAsync();
                Console.WriteLine($"🔍 Successfully deleted {deletedCount} leave task assignments");
            }

            return deletedCount;
        }

        private bool IsLeaveTaskType(string taskTypeName)
        {
            return taskTypeName.Contains("Annual Leave", StringComparison.OrdinalIgnoreCase) ||
                   taskTypeName.Contains("Sick Day", StringComparison.OrdinalIgnoreCase) ||
                   taskTypeName.Contains("Bank Holiday", StringComparison.OrdinalIgnoreCase) ||
                   taskTypeName.Contains("Training", StringComparison.OrdinalIgnoreCase) ||
                   taskTypeName.Contains("Leave", StringComparison.OrdinalIgnoreCase) ||
                   taskTypeName.Contains("Holiday", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<AbsenceRecordDto?> CreateAbsenceFromScheduleAsync(int assignmentId, AbsenceType absenceType)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Employee)
                .ThenInclude(e => e.User)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) return null;

            // Check if absence record already exists for this assignment
            var existingRecord = await _context.AbsenceRecords
                .FirstOrDefaultAsync(ar => ar.AssignmentId == assignmentId);

            if (existingRecord != null) return MapToRecordDto(existingRecord);

            // Create absence record
            var record = new AbsenceRecord
            {
                EmployeeId = assignment.EmployeeId,
                StartDate = assignment.AssignedDate,
                EndDate = assignment.AssignedDate,
                AbsenceType = absenceType,
                Hours = assignment.Hours ?? 4.0, // Default to half day if no hours specified
                AssignmentId = assignmentId,
                IsApproved = true
            };

            _context.AbsenceRecords.Add(record);

            // Update assignment with absence type
            assignment.AbsenceType = absenceType;

            await _context.SaveChangesAsync();

            return MapToRecordDto(record);
        }

        public async Task<bool> DeleteAbsenceFromScheduleAsync(int assignmentId)
        {
            var record = await _context.AbsenceRecords
                .FirstOrDefaultAsync(ar => ar.AssignmentId == assignmentId);

            if (record == null) return false;

            _context.AbsenceRecords.Remove(record);

            // Clear absence type from assignment
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId);
            if (assignment != null)
            {
                assignment.AbsenceType = null;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Dictionary<AbsenceType, double>> GetTeamAbsenceStatsAsync(int userId, int? teamId = null, int? year = null)
        {
            var managedEmployees = await _authService.GetManagedEmployeesAsync(userId);
            var employeeIds = managedEmployees.Select(e => e.Id).ToList();

            if (teamId.HasValue)
            {
                employeeIds = managedEmployees.Where(e => e.TeamId == teamId.Value).Select(e => e.Id).ToList();
            }

            var targetYear = year ?? DateTime.UtcNow.Year;

            var stats = await _context.AbsenceRecords
                .Where(ar => employeeIds.Contains(ar.EmployeeId) && ar.StartDate.Year == targetYear)
                .GroupBy(ar => ar.AbsenceType)
                .Select(g => new { Type = g.Key, Days = g.Sum(ar => ar.Hours / 8.0) })
                .ToDictionaryAsync(x => x.Type, x => x.Days);

            return stats;
        }

        public async Task<List<AbsenceRecordDto>> GetUpcomingAbsencesAsync(int userId, int days = 30)
        {
            var managedEmployees = await _authService.GetManagedEmployeesAsync(userId);
            var employeeIds = managedEmployees.Select(e => e.Id).ToList();

            var cutoffDate = DateTime.UtcNow.AddDays(days);

            var upcomingAbsences = await _context.AbsenceRecords
                .Include(ar => ar.Employee)
                .ThenInclude(e => e.User)
                .Where(ar => employeeIds.Contains(ar.EmployeeId) &&
                           ar.StartDate >= DateTime.UtcNow &&
                           ar.StartDate <= cutoffDate)
                .OrderBy(ar => ar.StartDate)
                .ToListAsync();

            return upcomingAbsences.Select(MapToRecordDto).ToList();
        }

        public async Task<bool> CanUserManageEmployeeAbsenceAsync(int userId, int employeeId)
        {
            // Users can always view their own absence data
            var currentEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (currentEmployee?.Id == employeeId) return true;

            // Managers/Admins can manage their team members
            return await _authService.CanManageEmployeeAsync(userId, employeeId);
        }

        public async Task<bool> HasSufficientAllocationAsync(int employeeId, AbsenceType absenceType, double hours, int year)
        {
            if (absenceType != AbsenceType.AnnualLeave) return true; // Only check annual leave for now

            var allocation = await GetOrCreateAllocationAsync(employeeId, year);
            var usedDays = await CalculateUsedDaysAsync(employeeId, year);

            var requestedDays = (int)Math.Ceiling(hours / 8.0);
            var usedAnnualLeaveDays = usedDays.GetValueOrDefault(AbsenceType.AnnualLeave, 0);

            return (usedAnnualLeaveDays + requestedDays) <= allocation.AnnualLeaveDays;
        }

        // Private helper methods
        private async Task<AbsenceAllocation> GetOrCreateAllocationAsync(int employeeId, int year)
        {
            var allocation = await _context.AbsenceAllocations
                .Include(aa => aa.Employee)
                .ThenInclude(e => e.User)
                .FirstOrDefaultAsync(aa => aa.EmployeeId == employeeId && aa.Year == year);

            if (allocation == null)
            {
                // Create default allocation
                allocation = new AbsenceAllocation
                {
                    EmployeeId = employeeId,
                    Year = year,
                    AnnualLeaveDays = 25, // Default to 25 days
                    SickDaysAllowed = 0, // Unlimited by default
                    OtherLeaveDaysAllowed = 5 // Default to 5 days
                };

                _context.AbsenceAllocations.Add(allocation);
                await _context.SaveChangesAsync();

                // Reload with includes
                allocation = await _context.AbsenceAllocations
                    .Include(aa => aa.Employee)
                    .ThenInclude(e => e.User)
                    .FirstAsync(aa => aa.Id == allocation.Id);
            }

            return allocation;
        }

        private async Task<Dictionary<AbsenceType, double>> CalculateUsedDaysAsync(int employeeId, int year)
        {
            // Get used days from AbsenceRecords table
            var absenceRecordDays = await _context.AbsenceRecords
                .Where(ar => ar.EmployeeId == employeeId && ar.StartDate.Year == year)
                .GroupBy(ar => ar.AbsenceType)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(ar => ar.Hours / 8.0));

            // Get all schedule assignments for this employee and year, then filter in memory
            var allAssignments = await _context.Assignments
                .Include(a => a.Task)
                .ThenInclude(t => t.TaskType)
                .Where(a => a.EmployeeId == employeeId && a.AssignedDate.Year == year)
                .ToListAsync();

            // Filter and group assignments that represent absences in memory
            var scheduleAssignmentDays = allAssignments
                .Where(a => a.AbsenceType.HasValue || IsLeaveTaskType(a.Task.TaskType.Name))
                .GroupBy(a => a.AbsenceType ?? GetAbsenceTypeFromTaskTypeName(a.Task.TaskType.Name))
                .ToDictionary(g => g.Key, g => g.Sum(a => (a.Hours ?? a.Task.EstimatedHours) / 8.0));

            // Combine both sources
            var result = new Dictionary<AbsenceType, double>();

            foreach (var absenceType in Enum.GetValues<AbsenceType>())
            {
                var absenceRecordTotal = absenceRecordDays.GetValueOrDefault(absenceType, 0);
                var scheduleAssignmentTotal = scheduleAssignmentDays.GetValueOrDefault(absenceType, 0);
                var total = absenceRecordTotal + scheduleAssignmentTotal;

                if (total > 0)
                {
                    result[absenceType] = total;
                }
            }

            return result;
        }

        public async Task<int> DeleteAllAssignmentsByDateAsync(int userId, DateTime date, int? employeeId = null)
        {
            Console.WriteLine($"🔍 DeleteAllAssignmentsByDateAsync called for date: {date:yyyy-MM-dd}, employeeId: {employeeId}");

            // Create date range for the entire day
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

            Console.WriteLine($"🔍 Searching for ALL assignments between {startOfDay:yyyy-MM-dd HH:mm:ss} and {endOfDay:yyyy-MM-dd HH:mm:ss}");

            // First, let's see ALL assignments for this date (including inactive ones)
            var allAssignmentsQuery = _context.Assignments
                .Include(a => a.Task)
                    .ThenInclude(t => t.TaskType)
                .Where(a => a.AssignedDate >= startOfDay && a.AssignedDate < endOfDay);

            var allAssignments = await allAssignmentsQuery.ToListAsync();
            Console.WriteLine($"🔍 DEBUG: Found {allAssignments.Count} TOTAL assignments for this date (active + inactive):");

            foreach (var assignment in allAssignments)
            {
                Console.WriteLine($"🔍   Assignment ID {assignment.Id}: Employee {assignment.EmployeeId}, TaskType='{assignment.Task?.TaskType?.Name}', IsActive={assignment.IsActive}, AbsenceType={assignment.AbsenceType}");
            }

            var query = _context.Assignments
                .Where(a => a.AssignedDate >= startOfDay && a.AssignedDate < endOfDay && a.IsActive);

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
                Console.WriteLine($"🔍 Filtering to employee ID: {employeeId.Value}");
            }

            var assignmentsToDelete = await query.ToListAsync();
            Console.WriteLine($"🔍 Found {assignmentsToDelete.Count} ACTIVE assignments to delete");

            foreach (var assignment in assignmentsToDelete)
            {
                Console.WriteLine($"🔍 Deleting assignment ID {assignment.Id} for employee {assignment.EmployeeId} on {assignment.AssignedDate:yyyy-MM-dd}");
                assignment.IsActive = false; // Soft delete
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"🔍 Successfully soft-deleted {assignmentsToDelete.Count} assignments");

            return assignmentsToDelete.Count;
        }


        private AbsenceType GetAbsenceTypeFromTaskTypeName(string taskTypeName)
        {
            var lowerName = taskTypeName.ToLowerInvariant();

            if (lowerName.Contains("annual") || lowerName.Contains("vacation"))
                return AbsenceType.AnnualLeave;

            if (lowerName.Contains("sick"))
                return AbsenceType.SickDay;

            if (lowerName.Contains("training"))
                return AbsenceType.OtherLeave;

            if (lowerName.Contains("bank") || lowerName.Contains("holiday"))
                return AbsenceType.BankHoliday;

            // Default to annual leave if we can't categorize
            return AbsenceType.AnnualLeave;
        }

        private AbsenceAllocationDto MapToAllocationDto(AbsenceAllocation allocation, Dictionary<AbsenceType, double> usedDays)
        {
            return new AbsenceAllocationDto
            {
                Id = allocation.Id,
                EmployeeId = allocation.EmployeeId,
                EmployeeName = $"{allocation.Employee.User.FirstName} {allocation.Employee.User.LastName}",
                EmployeePosition = allocation.Employee.Position ?? "Unassigned",
                Year = allocation.Year,
                AnnualLeaveDays = allocation.AnnualLeaveDays,
                SickDaysAllowed = allocation.SickDaysAllowed,
                OtherLeaveDaysAllowed = allocation.OtherLeaveDaysAllowed,
                UsedAnnualLeaveDays = usedDays.GetValueOrDefault(AbsenceType.AnnualLeave, 0),
                UsedSickDays = usedDays.GetValueOrDefault(AbsenceType.SickDay, 0),
                UsedOtherLeaveDays = usedDays.GetValueOrDefault(AbsenceType.OtherLeave, 0),
                CreatedAt = allocation.CreatedAt,
                UpdatedAt = allocation.UpdatedAt
            };
        }

        private AbsenceRecordDto MapToRecordDto(AbsenceRecord record)
        {
            return new AbsenceRecordDto
            {
                Id = record.Id,
                EmployeeId = record.EmployeeId,
                EmployeeName = $"{record.Employee.User.FirstName} {record.Employee.User.LastName}",
                StartDate = record.StartDate,
                EndDate = record.EndDate,
                AbsenceType = record.AbsenceType,
                AbsenceTypeName = record.AbsenceType.ToString(),
                Hours = record.Hours,
                Notes = record.Notes,
                IsApproved = record.IsApproved,
                AssignmentId = record.AssignmentId,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt
            };
        }
    }
}