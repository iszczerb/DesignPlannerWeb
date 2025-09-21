using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing users
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
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
        /// Get all users
        /// </summary>
        /// <returns>List of users</returns>
        [HttpGet]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<UserListResponseDto>> GetUsers([FromQuery] UserQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new UserQueryDto();
                var users = await _userService.GetUsersAsync(query, userId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users");
                return StatusCode(500, "An error occurred while retrieving users");
            }
        }

        /// <summary>
        /// Get a specific user by ID
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>User details</returns>
        [HttpGet("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<UserResponseDto>> GetUser(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var user = await _userService.GetUserByIdAsync(id, userId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", id);
                return StatusCode(500, "An error occurred while retrieving the user");
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        /// <param name="createDto">User creation data</param>
        /// <returns>Created user</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserRequestDto createDto)
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

                var user = await _userService.CreateUserAsync(createDto, userId);
                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, "An error occurred while creating the user");
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="updateDto">User update data</param>
        /// <returns>Updated user</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<UserResponseDto>> UpdateUser(int id, [FromBody] UpdateUserRequestDto updateDto)
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

                // Ensure the ID in the URL matches the ID in the body
                updateDto.Id = id;

                var user = await _userService.UpdateUserAsync(id, updateDto, userId);
                return Ok(user);
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
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, "An error occurred while updating the user");
            }
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _userService.DeleteUserAsync(id, userId);
                if (!result)
                {
                    return NotFound("User not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, "An error occurred while deleting the user");
            }
        }

        /// <summary>
        /// Get active users
        /// </summary>
        /// <returns>List of active users</returns>
        [HttpGet("active")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<UserResponseDto>>> GetActiveUsers()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var users = await _userService.GetActiveUsersAsync(userId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active users");
                return StatusCode(500, "An error occurred while retrieving active users");
            }
        }

        /// <summary>
        /// Get users by team ID
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <returns>List of users in the team</returns>
        [HttpGet("team/{teamId}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<UserResponseDto>>> GetUsersByTeam(int teamId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var users = await _userService.GetUsersByTeamAsync(teamId, userId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users for team {TeamId}", teamId);
                return StatusCode(500, "An error occurred while retrieving users by team");
            }
        }

        /// <summary>
        /// Get users by role
        /// </summary>
        /// <param name="role">User role</param>
        /// <returns>List of users with the specified role</returns>
        [HttpGet("role/{role}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<UserResponseDto>>> GetUsersByRole(UserRole role)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var users = await _userService.GetUsersByRoleAsync(role, userId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users with role {Role}", role);
                return StatusCode(500, "An error occurred while retrieving users by role");
            }
        }

        /// <summary>
        /// Search users by username, name, or position
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching users</returns>
        [HttpGet("search")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<UserResponseDto>>> SearchUsers([FromQuery] string searchTerm)
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

                var query = new UserQueryDto { SearchTerm = searchTerm };
                var result = await _userService.GetUsersAsync(query, userId);
                var users = result.Users;
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching users");
            }
        }

        /// <summary>
        /// Toggle user active status
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="isActive">New active status</param>
        /// <returns>Success confirmation</returns>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> ToggleUserStatus(int id, [FromBody] bool isActive)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _userService.ToggleUserStatusAsync(id, isActive, userId);
                if (!result)
                {
                    return NotFound("User not found");
                }

                return Ok(new { message = $"User {(isActive ? "activated" : "deactivated")} successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status for user {UserId}", id);
                return StatusCode(500, "An error occurred while updating user status");
            }
        }

        /// <summary>
        /// Change user password
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="request">Password change request</param>
        /// <returns>Success confirmation</returns>
        [HttpPost("{id}/change-password")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequestDto request)
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

                var result = await _userService.ChangePasswordAsync(id, request.NewPassword, userId);
                if (!result)
                {
                    return NotFound("User not found");
                }

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", id);
                return StatusCode(500, "An error occurred while changing password");
            }
        }

        /// <summary>
        /// Check if username exists
        /// </summary>
        /// <param name="username">Username to check</param>
        /// <param name="excludeUserId">Optional user ID to exclude from check</param>
        /// <returns>Boolean indicating if username exists</returns>
        [HttpGet("check-username")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<bool>> CheckUsername([FromQuery] string username, [FromQuery] int? excludeUserId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username))
                {
                    return BadRequest("Username is required");
                }

                var exists = await _userService.IsUsernameExistsAsync(username, excludeUserId);
                return Ok(exists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username {Username}", username);
                return StatusCode(500, "An error occurred while checking username");
            }
        }
    }

    /// <summary>
    /// DTO for password change requests
    /// </summary>
    public class ChangePasswordRequestDto
    {
        /// <summary>
        /// Current password for verification
        /// </summary>
        [Required(ErrorMessage = "Current password is required")]
        public string CurrentPassword { get; set; } = string.Empty;

        /// <summary>
        /// New password
        /// </summary>
        [Required(ErrorMessage = "New password is required")]
        [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }
}