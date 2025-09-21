using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing teams
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamManagementService _teamService;
        private readonly ILogger<TeamController> _logger;

        public TeamController(ITeamManagementService teamService, ILogger<TeamController> logger)
        {
            _teamService = teamService;
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
        /// Get all teams
        /// </summary>
        /// <returns>List of teams</returns>
        [HttpGet]
        public async Task<ActionResult<TeamListResponseDto>> GetTeams([FromQuery] TeamQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new TeamQueryDto();
                var teams = await _teamService.GetTeamsAsync(query, userId);
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving teams");
                return StatusCode(500, "An error occurred while retrieving teams");
            }
        }

        /// <summary>
        /// Get a specific team by ID
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <returns>Team details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<TeamResponseDto>> GetTeam(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var team = await _teamService.GetTeamByIdAsync(id, userId);
                if (team == null)
                {
                    return NotFound("Team not found");
                }

                return Ok(team);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team {TeamId}", id);
                return StatusCode(500, "An error occurred while retrieving the team");
            }
        }

        /// <summary>
        /// Create a new team
        /// </summary>
        /// <param name="createDto">Team creation data</param>
        /// <returns>Created team</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<TeamResponseDto>> CreateTeam([FromBody] CreateTeamRequestDto createDto)
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

                var team = await _teamService.CreateTeamAsync(createDto, userId);
                return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, team);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating team");
                return StatusCode(500, "An error occurred while creating the team");
            }
        }

        /// <summary>
        /// Update an existing team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="updateDto">Team update data</param>
        /// <returns>Updated team</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<TeamResponseDto>> UpdateTeam(int id, [FromBody] UpdateTeamRequestDto updateDto)
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

                var team = await _teamService.UpdateTeamAsync(id, updateDto, userId);
                return Ok(team);
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
                _logger.LogError(ex, "Error updating team {TeamId}", id);
                return StatusCode(500, "An error occurred while updating the team");
            }
        }

        /// <summary>
        /// Delete a team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteTeam(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _teamService.DeleteTeamAsync(id, userId);
                if (!result)
                {
                    return NotFound("Team not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting team {TeamId}", id);
                return StatusCode(500, "An error occurred while deleting the team");
            }
        }

        /// <summary>
        /// Get active teams
        /// </summary>
        /// <returns>List of active teams</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<TeamDto>>> GetActiveTeams()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var teams = await _teamService.GetActiveTeamsAsync(userId);
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active teams");
                return StatusCode(500, "An error occurred while retrieving active teams");
            }
        }

        /// <summary>
        /// Search teams by name or code
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching teams</returns>
        [HttpGet("search")]
        public async Task<ActionResult<List<TeamDto>>> SearchTeams([FromQuery] string searchTerm)
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

                var query = new TeamQueryDto { SearchTerm = searchTerm };
                var result = await _teamService.GetTeamsAsync(query, userId);
                var teams = result.Teams;
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching teams with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching teams");
            }
        }

        /// <summary>
        /// Get team members
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <returns>List of team members</returns>
        [HttpGet("{id}/members")]
        public async Task<ActionResult<List<object>>> GetTeamMembers(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var memberCount = await _teamService.GetTeamMemberCountAsync(id);
                var members = new { Count = memberCount };
                return Ok(members);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team members for team {TeamId}", id);
                return StatusCode(500, "An error occurred while retrieving team members");
            }
        }

        /// <summary>
        /// Add member to team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="employeeId">Employee ID to add</param>
        /// <returns>Success confirmation</returns>
        [HttpPost("{id}/members/{employeeId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> AddTeamMember(int id, int employeeId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, so we'll return not implemented
                return StatusCode(501, "Add team member functionality not implemented");
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
                _logger.LogError(ex, "Error adding employee {EmployeeId} to team {TeamId}", employeeId, id);
                return StatusCode(500, "An error occurred while adding the team member");
            }
        }

        /// <summary>
        /// Remove member from team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="employeeId">Employee ID to remove</param>
        /// <returns>Success confirmation</returns>
        [HttpDelete("{id}/members/{employeeId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> RemoveTeamMember(int id, int employeeId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, so we'll return not implemented
                return StatusCode(501, "Remove team member functionality not implemented");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing employee {EmployeeId} from team {TeamId}", employeeId, id);
                return StatusCode(500, "An error occurred while removing the team member");
            }
        }
    }
}