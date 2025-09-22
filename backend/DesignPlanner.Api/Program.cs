using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Services;
using AuthService = DesignPlanner.Data.Services.AuthService;
using EmployeeService = DesignPlanner.Data.Services.EmployeeService;
using LeaveService = DesignPlanner.Data.Services.LeaveService;
using ScheduleService = DesignPlanner.Data.Services.ScheduleService;
using ClientService = DesignPlanner.Data.Services.ClientService;
using ProjectService = DesignPlanner.Data.Services.ProjectService;
using TeamManagementService = DesignPlanner.Data.Services.TeamManagementService;
using SkillService = DesignPlanner.Data.Services.SkillService;
using TaskTypeService = DesignPlanner.Data.Services.TaskTypeService;
using HolidayService = DesignPlanner.Data.Services.HolidayService;
using DesignPlanner.Data.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add SignalR
builder.Services.AddSignalR();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=designplanner.db"));

// Add JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"] ?? throw new ArgumentNullException("Jwt:SecretKey not found in configuration");
var issuer = jwtSection["Issuer"] ?? "DesignPlannerApi";
var audience = jwtSection["Audience"] ?? "DesignPlannerApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"Token validated for user: {context.Principal?.Identity?.Name}");
            return Task.CompletedTask;
        }
    };
});

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("AllRoles", policy => policy.RequireRole("Admin", "Manager", "TeamMember"));
});

// Add CORS for React frontend and mobile devices
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", builder =>
    {
        builder.WithOrigins(
                "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180", "http://localhost:5181", "http://localhost:5182", "http://localhost:5183", "http://localhost:5184", "http://localhost:5185", "http://localhost:3000", // Localhost variants
                "http://192.168.200.83:5173", "http://192.168.200.83:5174", "http://192.168.200.83:5175", "http://192.168.200.83:5176", "http://192.168.200.83:5177", "http://192.168.200.83:5178", "http://192.168.200.83:5179", "http://192.168.200.83:5180", "http://192.168.200.83:5181", "http://192.168.200.83:5182", "http://192.168.200.83:5183", "http://192.168.200.83:5184", "http://192.168.200.83:5185", "http://192.168.200.83:3000", // Current network IP variants
                "http://192.168.0.125:5173", "http://192.168.0.125:5174", "http://192.168.0.125:5175", "http://192.168.0.125:5176", "http://192.168.0.125:5177", "http://192.168.0.125:5178", "http://192.168.0.125:5179", "http://192.168.0.125:5180", "http://192.168.0.125:5181", "http://192.168.0.125:5182", "http://192.168.0.125:5183", "http://192.168.0.125:5184", "http://192.168.0.125:5185", "http://192.168.0.125:3000" // Old network IP variants for compatibility
               )
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Register custom services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Register database management services
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITeamManagementService, TeamManagementService>();
builder.Services.AddScoped<ISkillService, SkillService>();
builder.Services.AddScoped<ITaskTypeService, TaskTypeService>();
builder.Services.AddScoped<IHolidayService, HolidayService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// SEEDING COMPLETELY DISABLED - DO NOT REGISTER SEEDING SERVICES
// builder.Services.AddScoped<IMinimalInitializer, MinimalInitializer>();

var app = builder.Build();

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Ensuring database exists and applying migrations...");
        await context.Database.MigrateAsync();
        logger.LogInformation("Database ready.");

        // SEEDING DISABLED - DO NOT CREATE ANY DATA
        // var initializer = scope.ServiceProvider.GetRequiredService<IMinimalInitializer>();
        // await initializer.InitializeAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating the database.");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
    
    // Database seeding endpoints disabled - manual data creation only

    // Development-only fix manager role endpoint
    app.MapPost("/api/dev/fix-manager-role", async (IServiceProvider serviceProvider) =>
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            var managerUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "manager");
            if (managerUser != null)
            {
                managerUser.Role = DesignPlanner.Core.Enums.UserRole.Manager;
                await context.SaveChangesAsync();
                logger.LogInformation("Manager role updated successfully");
                return Results.Ok(new { success = true, message = "Manager role updated to Manager (2)" });
            }
            else
            {
                return Results.NotFound(new { success = false, message = "Manager user not found" });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update manager role");
            return Results.Problem($"Failed to update manager role: {ex.Message}");
        }
    }).WithTags("Development");

    // Development-only revert manager role endpoint
    app.MapPost("/api/dev/revert-manager-role", async (IServiceProvider serviceProvider) =>
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            var managerUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "manager");
            if (managerUser != null)
            {
                managerUser.Role = DesignPlanner.Core.Enums.UserRole.TeamMember;
                await context.SaveChangesAsync();
                logger.LogInformation("Manager role reverted to TeamMember successfully");
                return Results.Ok(new { success = true, message = "Manager role reverted to TeamMember (3)" });
            }
            else
            {
                return Results.NotFound(new { success = false, message = "Manager user not found" });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to revert manager role");
            return Results.Problem($"Failed to revert manager role: {ex.Message}");
        }
    }).WithTags("Development");

    // Development-only set manager to admin endpoint
    app.MapPost("/api/dev/set-manager-admin", async (IServiceProvider serviceProvider) =>
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            var managerUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "manager");
            if (managerUser != null)
            {
                managerUser.Role = DesignPlanner.Core.Enums.UserRole.Admin;
                await context.SaveChangesAsync();
                logger.LogInformation("Manager role updated to Admin successfully");
                return Results.Ok(new { success = true, message = "Manager role updated to Admin (1)" });
            }
            else
            {
                return Results.NotFound(new { success = false, message = "Manager user not found" });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update manager role to Admin");
            return Results.Problem($"Failed to update manager role to Admin: {ex.Message}");
        }
    }).WithTags("Development");
}

// Temporarily disable HTTPS redirection for iPad access
// app.UseHttpsRedirection();

// Use CORS
app.UseCors("AllowReactApp");

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<DesignPlanner.Api.Hubs.LeaveNotificationHub>("/leaveHub");
app.MapHub<DesignPlanner.Api.Hubs.ScheduleUpdateHub>("/scheduleHub");

app.Run();
