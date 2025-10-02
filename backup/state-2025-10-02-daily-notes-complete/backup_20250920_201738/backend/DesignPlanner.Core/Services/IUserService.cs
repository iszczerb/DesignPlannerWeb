using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for user management operations
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Creates a new user with employee record
        /// </summary>
        /// <param name="request">The user creation request</param>
        /// <param name="createdByUserId">ID of the user creating the user</param>
        /// <returns>The created user DTO</returns>
        Task<UserResponseDto?> CreateUserAsync(CreateUserRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing user and employee record
        /// </summary>
        /// <param name="userId">ID of the user to update</param>
        /// <param name="request">The user update request</param>
        /// <param name="updatedByUserId">ID of the user updating the user</param>
        /// <returns>The updated user DTO</returns>
        Task<UserResponseDto?> UpdateUserAsync(int userId, UpdateUserRequestDto request, int updatedByUserId);

        /// <summary>
        /// Deletes a user permanently (also removes employee record)
        /// </summary>
        /// <param name="userId">ID of the user to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the user</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteUserAsync(int userId, int deletedByUserId);

        /// <summary>
        /// Gets a user by ID with employee information
        /// </summary>
        /// <param name="userId">ID of the user to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the user</param>
        /// <returns>The user DTO if found</returns>
        Task<UserResponseDto?> GetUserByIdAsync(int userId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of users with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>Paginated user list response</returns>
        Task<UserListResponseDto> GetUsersAsync(UserQueryDto query, int requestingUserId);

        /// <summary>
        /// Gets all active users for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of active user DTOs</returns>
        Task<List<UserResponseDto>> GetActiveUsersAsync(int requestingUserId);

        /// <summary>
        /// Checks if a username is already in use
        /// </summary>
        /// <param name="username">The username to check</param>
        /// <param name="excludeUserId">Optional user ID to exclude from the check (for updates)</param>
        /// <returns>True if the username is already in use</returns>
        Task<bool> IsUsernameExistsAsync(string username, int? excludeUserId = null);

        /// <summary>
        /// Activates or deactivates a user
        /// </summary>
        /// <param name="userId">ID of the user to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user making the change</param>
        /// <returns>True if successful</returns>
        Task<bool> ToggleUserStatusAsync(int userId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Changes a user's password
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="newPassword">New password</param>
        /// <param name="updatedByUserId">ID of the user making the change</param>
        /// <returns>True if successful</returns>
        Task<bool> ChangePasswordAsync(int userId, string newPassword, int updatedByUserId);

        /// <summary>
        /// Gets users by team ID
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of users in the team</returns>
        Task<List<UserResponseDto>> GetUsersByTeamAsync(int teamId, int requestingUserId);

        /// <summary>
        /// Gets users by role
        /// </summary>
        /// <param name="role">User role</param>
        /// <param name="requestingUserId">ID of the user requesting the users</param>
        /// <returns>List of users with the specified role</returns>
        Task<List<UserResponseDto>> GetUsersByRoleAsync(Core.Enums.UserRole role, int requestingUserId);
    }
}