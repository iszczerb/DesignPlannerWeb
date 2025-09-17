using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing task types
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskTypeController : ControllerBase
    {
        private readonly ITaskTypeService _taskTypeService;
        private readonly ILogger<TaskTypeController> _logger;

        public TaskTypeController(ITaskTypeService taskTypeService, ILogger<TaskTypeController> logger)
        {
            _taskTypeService = taskTypeService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current user ID from JWT token
        /// </summary>
        /// <returns>User ID or 0 if not found</returns>
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        /// <summary>
        /// Get all task types
        /// </summary>
        /// <returns>List of task types</returns>
        [HttpGet]
        public async Task<ActionResult<TaskTypeListResponseDto>> GetTaskTypes([FromQuery] TaskTypeQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new TaskTypeQueryDto();
                var taskTypes = await _taskTypeService.GetTaskTypesAsync(query, userId);
                return Ok(taskTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task types");
                return StatusCode(500, "An error occurred while retrieving task types");
            }
        }

        /// <summary>
        /// Get a specific task type by ID
        /// </summary>
        /// <param name="id">Task type ID</param>
        /// <returns>Task type details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskTypeResponseDto>> GetTaskType(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var taskType = await _taskTypeService.GetTaskTypeByIdAsync(id, userId);
                if (taskType == null)
                {
                    return NotFound("Task type not found");
                }

                return Ok(taskType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task type {TaskTypeId}", id);
                return StatusCode(500, "An error occurred while retrieving the task type");
            }
        }

        /// <summary>
        /// Create a new task type
        /// </summary>
        /// <param name="createDto">Task type creation data</param>
        /// <returns>Created task type</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<TaskTypeResponseDto>> CreateTaskType([FromBody] CreateTaskTypeRequestDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var taskType = await _taskTypeService.CreateTaskTypeAsync(createDto, userId);
                return CreatedAtAction(nameof(GetTaskType), new { id = taskType.Id }, taskType);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task type");
                return StatusCode(500, "An error occurred while creating the task type");
            }
        }

        /// <summary>
        /// Update an existing task type
        /// </summary>
        /// <param name="id">Task type ID</param>
        /// <param name="updateDto">Task type update data</param>
        /// <returns>Updated task type</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<TaskTypeResponseDto>> UpdateTaskType(int id, [FromBody] UpdateTaskTypeRequestDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var taskType = await _taskTypeService.UpdateTaskTypeAsync(id, updateDto, userId);
                return Ok(taskType);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task type {TaskTypeId}", id);
                return StatusCode(500, "An error occurred while updating the task type");
            }
        }

        /// <summary>
        /// Delete a task type
        /// </summary>
        /// <param name="id">Task type ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteTaskType(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _taskTypeService.DeleteTaskTypeAsync(id, userId);
                if (!result)
                {
                    return NotFound("Task type not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task type {TaskTypeId}", id);
                return StatusCode(500, "An error occurred while deleting the task type");
            }
        }

        /// <summary>
        /// Get active task types
        /// </summary>
        /// <returns>List of active task types</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<TaskTypeResponseDto>>> GetActiveTaskTypes()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var taskTypes = await _taskTypeService.GetActiveTaskTypesAsync(userId);
                return Ok(taskTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active task types");
                return StatusCode(500, "An error occurred while retrieving active task types");
            }
        }

        /// <summary>
        /// Search task types by name or description
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching task types</returns>
        [HttpGet("search")]
        public async Task<ActionResult<List<TaskTypeResponseDto>>> SearchTaskTypes([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest("Search term is required");
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new TaskTypeQueryDto { SearchTerm = searchTerm };
                var result = await _taskTypeService.GetTaskTypesAsync(query, userId);
                var taskTypes = result.TaskTypes;
                return Ok(taskTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching task types with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching task types");
            }
        }

        /// <summary>
        /// Get tasks associated with a specific task type
        /// </summary>
        /// <param name="id">Task type ID</param>
        /// <returns>List of tasks of this type</returns>
        [HttpGet("{id}/tasks")]
        public async Task<ActionResult<List<object>>> GetTasksByType(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, return not implemented
                return StatusCode(501, "Get tasks by type functionality not implemented");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks for task type {TaskTypeId}", id);
                return StatusCode(500, "An error occurred while retrieving tasks by type");
            }
        }

        /// <summary>
        /// Get task type usage statistics
        /// </summary>
        /// <returns>List of task types with usage counts</returns>
        [HttpGet("statistics")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<object>>> GetTaskTypeStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, return not implemented
                return StatusCode(501, "Get task type statistics functionality not implemented");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task type statistics");
                return StatusCode(500, "An error occurred while retrieving task type statistics");
            }
        }

        /// <summary>
        /// Bulk update task type colors
        /// </summary>
        /// <param name="colorUpdates">List of task type ID and color pairs</param>
        /// <returns>Success confirmation</returns>
        [HttpPatch("colors")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> UpdateTaskTypeColors([FromBody] List<object> colorUpdates)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, return not implemented
                return StatusCode(501, "Bulk update colors functionality not implemented");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task type colors");
                return StatusCode(500, "An error occurred while updating task type colors");
            }
        }
    }
}