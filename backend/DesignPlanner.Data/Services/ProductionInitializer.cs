using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using System.Security.Cryptography;
using System.Text;

namespace DesignPlanner.Data.Services
{
    public interface IProductionInitializer
    {
        Task InitializeAsync();
    }

    public class ProductionInitializer : IProductionInitializer
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductionInitializer> _logger;

        public ProductionInitializer(ApplicationDbContext context, ILogger<ProductionInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                _logger.LogInformation("Checking for admin user...");

                // Only create admin if no users exist at all
                var hasUsers = await _context.Users.AnyAsync();
                if (hasUsers)
                {
                    _logger.LogInformation("Users already exist. Skipping initialization.");
                    return;
                }

                _logger.LogInformation("Creating admin user...");

                var adminUser = new User
                {
                    Username = "admin",
                    PasswordHash = HashPassword("admin123"),
                    FirstName = "Admin",
                    LastName = "User",
                    Role = UserRole.Admin,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin user created successfully. Username: admin, Password: admin123");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during production initialization");
                throw;
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}
