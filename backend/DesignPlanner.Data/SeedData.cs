using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using DesignPlanner.Data.Services;

namespace DesignPlanner.Data
{
    /// <summary>
    /// Standalone program to seed the database with sample data.
    /// Can be run independently or called from the main application.
    /// </summary>
    public class SeedDataProgram
    {
        public static async Task Main(string[] args)
        {
            var forceRecreate = args.Contains("--force") || args.Contains("-f");
            var connectionString = args.FirstOrDefault(arg => arg.StartsWith("--connection="))?.Substring("--connection=".Length);
            
            if (string.IsNullOrEmpty(connectionString))
            {
                // Default connection string for development
                connectionString = "Data Source=designplanner.db";
                Console.WriteLine("Using default connection string. Use --connection=<your_connection_string> to specify a different one.");
            }

            Console.WriteLine("DesignPlanner Database Seeder");
            Console.WriteLine("============================");
            Console.WriteLine($"Connection: {connectionString}");
            Console.WriteLine($"Force recreate: {forceRecreate}");
            Console.WriteLine();

            // Create service collection
            var services = new ServiceCollection();
            
            // Configure logging
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });

            // Configure Entity Framework
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlite(connectionString);
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            });

            // Register the seeder
            services.AddDatabaseSeeder();

            // Build service provider
            var serviceProvider = services.BuildServiceProvider();

            try
            {
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<SeedDataProgram>>();

                // Ensure database exists
                logger.LogInformation("Ensuring database exists...");
                await context.Database.EnsureCreatedAsync();

                // Run migrations
                logger.LogInformation("Applying pending migrations...");
                await context.Database.MigrateAsync();

                // Seed data
                logger.LogInformation("Starting data seeding process...");
                await seeder.SeedAsync(forceRecreate);

                logger.LogInformation("Database seeding completed successfully!");
                
                // Display sample login credentials
                Console.WriteLine();
                Console.WriteLine("=== SAMPLE LOGIN CREDENTIALS ===");
                Console.WriteLine("Manager Account:");
                Console.WriteLine("  Username: manager");
                Console.WriteLine("  Password: password123");
                Console.WriteLine("  Role: Manager");
                Console.WriteLine();
                Console.WriteLine("Team Member Accounts:");
                Console.WriteLine("  Username: alex.smith | Password: password123 | Role: TeamMember");
                Console.WriteLine("  Username: emma.wilson | Password: password123 | Role: TeamMember");
                Console.WriteLine("  Username: david.brown | Password: password123 | Role: TeamMember");
                Console.WriteLine("  Username: lisa.taylor | Password: password123 | Role: TeamMember");
                Console.WriteLine("  Username: mike.garcia | Password: password123 | Role: TeamMember");
                Console.WriteLine();
                Console.WriteLine("=== SAMPLE DATA SUMMARY ===");
                Console.WriteLine("✓ 6 Users (1 Manager, 5 Team Members)");
                Console.WriteLine("✓ 1 Team (Design & Development Team)");
                Console.WriteLine("✓ 5 Clients (AWS, MSFT, GOOGLE, EQX, TATE)");
                Console.WriteLine("✓ 10 Projects (2 per client)");
                Console.WriteLine("✓ 35+ Project Tasks (various statuses and priorities)");
                Console.WriteLine("✓ Task Assignments for current and next week");
                Console.WriteLine("✓ 6 Leave Requests (pending and approved)");
                Console.WriteLine("✓ Employee Skills and Proficiency Levels");
                Console.WriteLine();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during seeding: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                Environment.ExitCode = 1;
            }
            finally
            {
                await serviceProvider.DisposeAsync();
            }
        }

        /// <summary>
        /// Method that can be called from the main application to seed data
        /// </summary>
        public static async Task SeedDatabaseAsync(IServiceProvider serviceProvider, bool forceRecreate = false)
        {
            using var scope = serviceProvider.CreateScope();
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync(forceRecreate);
        }
    }
}