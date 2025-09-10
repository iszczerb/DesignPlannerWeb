using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using DesignPlanner.Data.Services;

namespace DesignPlanner.Data
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("DesignPlanner Database Seeder");
            Console.WriteLine("============================");

            var forceRecreate = args.Contains("--force") || args.Contains("-f");
            var help = args.Contains("--help") || args.Contains("-h");

            if (help)
            {
                ShowHelp();
                return;
            }

            Console.WriteLine($"Force recreate: {forceRecreate}");
            Console.WriteLine();

            // Build configuration
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddCommandLine(args)
                .Build();

            // Create service collection
            var services = new ServiceCollection();
            
            // Configure logging
            services.AddLogging(builder =>
            {
                builder.AddConfiguration(configuration.GetSection("Logging"));
                builder.AddConsole();
            });

            // Configure Entity Framework
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found in configuration");

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlite(connectionString);
                if (args.Contains("--verbose") || args.Contains("-v"))
                {
                    options.EnableSensitiveDataLogging();
                    options.EnableDetailedErrors();
                }
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
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                Console.WriteLine($"Connection: {connectionString}");
                Console.WriteLine();

                // Ensure database exists
                logger.LogInformation("Ensuring database exists...");
                await context.Database.EnsureCreatedAsync();

                // Run migrations
                logger.LogInformation("Applying pending migrations...");
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation($"Found {pendingMigrations.Count()} pending migrations: {string.Join(", ", pendingMigrations)}");
                    await context.Database.MigrateAsync();
                    logger.LogInformation("Migrations applied successfully");
                }
                else
                {
                    logger.LogInformation("No pending migrations found");
                }

                // Seed data
                logger.LogInformation("Starting data seeding process...");
                await seeder.SeedAsync(forceRecreate);

                logger.LogInformation("Database seeding completed successfully!");
                
                DisplaySummary();
            }
            catch (Exception ex)
            {
                Console.WriteLine();
                Console.WriteLine($"❌ Error during seeding: {ex.Message}");
                if (args.Contains("--verbose") || args.Contains("-v"))
                {
                    Console.WriteLine();
                    Console.WriteLine("Stack trace:");
                    Console.WriteLine(ex.StackTrace);
                }
                Environment.ExitCode = 1;
            }
            finally
            {
                await serviceProvider.DisposeAsync();
            }
        }

        private static void ShowHelp()
        {
            Console.WriteLine("Usage: DesignPlanner.Data.exe [options]");
            Console.WriteLine();
            Console.WriteLine("Options:");
            Console.WriteLine("  --force, -f       Force recreate all data (clears existing data first)");
            Console.WriteLine("  --verbose, -v     Enable verbose logging and detailed error messages");
            Console.WriteLine("  --help, -h        Show this help message");
            Console.WriteLine();
            Console.WriteLine("Connection String:");
            Console.WriteLine("  Modify appsettings.json to change the database connection string");
            Console.WriteLine("  Or use: --ConnectionStrings:DefaultConnection=\"your_connection_string\"");
            Console.WriteLine();
            Console.WriteLine("Examples:");
            Console.WriteLine("  DesignPlanner.Data.exe");
            Console.WriteLine("  DesignPlanner.Data.exe --force");
            Console.WriteLine("  DesignPlanner.Data.exe --verbose");
            Console.WriteLine();
        }

        private static void DisplaySummary()
        {
            Console.WriteLine();
            Console.WriteLine("🎉 SEEDING COMPLETED SUCCESSFULLY!");
            Console.WriteLine();
            Console.WriteLine("=== SAMPLE LOGIN CREDENTIALS ===");
            Console.WriteLine("Manager Account:");
            Console.WriteLine("  Username: manager");
            Console.WriteLine("  Password: password123");
            Console.WriteLine("  Role: Manager");
            Console.WriteLine();
            Console.WriteLine("Team Member Accounts:");
            Console.WriteLine("  Username: alex.smith     | Password: password123 | Position: Senior UI/UX Designer");
            Console.WriteLine("  Username: emma.wilson    | Password: password123 | Position: Full Stack Developer");
            Console.WriteLine("  Username: david.brown    | Password: password123 | Position: Backend Developer");
            Console.WriteLine("  Username: lisa.taylor    | Password: password123 | Position: Frontend Developer");
            Console.WriteLine("  Username: mike.garcia    | Password: password123 | Position: QA Tester");
            Console.WriteLine();
            Console.WriteLine("=== SAMPLE DATA SUMMARY ===");
            Console.WriteLine("✅ 6 Users (1 Manager, 5 Team Members)");
            Console.WriteLine("✅ 1 Team (Design & Development Team)");
            Console.WriteLine("✅ 5 Clients (AWS #FF9900, MSFT #0078D4, GOOGLE #4285F4, EQX #ED1C24, TATE #000000)");
            Console.WriteLine("✅ 10 Projects (2 per client using ABC123 format)");
            Console.WriteLine("✅ 35+ Project Tasks (Design, Development, Testing, Research, Planning, Review)");
            Console.WriteLine("✅ Task Assignments distributed across current and next week");
            Console.WriteLine("✅ 4-task-per-slot layout demonstration");
            Console.WriteLine("✅ 6 Leave Requests (mix of pending and approved)");
            Console.WriteLine("✅ Employee Skills with proficiency levels (1-5 scale)");
            Console.WriteLine("✅ Realistic annual leave balances and usage tracking");
            Console.WriteLine();
            Console.WriteLine("🚀 Ready for testing calendar views, drag-and-drop, and leave workflows!");
        }
    }
}