using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
        Task<LoginResponseDto?> RegisterAsync(RegisterRequestDto request);
        Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(int userId);
        Task<UserDto?> GetUserByIdAsync(int userId);
        Task<UserDto?> GetUserByUsernameAsync(string username);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<bool> IsUsernameAvailableAsync(string username);
    }
}