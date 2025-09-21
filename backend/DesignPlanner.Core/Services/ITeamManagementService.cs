using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for team management operations
    /// </summary>
    public interface ITeamManagementService
    {
        /// <summary>
        /// Creates a new team
        /// </summary>
        /// <param name="request">The team creation request</param>
        /// <param name="createdByUserId">ID of the user creating the team</param>
        /// <returns>The created team DTO</returns>
        Task<TeamResponseDto?> CreateTeamAsync(CreateTeamRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing team
        /// </summary>
        /// <param name="teamId">ID of the team to update</param>
        /// <param name="request">The team update request</param>
        /// <param name="updatedByUserId">ID of the user updating the team</param>
        /// <returns>The updated team DTO</returns>
        Task<TeamResponseDto?> UpdateTeamAsync(int teamId, UpdateTeamRequestDto request, int updatedByUserId);

        /// <summary>
        /// Soft deletes a team by setting IsActive to false
        /// </summary>
        /// <param name="teamId">ID of the team to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the team</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteTeamAsync(int teamId, int deletedByUserId);

        /// <summary>
        /// Gets a team by ID
        /// </summary>
        /// <param name="teamId">ID of the team to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the team</param>
        /// <returns>The team DTO if found</returns>
        Task<TeamResponseDto?> GetTeamByIdAsync(int teamId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of teams with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the teams</param>
        /// <returns>Paginated team list response</returns>
        Task<TeamListResponseDto> GetTeamsAsync(TeamQueryDto query, int requestingUserId);

        /// <summary>
        /// Toggles the active status of a team
        /// </summary>
        /// <param name="teamId">ID of the team to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        Task<bool> ToggleTeamStatusAsync(int teamId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Gets all active teams for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the teams</param>
        /// <returns>List of active team DTOs</returns>
        Task<List<TeamDto>> GetActiveTeamsAsync(int requestingUserId);

        /// <summary>
        /// Gets team members count
        /// </summary>
        /// <param name="teamId">ID of the team</param>
        /// <returns>Number of active members in the team</returns>
        Task<int> GetTeamMemberCountAsync(int teamId);
    }
}