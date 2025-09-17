using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for skill management operations
    /// </summary>
    public interface ISkillService
    {
        /// <summary>
        /// Creates a new skill
        /// </summary>
        /// <param name="request">The skill creation request</param>
        /// <param name="createdByUserId">ID of the user creating the skill</param>
        /// <returns>The created skill DTO</returns>
        Task<SkillResponseDto?> CreateSkillAsync(CreateSkillRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing skill
        /// </summary>
        /// <param name="skillId">ID of the skill to update</param>
        /// <param name="request">The skill update request</param>
        /// <param name="updatedByUserId">ID of the user updating the skill</param>
        /// <returns>The updated skill DTO</returns>
        Task<SkillResponseDto?> UpdateSkillAsync(int skillId, UpdateSkillRequestDto request, int updatedByUserId);

        /// <summary>
        /// Soft deletes a skill by setting IsActive to false
        /// </summary>
        /// <param name="skillId">ID of the skill to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the skill</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteSkillAsync(int skillId, int deletedByUserId);

        /// <summary>
        /// Gets a skill by ID
        /// </summary>
        /// <param name="skillId">ID of the skill to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the skill</param>
        /// <returns>The skill DTO if found</returns>
        Task<SkillResponseDto?> GetSkillByIdAsync(int skillId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of skills with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <returns>Paginated skill list response</returns>
        Task<SkillListResponseDto> GetSkillsAsync(SkillQueryDto query, int requestingUserId);

        /// <summary>
        /// Toggles the active status of a skill
        /// </summary>
        /// <param name="skillId">ID of the skill to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        Task<bool> ToggleSkillStatusAsync(int skillId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Gets all active skills for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <returns>List of active skill DTOs</returns>
        Task<List<SkillResponseDto>> GetActiveSkillsAsync(int requestingUserId);

        /// <summary>
        /// Gets skills by category
        /// </summary>
        /// <param name="category">The skill category</param>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <param name="includeInactive">Whether to include inactive skills</param>
        /// <returns>List of skill DTOs in the specified category</returns>
        Task<List<SkillResponseDto>> GetSkillsByCategoryAsync(string category, int requestingUserId, bool includeInactive = false);

        /// <summary>
        /// Gets all skill categories
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the categories</param>
        /// <returns>List of distinct skill categories</returns>
        Task<List<string>> GetSkillCategoriesAsync(int requestingUserId);

        /// <summary>
        /// Checks if a skill name is already in use
        /// </summary>
        /// <param name="name">The skill name to check</param>
        /// <param name="excludeSkillId">Optional skill ID to exclude from the check (for updates)</param>
        /// <returns>True if the name is already in use</returns>
        Task<bool> IsSkillNameExistsAsync(string name, int? excludeSkillId = null);
    }
}