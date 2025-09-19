using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    public class TeamAuthorizationService : ITeamAuthorizationService
    {
        private readonly ApplicationDbContext _context;

        public TeamAuthorizationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CanManageTeamAsync(int userId, int teamId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            // Admins can manage all teams
            if (user.Role == UserRole.Admin) return true;

            // Managers can manage teams they are assigned to manage
            if (user.Role == UserRole.Manager)
            {
                // For now, assuming managers can manage all teams
                // In a real implementation, you would check for a ManagerTeam relationship
                return await _context.Teams.AnyAsync(t => t.Id == teamId && t.IsActive);
            }

            return false;
        }

        public async Task<bool> CanViewTeamAsync(int userId, int teamId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            // Admins and managers can view all teams
            if (user.Role == UserRole.Admin || user.Role == UserRole.Manager)
            {
                return await _context.Teams.AnyAsync(t => t.Id == teamId && t.IsActive);
            }

            // Team members can view their own team (all employees in DB are active)
            var userEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);
            
            if (userEmployee != null)
            {
                return userEmployee.TeamId == teamId;
            }

            return false;
        }

        public async Task<bool> CanManageEmployeeAsync(int userId, int employeeId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            // Admins can manage all employees
            if (user.Role == UserRole.Admin) return true;

            // Managers can manage employees in their teams
            if (user.Role == UserRole.Manager)
            {
                var targetEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == employeeId);
                
                if (targetEmployee != null && targetEmployee.TeamId.HasValue)
                {
                    return await CanManageTeamAsync(userId, targetEmployee.TeamId.Value);
                }
            }

            return false;
        }

        public async Task<bool> CanViewEmployeeAsync(int userId, int employeeId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            // Users can always view their own profile
            var currentUserEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);
            
            if (currentUserEmployee?.Id == employeeId) return true;

            // Admins and managers can view all employees
            if (user.Role == UserRole.Admin || user.Role == UserRole.Manager) return true;

            // Team members can view other members of their team
            if (currentUserEmployee != null)
            {
                var targetEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == employeeId);
                
                return targetEmployee != null && currentUserEmployee.TeamId == targetEmployee.TeamId;
            }

            return false;
        }

        public async Task<List<Team>> GetManagedTeamsAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new List<Team>();

            // Admins can manage all teams
            if (user.Role == UserRole.Admin)
            {
                return await _context.Teams
                    .Where(t => t.IsActive)
                    .ToListAsync();
            }

            // Managers can manage their assigned teams
            if (user.Role == UserRole.Manager)
            {
                // For now, returning all teams - in a real implementation,
                // you would filter by actual manager-team relationships
                return await _context.Teams
                    .Where(t => t.IsActive)
                    .ToListAsync();
            }

            return new List<Team>();
        }

        public async Task<List<Team>> GetViewableTeamsAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new List<Team>();

            // Admins and managers can view all teams
            if (user.Role == UserRole.Admin || user.Role == UserRole.Manager)
            {
                return await _context.Teams
                    .Where(t => t.IsActive)
                    .ToListAsync();
            }

            // Team members can view their own team
            var userEmployee = await _context.Employees
                .Include(e => e.Team)
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (userEmployee?.Team != null)
            {
                return new List<Team> { userEmployee.Team };
            }

            return new List<Team>();
        }

        public async Task<List<Employee>> GetManagedEmployeesAsync(int userId)
        {
            var managedTeams = await GetManagedTeamsAsync(userId);
            var teamIds = managedTeams.Select(t => t.Id).ToList();

            return await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Team)
                .Where(e => e.TeamId.HasValue && teamIds.Contains(e.TeamId.Value))
                .ToListAsync();
        }

        public async Task<List<Employee>> GetViewableEmployeesAsync(int userId)
        {
            var viewableTeams = await GetViewableTeamsAsync(userId);
            var teamIds = viewableTeams.Select(t => t.Id).ToList();

            return await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Team)
                .Where(e => e.TeamId.HasValue && teamIds.Contains(e.TeamId.Value))
                .ToListAsync();
        }

        public async Task<bool> IsAdminAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            return user?.Role == UserRole.Admin;
        }

        public async Task<bool> IsManagerAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            return user?.Role == UserRole.Manager || user?.Role == UserRole.Admin;
        }

        public async Task<bool> CanModifyAssignmentAsync(int userId, int assignmentId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) return false;

            return await CanManageEmployeeAsync(userId, assignment.Employee.Id);
        }

        public async Task<bool> CanPerformBulkOperationsAsync(int userId, List<int> employeeIds)
        {
            foreach (var employeeId in employeeIds)
            {
                if (!await CanManageEmployeeAsync(userId, employeeId))
                {
                    return false;
                }
            }
            return true;
        }
    }
}