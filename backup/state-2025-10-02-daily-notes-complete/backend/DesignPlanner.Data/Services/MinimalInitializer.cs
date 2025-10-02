using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using System.Security.Cryptography;
using System.Text;

namespace DesignPlanner.Data.Services
{
    public interface IMinimalInitializer
    {
        Task InitializeAsync();
    }

    public class MinimalInitializer : IMinimalInitializer
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MinimalInitializer> _logger;

        public MinimalInitializer(ApplicationDbContext context, ILogger<MinimalInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                _logger.LogInformation("Starting minimal initialization...");

                await EnsureDefaultTeamExists();
                await EnsureManagerUserExists();
                await EnsureBasicCategoriesExist();

                _logger.LogInformation("Minimal initialization completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during minimal initialization");
                throw;
            }
        }

        private async Task EnsureManagerUserExists()
        {
            var existingManager = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == "manager");

            if (existingManager == null)
            {
                _logger.LogInformation("Creating manager user...");

                var managerUser = new User
                {
                    Username = "manager",
                    PasswordHash = HashPassword("password123"),
                    Role = UserRole.Manager,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(managerUser);
                await _context.SaveChangesAsync();

                // Create corresponding employee record
                var managerEmployee = new Employee
                {
                    UserId = managerUser.Id,
                    TeamId = 1, // Will be set to default team later
                    EmployeeId = "EMP001",
                    FirstName = "System",
                    LastName = "Manager",
                    Position = "System Manager",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(managerEmployee);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Manager user and employee created successfully.");
            }
            else
            {
                _logger.LogInformation("Manager user already exists, skipping creation.");

                // Ensure the manager has the correct role
                if (existingManager.Role != UserRole.Manager)
                {
                    _logger.LogInformation("Updating manager user role to Manager...");
                    existingManager.Role = UserRole.Manager;
                    await _context.SaveChangesAsync();
                }
            }
        }

        private async Task EnsureDefaultTeamExists()
        {
            var existingTeam = await _context.Teams.FirstOrDefaultAsync();

            if (existingTeam == null)
            {
                _logger.LogInformation("Creating default team...");

                var defaultTeam = new Team
                {
                    Name = "Default Team",
                    Code = "DEFAULT",
                    Description = "Default team for initial setup",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Teams.Add(defaultTeam);
                await _context.SaveChangesAsync();

                // Assign manager employee to default team
                var managerEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.User.Username == "manager");

                if (managerEmployee != null)
                {
                    managerEmployee.TeamId = defaultTeam.Id;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Manager assigned to default team.");
                }

                _logger.LogInformation("Default team created successfully.");
            }
            else
            {
                _logger.LogInformation("Teams already exist, skipping default team creation.");
            }
        }

        private async Task EnsureBasicCategoriesExist()
        {
            var existingCategories = await _context.Categories.CountAsync();

            if (existingCategories == 0)
            {
                _logger.LogInformation("Creating basic categories...");

                var basicCategories = new[]
                {
                    new Category
                    {
                        Name = "Structural",
                        Description = "Structural engineering and design projects",
                        Color = "#3b82f6",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Name = "Non-Structural",
                        Description = "Non-structural engineering projects",
                        Color = "#10b981",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Name = "Manifold",
                        Description = "Manifold design and engineering projects",
                        Color = "#f59e0b",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Name = "Miscellaneous",
                        Description = "Miscellaneous and other project types",
                        Color = "#8b5cf6",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                _context.Categories.AddRange(basicCategories);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Basic categories created successfully.");
            }
            else
            {
                _logger.LogInformation("Categories already exist, skipping basic categories creation.");
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}