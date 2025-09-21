using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for team management operations
    /// </summary>
    public class TeamManagementService : ITeamManagementService
    {
        private readonly ApplicationDbContext _context;

        public TeamManagementService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new team
        /// </summary>
        /// <param name="request">The team creation request</param>
        /// <param name="createdByUserId">ID of the user creating the team</param>
        /// <returns>The created team DTO</returns>
        public async Task<TeamResponseDto?> CreateTeamAsync(CreateTeamRequestDto request, int createdByUserId)
        {
            var team = new Team
            {
                Name = request.Name,
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return await MapToTeamDetailDto(team);
        }

        /// <summary>
        /// Updates an existing team
        /// </summary>
        /// <param name="teamId">ID of the team to update</param>
        /// <param name="request">The team update request</param>
        /// <param name="updatedByUserId">ID of the user updating the team</param>
        /// <returns>The updated team DTO</returns>
        public async Task<TeamResponseDto?> UpdateTeamAsync(int teamId, UpdateTeamRequestDto request, int updatedByUserId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null)
                throw new ArgumentException("Team not found");

            team.Name = request.Name;
            team.Description = request.Description;
            team.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return await MapToTeamDetailDto(team);
        }

        /// <summary>
        /// Soft deletes a team by setting IsActive to false
        /// </summary>
        /// <param name="teamId">ID of the team to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the team</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteTeamAsync(int teamId, int deletedByUserId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null)
                return false;

            // Check if team has members (all employees in DB are active)
            var memberCount = await GetTeamMemberCountAsync(teamId);
            var hasMembers = memberCount > 0;

            if (hasMembers)
                throw new InvalidOperationException("Cannot delete team with members. Please reassign members first.");

            team.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a team by ID
        /// </summary>
        /// <param name="teamId">ID of the team to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the team</param>
        /// <returns>The team DTO if found</returns>
        public async Task<TeamResponseDto?> GetTeamByIdAsync(int teamId, int requestingUserId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
            return team != null ? await MapToTeamDetailDto(team) : null;
        }

        /// <summary>
        /// Gets a paginated list of teams with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the teams</param>
        /// <returns>Paginated team list response</returns>
        public async Task<TeamListResponseDto> GetTeamsAsync(TeamQueryDto query, int requestingUserId)
        {
            var queryable = _context.Teams.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(t =>
                    t.Name.ToLower().Contains(searchTerm) ||
                    (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(t => t.IsActive == query.IsActive.Value);
            }

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(t => t.Name)
                    : queryable.OrderBy(t => t.Name),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(t => t.CreatedAt)
                    : queryable.OrderBy(t => t.CreatedAt),
                _ => queryable.OrderBy(t => t.Name)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var teams = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var teamDtos = new List<TeamDetailDto>();
            foreach (var team in teams)
            {
                teamDtos.Add(await MapToTeamDetailDto(team));
            }

            return new TeamListResponseDto
            {
                Teams = teamDtos.Cast<TeamResponseDto>().ToList(),
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Toggles the active status of a team
        /// </summary>
        /// <param name="teamId">ID of the team to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        public async Task<bool> ToggleTeamStatusAsync(int teamId, bool isActive, int updatedByUserId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null)
                return false;

            // If deactivating, check for members (all employees in DB are active)
            if (!isActive && team.IsActive)
            {
                var memberCount = await GetTeamMemberCountAsync(teamId);
                var hasMembers = memberCount > 0;

                if (hasMembers)
                    throw new InvalidOperationException("Cannot deactivate team with members. Please reassign members first.");
            }

            team.IsActive = isActive;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets all active teams for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the teams</param>
        /// <returns>List of active team DTOs</returns>
        public async Task<List<TeamDto>> GetActiveTeamsAsync(int requestingUserId)
        {
            var teams = await _context.Teams
                .Where(t => t.IsActive)
                .OrderBy(t => t.Name)
                .Select(t => new TeamDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description
                })
                .ToListAsync();

            return teams;
        }

        // Method removed - Code field is no longer used

        /// <summary>
        /// Gets total team members count (including inactive)
        /// ONLY counts employees with TeamMember role - managers are NOT counted as members
        /// </summary>
        /// <param name="teamId">ID of the team</param>
        /// <returns>Total number of members in the team</returns>
        public async Task<int> GetTeamMemberCountAsync(int teamId)
        {
            // Only count employees with TeamMember role assigned to this team
            // Managers are managers, not members - they should not be counted as team members
            return await _context.Employees
                .Include(e => e.User)
                .Where(e => e.TeamId == teamId && e.User.Role == Core.Enums.UserRole.TeamMember)
                .CountAsync();
        }

        /// <summary>
        /// Gets team members count (all employees in DB are active)
        /// ONLY counts employees with TeamMember role - managers are NOT counted as members
        /// </summary>
        /// <param name="teamId">ID of the team</param>
        /// <returns>Number of members in the team</returns>
        public async Task<int> GetActiveTeamMemberCountAsync(int teamId)
        {
            // Since all employees in DB are active, this is the same as GetTeamMemberCountAsync
            return await GetTeamMemberCountAsync(teamId);
        }

        /// <summary>
        /// Maps a Team entity to TeamDetailDto
        /// </summary>
        /// <param name="team">The team entity</param>
        /// <returns>The team detail DTO</returns>
        private async Task<TeamDetailDto> MapToTeamDetailDto(Team team)
        {
            var memberCount = await GetTeamMemberCountAsync(team.Id);
            var activeMemberCount = await GetActiveTeamMemberCountAsync(team.Id);

            // Find the team manager - properly parse ManagedTeamIds field
            var manager = await _context.Users
                .Include(u => u.Employee)
                .Where(u => (u.Role == Core.Enums.UserRole.Admin || u.Role == Core.Enums.UserRole.Manager) &&
                           u.ManagedTeamIds != null)
                .ToListAsync();

            // Filter in memory to properly parse comma-separated team IDs
            manager = manager.Where(u =>
                u.ManagedTeamIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(id => int.TryParse(id.Trim(), out var teamId) ? teamId : 0)
                    .Contains(team.Id))
                .ToList();

            var teamManager = manager.FirstOrDefault();

            return new TeamDetailDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                IsActive = team.IsActive,
                CreatedAt = team.CreatedAt,
                MemberCount = memberCount,
                ActiveMemberCount = activeMemberCount,
                ManagerId = teamManager?.Id,
                ManagerName = teamManager != null ? $"{teamManager.FirstName} {teamManager.LastName}" : null
            };
        }
    }
}