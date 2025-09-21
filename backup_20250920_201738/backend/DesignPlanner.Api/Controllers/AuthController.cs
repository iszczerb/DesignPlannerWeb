using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DesignPlanner.Core.Services;
using DesignPlanner.Core.DTOs;
using System.Security.Claims;

namespace DesignPlanner.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var response = await _authService.LoginAsync(request);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for user {Username}", request.Username);
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("register")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var response = await _authService.RegisterAsync(request);
                if (response == null)
                {
                    return BadRequest(new { message = "User registration failed" });
                }

                return CreatedAtAction(nameof(Register), response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for user {Username}", request.Username);
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<LoginResponseDto>> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var response = await _authService.RefreshTokenAsync(request.RefreshToken);
                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid refresh token" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                return StatusCode(500, new { message = "An error occurred during token refresh" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                await _authService.LogoutAsync(int.Parse(userId));
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _authService.GetUserByIdAsync(int.Parse(userId));
                if (user == null)
                {
                    return NotFound();
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current user");
                return StatusCode(500, new { message = "An error occurred retrieving user information" });
            }
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var success = await _authService.ChangePasswordAsync(int.Parse(userId), request.CurrentPassword, request.NewPassword);
                if (!success)
                {
                    return BadRequest(new { message = "Failed to change password. Please check your current password." });
                }

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change");
                return StatusCode(500, new { message = "An error occurred while changing password" });
            }
        }

        [HttpGet("debug-manager")]
        public async Task<ActionResult> DebugManager()
        {
            try
            {
                var managerUser = await _authService.GetUserByUsernameAsync("manager");

                if (managerUser == null)
                {
                    return Ok(new {
                        message = "Manager user not found in database",
                        found = false
                    });
                }

                var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                return Ok(new {
                    message = "Manager user debug info",
                    databaseUser = new {
                        id = managerUser.Id,
                        username = managerUser.Username,
                        role = managerUser.Role.ToString(),
                        isActive = managerUser.IsActive,
                        firstName = managerUser.FirstName,
                        lastName = managerUser.LastName
                    },
                    currentTokenClaims = allClaims,
                    currentUserRole = userRole,
                    isAuthenticated = User.Identity?.IsAuthenticated,
                    authType = User.Identity?.AuthenticationType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in debug endpoint");
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}