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

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000") // Vite dev server and common React ports
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Register custom services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Register database seeder
builder.Services.AddDatabaseSeeder();

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
    
    // Development-only database seeding endpoint
    app.MapMethods("/api/dev/seed-database", new[] { "GET", "POST" }, async (IServiceProvider serviceProvider, bool forceRecreate = false) =>
    {
        using var scope = serviceProvider.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        try
        {
            await seeder.SeedAsync(forceRecreate);
            logger.LogInformation("Database seeded successfully via API endpoint");
            return Results.Ok(new { 
                success = true, 
                message = "Database seeded successfully",
                loginCredentials = new {
                    manager = new { username = "manager", password = "password123" },
                    teamMembers = new[] {
                        new { username = "alex.smith", password = "password123" },
                        new { username = "emma.wilson", password = "password123" },
                        new { username = "david.brown", password = "password123" },
                        new { username = "lisa.taylor", password = "password123" },
                        new { username = "mike.garcia", password = "password123" }
                    }
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed database");
            return Results.Problem($"Failed to seed database: {ex.Message}");
        }
    }).WithTags("Development");
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("AllowReactApp");

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<DesignPlanner.Api.Hubs.LeaveNotificationHub>("/leaveHub");

app.Run();
