using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for task type management operations
    /// </summary>
    public class TaskTypeService : ITaskTypeService
    {
        private readonly ApplicationDbContext _context;

        public TaskTypeService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new task type
        /// </summary>
        /// <param name="request">The task type creation request</param>
        /// <param name="createdByUserId">ID of the user creating the task type</param>
        /// <returns>The created task type DTO</returns>
        public async Task<TaskTypeResponseDto?> CreateTaskTypeAsync(CreateTaskTypeRequestDto request, int createdByUserId)
        {
            // Check if task type name already exists
            if (await IsTaskTypeNameExistsAsync(request.Name))
            {
                throw new ArgumentException($"Task type '{request.Name}' already exists");
            }

            var taskType = new TaskType
            {
                Name = request.Name,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskTypes.Add(taskType);
            await _context.SaveChangesAsync();

            return MapToTaskTypeResponseDto(taskType);
        }

        /// <summary>
        /// Updates an existing task type
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to update</param>
        /// <param name="request">The task type update request</param>
        /// <param name="updatedByUserId">ID of the user updating the task type</param>
        /// <returns>The updated task type DTO</returns>
        public async Task<TaskTypeResponseDto?> UpdateTaskTypeAsync(int taskTypeId, UpdateTaskTypeRequestDto request, int updatedByUserId)
        {
            var taskType = await _context.TaskTypes.FirstOrDefaultAsync(tt => tt.Id == taskTypeId);
            if (taskType == null)
                throw new ArgumentException("Task type not found");

            // Check if task type name already exists (excluding current task type)
            if (await IsTaskTypeNameExistsAsync(request.Name, taskTypeId))
            {
                throw new ArgumentException($"Task type '{request.Name}' already exists");
            }

            taskType.Name = request.Name;
            taskType.Description = request.Description;

            await _context.SaveChangesAsync();

            return MapToTaskTypeResponseDto(taskType);
        }

        /// <summary>
        /// Soft deletes a task type by setting IsActive to false
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the task type</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteTaskTypeAsync(int taskTypeId, int deletedByUserId)
        {
            var taskType = await _context.TaskTypes.FirstOrDefaultAsync(tt => tt.Id == taskTypeId);
            if (taskType == null)
                return false;

            // Check if task type is used in any project tasks
            var hasExistingTasks = await _context.ProjectTasks
                .AnyAsync(pt => pt.TaskTypeId == taskTypeId);

            if (hasExistingTasks)
                throw new InvalidOperationException("Cannot delete task type that is used in project tasks. Please reassign tasks first.");

            _context.TaskTypes.Remove(taskType);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a task type by ID
        /// </summary>
        /// <param name="taskTypeId">ID of the task type to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the task type</param>
        /// <returns>The task type DTO if found</returns>
        public async Task<TaskTypeResponseDto?> GetTaskTypeByIdAsync(int taskTypeId, int requestingUserId)
        {
            var taskType = await _context.TaskTypes.FirstOrDefaultAsync(tt => tt.Id == taskTypeId);
            return taskType != null ? MapToTaskTypeResponseDto(taskType) : null;
        }

        /// <summary>
        /// Gets a paginated list of task types with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the task types</param>
        /// <returns>Paginated task type list response</returns>
        public async Task<TaskTypeListResponseDto> GetTaskTypesAsync(TaskTypeQueryDto query, int requestingUserId)
        {
            var queryable = _context.TaskTypes.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(tt =>
                    tt.Name.ToLower().Contains(searchTerm) ||
                    (tt.Description != null && tt.Description.ToLower().Contains(searchTerm)));
            }

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(tt => tt.Name)
                    : queryable.OrderBy(tt => tt.Name),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(tt => tt.CreatedAt)
                    : queryable.OrderBy(tt => tt.CreatedAt),
                _ => queryable.OrderBy(tt => tt.Name)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var taskTypes = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(tt => MapToTaskTypeResponseDto(tt))
                .ToListAsync();

            return new TaskTypeListResponseDto
            {
                TaskTypes = taskTypes,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }


        /// <summary>
        /// Gets all task types for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the task types</param>
        /// <returns>List of task type DTOs</returns>
        public async Task<List<TaskTypeResponseDto>> GetActiveTaskTypesAsync(int requestingUserId)
        {
            var taskTypes = await _context.TaskTypes
                .OrderBy(tt => tt.Name)
                .Select(tt => MapToTaskTypeResponseDto(tt))
                .ToListAsync();

            return taskTypes;
        }

        /// <summary>
        /// Checks if a task type name is already in use
        /// </summary>
        /// <param name="name">The task type name to check</param>
        /// <param name="excludeTaskTypeId">Optional task type ID to exclude from the check (for updates)</param>
        /// <returns>True if the name is already in use</returns>
        public async Task<bool> IsTaskTypeNameExistsAsync(string name, int? excludeTaskTypeId = null)
        {
            var query = _context.TaskTypes.Where(tt => tt.Name.ToLower() == name.ToLower());

            if (excludeTaskTypeId.HasValue)
            {
                query = query.Where(tt => tt.Id != excludeTaskTypeId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Maps a TaskType entity to TaskTypeResponseDto
        /// </summary>
        /// <param name="taskType">The task type entity</param>
        /// <returns>The task type DTO</returns>
        private static TaskTypeResponseDto MapToTaskTypeResponseDto(TaskType taskType)
        {
            return new TaskTypeResponseDto
            {
                Id = taskType.Id,
                Name = taskType.Name,
                Description = taskType.Description,
                CreatedAt = taskType.CreatedAt,
                RequiredSkills = new List<TaskTypeSkillDto>(), // This will need to be populated separately if needed
                TaskCount = 0 // This will need to be calculated separately if needed
            };
        }
    }
}