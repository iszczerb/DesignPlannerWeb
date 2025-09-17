using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for project management operations
    /// </summary>
    public interface IProjectService
    {
        /// <summary>
        /// Creates a new project
        /// </summary>
        /// <param name="request">The project creation request</param>
        /// <param name="createdByUserId">ID of the user creating the project</param>
        /// <returns>The created project DTO</returns>
        Task<ProjectResponseDto?> CreateProjectAsync(CreateProjectRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing project
        /// </summary>
        /// <param name="projectId">ID of the project to update</param>
        /// <param name="request">The project update request</param>
        /// <param name="updatedByUserId">ID of the user updating the project</param>
        /// <returns>The updated project DTO</returns>
        Task<ProjectResponseDto?> UpdateProjectAsync(int projectId, UpdateProjectRequestDto request, int updatedByUserId);

        /// <summary>
        /// Soft deletes a project by setting IsActive to false
        /// </summary>
        /// <param name="projectId">ID of the project to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the project</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteProjectAsync(int projectId, int deletedByUserId);

        /// <summary>
        /// Gets a project by ID
        /// </summary>
        /// <param name="projectId">ID of the project to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the project</param>
        /// <returns>The project DTO if found</returns>
        Task<ProjectResponseDto?> GetProjectByIdAsync(int projectId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of projects with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <returns>Paginated project list response</returns>
        Task<ProjectListResponseDto> GetProjectsAsync(ProjectQueryDto query, int requestingUserId);

        /// <summary>
        /// Toggles the active status of a project
        /// </summary>
        /// <param name="projectId">ID of the project to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        Task<bool> ToggleProjectStatusAsync(int projectId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Gets all active projects for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <returns>List of active project DTOs</returns>
        Task<List<ProjectResponseDto>> GetActiveProjectsAsync(int requestingUserId);

        /// <summary>
        /// Gets projects by client ID
        /// </summary>
        /// <param name="clientId">ID of the client</param>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <param name="includeInactive">Whether to include inactive projects</param>
        /// <returns>List of project DTOs for the specified client</returns>
        Task<List<ProjectResponseDto>> GetProjectsByClientAsync(int clientId, int requestingUserId, bool includeInactive = false);

        /// <summary>
        /// Checks if a project code is already in use
        /// </summary>
        /// <param name="code">The project code to check</param>
        /// <param name="excludeProjectId">Optional project ID to exclude from the check (for updates)</param>
        /// <returns>True if the code is already in use</returns>
        Task<bool> IsProjectCodeExistsAsync(string code, int? excludeProjectId = null);
    }
}