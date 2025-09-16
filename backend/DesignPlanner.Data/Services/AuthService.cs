using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;
using System.Security.Cryptography;
using System.Text;

namespace DesignPlanner.Data.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IConfiguration _configuration;
        private readonly int _refreshTokenExpirationDays;

        public AuthService(
            ApplicationDbContext context,
            IJwtTokenService jwtTokenService,
            IConfiguration configuration)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _configuration = configuration;
            _refreshTokenExpirationDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;

            // Generate tokens
            var accessToken = _jwtTokenService.GenerateAccessToken(user);
            var refreshToken = _jwtTokenService.GenerateRefreshToken();

            // Store refresh token
            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
                DeviceInfo = GetDeviceInfo()
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = _jwtTokenService.GetTokenExpiration(accessToken),
                User = MapToUserDto(user)
            };
        }

        public async Task<LoginResponseDto?> RegisterAsync(RegisterRequestDto request)
        {
            // Check if username already exists
            if (!await IsUsernameAvailableAsync(request.Username))
            {
                throw new ArgumentException("Username is already taken");
            }


            // Create user
            var user = new User
            {
                Username = request.Username,
                PasswordHash = HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create employee if additional info provided
            if (request.TeamId.HasValue && !string.IsNullOrEmpty(request.EmployeeId))
            {
                var employee = new Employee
                {
                    UserId = user.Id,
                    TeamId = request.TeamId.Value,
                    EmployeeId = request.EmployeeId,
                    Position = request.Position,
                    PhoneNumber = request.PhoneNumber,
                    HireDate = request.HireDate ?? DateTime.UtcNow,
                    IsActive = true
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                // Reload user with employee data
                user = await _context.Users
                    .Include(u => u.Employee)
                        .ThenInclude(e => e!.Team)
                    .FirstAsync(u => u.Id == user.Id);
            }

            // Generate tokens
            var accessToken = _jwtTokenService.GenerateAccessToken(user);
            var refreshToken = _jwtTokenService.GenerateRefreshToken();

            // Store refresh token
            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
                DeviceInfo = GetDeviceInfo()
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = _jwtTokenService.GetTokenExpiration(accessToken),
                User = MapToUserDto(user)
            };
        }

        public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .Include(rt => rt.User)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e!.Team)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);

            if (tokenEntity == null)
            {
                return null;
            }

            // Generate new tokens
            var accessToken = _jwtTokenService.GenerateAccessToken(tokenEntity.User);
            var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

            // Revoke old refresh token
            tokenEntity.IsRevoked = true;
            tokenEntity.RevokedAt = DateTime.UtcNow;

            // Create new refresh token
            var newRefreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = tokenEntity.UserId,
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
                DeviceInfo = GetDeviceInfo()
            };

            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = _jwtTokenService.GetTokenExpiration(accessToken),
                User = MapToUserDto(tokenEntity.User)
            };
        }

        public async Task LogoutAsync(int userId)
        {
            // Revoke all active refresh tokens for the user
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            return user != null ? MapToUserDto(user) : null;
        }

        public async Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                    .ThenInclude(e => e!.Team)
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

            return user != null ? MapToUserDto(user) : null;
        }


        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !VerifyPassword(currentPassword, user.PasswordHash))
            {
                return false;
            }

            user.PasswordHash = HashPassword(newPassword);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> IsUsernameAvailableAsync(string username)
        {
            return !await _context.Users.AnyAsync(u => u.Username == username);
        }


        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private static bool VerifyPassword(string password, string hashedPassword)
        {
            return HashPassword(password) == hashedPassword;
        }

        private static string GetDeviceInfo()
        {
            // In a real application, you might get this from the request headers
            return "Web Browser";
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Employee = user.Employee != null ? new EmployeeDto
                {
                    Id = user.Employee.Id,
                    EmployeeId = user.Employee.EmployeeId,
                    Position = user.Employee.Position,
                    PhoneNumber = user.Employee.PhoneNumber,
                    HireDate = user.Employee.HireDate,
                    IsActive = user.Employee.IsActive,
                    Team = user.Employee.Team != null ? new TeamDto
                    {
                        Id = user.Employee.Team.Id,
                        Name = user.Employee.Team.Name,
                        Description = user.Employee.Team.Description
                    } : null
                } : null
            };
        }
    }
}