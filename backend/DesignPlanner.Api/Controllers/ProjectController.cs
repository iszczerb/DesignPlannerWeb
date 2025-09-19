using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing projects
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(IProjectService projectService, ILogger<ProjectController> logger)
        {
            _projectService = projectService;
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
        /// Get all projects
        /// </summary>
        /// <returns>List of projects</returns>
        [HttpGet]
        public async Task<ActionResult<ProjectListResponseDto>> GetProjects([FromQuery] ProjectQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new ProjectQueryDto();
                var projects = await _projectService.GetProjectsAsync(query, userId);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects");
                return StatusCode(500, "An error occurred while retrieving projects");
            }
        }

        /// <summary>
        /// Get a specific project by ID
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <returns>Project details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectResponseDto>> GetProject(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var project = await _projectService.GetProjectByIdAsync(id, userId);
                if (project == null)
                {
                    return NotFound("Project not found");
                }

                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project {ProjectId}", id);
                return StatusCode(500, "An error occurred while retrieving the project");
            }
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        /// <param name="createDto">Project creation data</param>
        /// <returns>Created project</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectResponseDto>> CreateProject([FromBody] CreateProjectRequestDto createDto)
        {
            _logger.LogInformation("🟢 PROJECT CREATION REQUEST RECEIVED");
            _logger.LogInformation("📋 Request Data: {@CreateDto}", createDto);

            try
            {
                _logger.LogInformation("🔍 Validating model state...");
                if (!ModelState.IsValid)
                {
                    _logger.LogError("❌ Model state is invalid: {@ModelState}", ModelState);
                    return BadRequest(ModelState);
                }
                _logger.LogInformation("✅ Model state is valid");

                _logger.LogInformation("🔐 Getting current user ID...");
                var userId = GetCurrentUserId();
                _logger.LogInformation("👤 Current user ID: {UserId}", userId);
                if (userId == 0)
                {
                    _logger.LogError("❌ Unable to identify user");
                    return Unauthorized("Unable to identify user");
                }

                _logger.LogInformation("🚀 Calling ProjectService.CreateProjectAsync...");
                var project = await _projectService.CreateProjectAsync(createDto, userId);
                _logger.LogInformation("✅ Project created successfully: {@Project}", project);

                return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "❌ InvalidOperation error creating project: {Message}", ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error creating project");
                return StatusCode(500, "An error occurred while creating the project");
            }
        }

        /// <summary>
        /// Update an existing project
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <param name="updateDto">Project update data</param>
        /// <returns>Updated project</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectResponseDto>> UpdateProject(int id, [FromBody] UpdateProjectRequestDto updateDto)
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

                var project = await _projectService.UpdateProjectAsync(id, updateDto, userId);
                return Ok(project);
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
                _logger.LogError(ex, "Error updating project {ProjectId}", id);
                return StatusCode(500, "An error occurred while updating the project");
            }
        }

        /// <summary>
        /// Delete a project
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteProject(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _projectService.DeleteProjectAsync(id, userId);
                if (!result)
                {
                    return NotFound("Project not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project {ProjectId}", id);
                return StatusCode(500, "An error occurred while deleting the project");
            }
        }

        /// <summary>
        /// Get projects by client ID
        /// </summary>
        /// <param name="clientId">Client ID</param>
        /// <returns>List of projects for the client</returns>
        [HttpGet("client/{clientId}")]
        public async Task<ActionResult<List<ProjectResponseDto>>> GetProjectsByClient(int clientId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var projects = await _projectService.GetProjectsByClientAsync(clientId, userId);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects for client {ClientId}", clientId);
                return StatusCode(500, "An error occurred while retrieving client projects");
            }
        }

        /// <summary>
        /// Get projects by status
        /// </summary>
        /// <param name="status">Project status</param>
        /// <returns>List of projects with the specified status</returns>
        [HttpGet("status/{status}")]
        public async Task<ActionResult<List<ProjectResponseDto>>> GetProjectsByStatus(ProjectStatus status)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new ProjectQueryDto { Status = status };
                var result = await _projectService.GetProjectsAsync(query, userId);
                var projects = result.Projects;
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects with status {Status}", status);
                return StatusCode(500, "An error occurred while retrieving projects by status");
            }
        }

        /// <summary>
        /// Get active projects
        /// </summary>
        /// <returns>List of active projects</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<ProjectResponseDto>>> GetActiveProjects()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var projects = await _projectService.GetActiveProjectsAsync(userId);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active projects");
                return StatusCode(500, "An error occurred while retrieving active projects");
            }
        }

        /// <summary>
        /// Search projects by name, code, or description
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching projects</returns>
        [HttpGet("search")]
        public async Task<ActionResult<List<ProjectResponseDto>>> SearchProjects([FromQuery] string searchTerm)
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

                var query = new ProjectQueryDto { SearchTerm = searchTerm };
                var result = await _projectService.GetProjectsAsync(query, userId);
                var projects = result.Projects;
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching projects with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching projects");
            }
        }

        /// <summary>
        /// Get projects with upcoming deadlines
        /// </summary>
        /// <param name="days">Number of days to look ahead (default: 30)</param>
        /// <returns>List of projects with upcoming deadlines</returns>
        [HttpGet("upcoming-deadlines")]
        public async Task<ActionResult<List<ProjectResponseDto>>> GetProjectsWithUpcomingDeadlines([FromQuery] int days = 30)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new ProjectQueryDto();
                var result = await _projectService.GetProjectsAsync(query, userId);
                var projects = result.Projects;
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects with upcoming deadlines");
                return StatusCode(500, "An error occurred while retrieving projects with upcoming deadlines");
            }
        }

    }
}