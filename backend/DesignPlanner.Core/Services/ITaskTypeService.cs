using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for task type management operations
    /// </summary>
    public interface ITaskTypeService
    {
        /// <summary>
        /// Creates a new task type
        /// </summary>
        /// <param name="request">The task type creation request</param>
        /// <param name="createdByUserId">ID of the user creating the task type</param>
        /// <returns>The created task type DTO</returns>
        Task<TaskTypeResponseDto?> CreateTaskTypeAsync(CreateTaskTypeRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing task type
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to update</param>
        /// <param name="request">The task type update request</param>
        /// <param name="updatedByUserId">ID of the user updating the task type</param>
        /// <returns>The updated task type DTO</returns>
        Task<TaskTypeResponseDto?> UpdateTaskTypeAsync(int taskTypeId, UpdateTaskTypeRequestDto request, int updatedByUserId);

        /// <summary>
        /// Deletes a task type permanently
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the task type</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteTaskTypeAsync(int taskTypeId, int deletedByUserId);

        /// <summary>
        /// Gets a task type by ID
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the task type</param>
        /// <returns>The task type DTO if found</returns>
        Task<TaskTypeResponseDto?> GetTaskTypeByIdAsync(int taskTypeId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of task types with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the task types</param>
        /// <returns>Paginated task type list response</returns>
        Task<TaskTypeListResponseDto> GetTaskTypesAsync(TaskTypeQueryDto query, int requestingUserId);


        /// <summary>
        /// Gets all task types for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the task types</param>
        /// <returns>List of task type DTOs</returns>
        Task<List<TaskTypeResponseDto>> GetActiveTaskTypesAsync(int requestingUserId);

        /// <summary>
        /// Checks if a task type name is already in use
        /// </summary>
        /// <param name="name">The task type name to check</param>
        /// <param name="excludeTaskTypeId">Optional task type ID to exclude from the check (for updates)</param>
        /// <returns>True if the name is already in use</returns>
        Task<bool> IsTaskTypeNameExistsAsync(string name, int? excludeTaskTypeId = null);
    }
}