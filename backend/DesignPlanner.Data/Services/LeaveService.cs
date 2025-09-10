using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    public class LeaveService : ILeaveService
    {
        private readonly ApplicationDbContext _context;

        public LeaveService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> CalculateLeaveDaysAsync(DateTime startDate, DateTime endDate, bool isStartDateAM, bool isEndDateAM)
        {
            if (startDate > endDate)
                throw new ArgumentException("Start date cannot be after end date");

            if (startDate.Date == endDate.Date)
            {
                // Same day request
                if (isStartDateAM && !isEndDateAM)
                    return 1.0m; // Full day
                else if (!isStartDateAM || isEndDateAM)
                    return 0.5m; // Half day
                else
                    return 1.0m; // Default to full day
            }

            decimal totalDays = 0;

            // Calculate weekdays between dates
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                // Skip weekends (assuming Monday=1, Sunday=7)
                if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                {
                    if (date == startDate.Date)
                    {
                        // First day - check if AM or full day
                        totalDays += isStartDateAM ? 1.0m : 0.5m;
                    }
                    else if (date == endDate.Date)
                    {
                        // Last day - check if PM or full day
                        totalDays += isEndDateAM ? 0.5m : 1.0m;
                    }
                    else
                    {
                        // Middle days are always full days
                        totalDays += 1.0m;
                    }
                }
            }

            return totalDays;
        }

        public async Task<LeaveBalanceDto> GetEmployeeLeaveBalanceAsync(int employeeId)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.LeaveRequests)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                throw new ArgumentException("Employee not found");

            var currentYear = DateTime.UtcNow.Year;
            var pendingLeave = await _context.LeaveRequests
                .Where(lr => lr.EmployeeId == employeeId && 
                           lr.Status == LeaveStatus.Pending &&
                           lr.LeaveType == LeaveType.Annual &&
                           lr.StartDate.Year == currentYear)
                .SumAsync(lr => lr.LeaveDaysRequested);

            return new LeaveBalanceDto
            {
                EmployeeId = employeeId,
                EmployeeName = $"{employee.User.FirstName} {employee.User.LastName}",
                TotalAnnualLeaveDays = employee.TotalAnnualLeaveDays,
                UsedLeaveDays = employee.UsedLeaveDays,
                RemainingLeaveDays = employee.TotalAnnualLeaveDays - employee.UsedLeaveDays,
                PendingLeaveDays = (int)pendingLeave
            };
        }

        public async Task<List<LeaveRequestDto>> GetPendingLeaveRequestsAsync()
        {
            return await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .ThenInclude(e => e.User)
                .Where(lr => lr.Status == LeaveStatus.Pending)
                .OrderBy(lr => lr.CreatedAt)
                .Select(lr => new LeaveRequestDto
                {
                    Id = lr.Id,
                    EmployeeId = lr.EmployeeId,
                    EmployeeName = $"{lr.Employee.User.FirstName} {lr.Employee.User.LastName}",
                    EmployeeId_Display = lr.Employee.EmployeeId,
                    LeaveType = lr.LeaveType,
                    StartDate = lr.StartDate,
                    EndDate = lr.EndDate,
                    IsStartDateAM = lr.IsStartDateAM,
                    IsEndDateAM = lr.IsEndDateAM,
                    LeaveDaysRequested = lr.LeaveDaysRequested,
                    Reason = lr.Reason,
                    Status = lr.Status,
                    CreatedAt = lr.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<LeaveRequestDto>> GetEmployeeLeaveRequestsAsync(int employeeId)
        {
            return await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .ThenInclude(e => e.User)
                .Include(lr => lr.ApprovedByUser)
                .Where(lr => lr.EmployeeId == employeeId)
                .OrderByDescending(lr => lr.CreatedAt)
                .Select(lr => new LeaveRequestDto
                {
                    Id = lr.Id,
                    EmployeeId = lr.EmployeeId,
                    EmployeeName = $"{lr.Employee.User.FirstName} {lr.Employee.User.LastName}",
                    EmployeeId_Display = lr.Employee.EmployeeId,
                    LeaveType = lr.LeaveType,
                    StartDate = lr.StartDate,
                    EndDate = lr.EndDate,
                    IsStartDateAM = lr.IsStartDateAM,
                    IsEndDateAM = lr.IsEndDateAM,
                    LeaveDaysRequested = lr.LeaveDaysRequested,
                    Reason = lr.Reason,
                    Status = lr.Status,
                    ApprovedByUserId = lr.ApprovedByUserId,
                    ApprovedByUserName = lr.ApprovedByUser != null 
                        ? $"{lr.ApprovedByUser.FirstName} {lr.ApprovedByUser.LastName}" 
                        : null,
                    ApprovalNotes = lr.ApprovalNotes,
                    ApprovedAt = lr.ApprovedAt,
                    CreatedAt = lr.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> CanRequestLeaveAsync(int employeeId, decimal requestedDays, LeaveType leaveType)
        {
            if (leaveType == LeaveType.Sick || leaveType == LeaveType.Training)
            {
                // Sick and training leave don't have balance limitations
                return true;
            }

            var balance = await GetEmployeeLeaveBalanceAsync(employeeId);
            return (balance.RemainingLeaveDays - balance.PendingLeaveDays) >= requestedDays;
        }

        public async Task<LeaveRequest> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto request)
        {
            var leaveDays = await CalculateLeaveDaysAsync(
                request.StartDate, 
                request.EndDate, 
                request.IsStartDateAM, 
                request.IsEndDateAM);

            // Check if employee can request this leave
            if (request.LeaveType == LeaveType.Annual)
            {
                var canRequest = await CanRequestLeaveAsync(employeeId, leaveDays, request.LeaveType);
                if (!canRequest)
                    throw new InvalidOperationException("Insufficient leave balance");
            }

            // Check for conflicts
            var hasConflict = await HasLeaveConflictAsync(employeeId, request.StartDate, request.EndDate);
            if (hasConflict)
                throw new InvalidOperationException("Leave request conflicts with existing leave");

            var leaveRequest = new LeaveRequest
            {
                EmployeeId = employeeId,
                LeaveType = request.LeaveType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                IsStartDateAM = request.IsStartDateAM,
                IsEndDateAM = request.IsEndDateAM,
                LeaveDaysRequested = leaveDays,
                Reason = request.Reason,
                Status = request.LeaveType == LeaveType.Annual 
                    ? LeaveStatus.Pending 
                    : LeaveStatus.Approved, // Auto-approve sick and training leave
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // If auto-approved, update used leave days immediately for sick/training
            if (leaveRequest.Status == LeaveStatus.Approved && request.LeaveType != LeaveType.Annual)
            {
                leaveRequest.ApprovedAt = DateTime.UtcNow;
            }

            _context.LeaveRequests.Add(leaveRequest);
            await _context.SaveChangesAsync();

            return leaveRequest;
        }

        public async Task<bool> ApproveLeaveRequestAsync(int requestId, int approvedByUserId, ApproveLeaveRequestDto approvalDto)
        {
            var leaveRequest = await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .FirstOrDefaultAsync(lr => lr.Id == requestId);

            if (leaveRequest == null)
                return false;

            leaveRequest.Status = approvalDto.IsApproved ? LeaveStatus.Approved : LeaveStatus.Rejected;
            leaveRequest.ApprovedByUserId = approvedByUserId;
            leaveRequest.ApprovalNotes = approvalDto.ApprovalNotes;
            leaveRequest.ApprovedAt = DateTime.UtcNow;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            // Update employee's used leave days if approved
            if (approvalDto.IsApproved && leaveRequest.LeaveType == LeaveType.Annual)
            {
                leaveRequest.Employee.UsedLeaveDays += (int)Math.Ceiling(leaveRequest.LeaveDaysRequested);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TeamLeaveOverviewDto>> GetTeamLeaveOverviewAsync(DateTime startDate, DateTime endDate)
        {
            var leaveRequests = await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .ThenInclude(e => e.User)
                .Where(lr => lr.Status == LeaveStatus.Approved &&
                           lr.StartDate <= endDate &&
                           lr.EndDate >= startDate)
                .ToListAsync();

            var overviewMap = new Dictionary<DateTime, List<EmployeeLeaveDto>>();

            foreach (var leave in leaveRequests)
            {
                for (var date = Math.Max(leave.StartDate.Ticks, startDate.Ticks);
                     date <= Math.Min(leave.EndDate.Ticks, endDate.Ticks);
                     date = new DateTime(date).AddDays(1).Ticks)
                {
                    var currentDate = new DateTime(date).Date;
                    
                    // Skip weekends
                    if (currentDate.DayOfWeek == DayOfWeek.Saturday || currentDate.DayOfWeek == DayOfWeek.Sunday)
                        continue;

                    if (!overviewMap.ContainsKey(currentDate))
                        overviewMap[currentDate] = new List<EmployeeLeaveDto>();

                    var isAM = true;
                    var isPM = true;

                    // Handle partial day logic
                    if (currentDate == leave.StartDate.Date && !leave.IsStartDateAM)
                        isAM = false;
                    if (currentDate == leave.EndDate.Date && leave.IsEndDateAM)
                        isPM = false;

                    overviewMap[currentDate].Add(new EmployeeLeaveDto
                    {
                        EmployeeId = leave.EmployeeId,
                        EmployeeName = $"{leave.Employee.User.FirstName} {leave.Employee.User.LastName}",
                        LeaveType = leave.LeaveType,
                        IsAM = isAM,
                        IsPM = isPM,
                        Status = leave.Status
                    });
                }
            }

            return overviewMap.Select(kvp => new TeamLeaveOverviewDto
            {
                Date = kvp.Key,
                EmployeesOnLeave = kvp.Value
            }).OrderBy(x => x.Date).ToList();
        }

        public async Task<bool> UpdateEmployeeLeaveBalanceAsync(UpdateLeaveBalanceDto updateDto)
        {
            var employee = await _context.Employees.FindAsync(updateDto.EmployeeId);
            if (employee == null)
                return false;

            employee.TotalAnnualLeaveDays = updateDto.TotalAnnualLeaveDays;
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<List<LeaveRequestDto>> GetLeaveRequestsForDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.LeaveRequests
                .Include(lr => lr.Employee)
                .ThenInclude(e => e.User)
                .Where(lr => lr.StartDate <= endDate && lr.EndDate >= startDate)
                .Select(lr => new LeaveRequestDto
                {
                    Id = lr.Id,
                    EmployeeId = lr.EmployeeId,
                    EmployeeName = $"{lr.Employee.User.FirstName} {lr.Employee.User.LastName}",
                    EmployeeId_Display = lr.Employee.EmployeeId,
                    LeaveType = lr.LeaveType,
                    StartDate = lr.StartDate,
                    EndDate = lr.EndDate,
                    IsStartDateAM = lr.IsStartDateAM,
                    IsEndDateAM = lr.IsEndDateAM,
                    LeaveDaysRequested = lr.LeaveDaysRequested,
                    Status = lr.Status,
                    CreatedAt = lr.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> HasLeaveConflictAsync(int employeeId, DateTime startDate, DateTime endDate)
        {
            return await _context.LeaveRequests
                .AnyAsync(lr => lr.EmployeeId == employeeId &&
                              lr.Status != LeaveStatus.Rejected &&
                              lr.StartDate <= endDate &&
                              lr.EndDate >= startDate);
        }
    }
}