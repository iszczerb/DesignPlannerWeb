using DesignPlanner.Core.Entities;
using System.Security.Claims;

namespace DesignPlanner.Core.Services
{
    public interface IJwtTokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
        bool ValidateToken(string token);
        DateTime GetTokenExpiration(string token);
        string? GetUserIdFromToken(string token);
        string? GetUsernameFromToken(string token);
    }
}