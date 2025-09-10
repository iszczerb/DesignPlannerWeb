using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Data.Context;
using System.Security.Cryptography;
using System.Text;

namespace DesignPlanner.Data.Services
{
    public class DatabaseSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DatabaseSeeder> _logger;

        public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedAsync(bool forceRecreate = false)
        {
            try
            {
                _logger.LogInformation("Starting database seeding...");

                // Check if data already exists
                var hasData = await _context.Users.AnyAsync();
                if (hasData && !forceRecreate)
                {
                    _logger.LogInformation("Database already has data. Use forceRecreate=true to reseed.");
                    return;
                }

                if (forceRecreate && hasData)
                {
                    _logger.LogInformation("Clearing existing data...");
                    await ClearDataAsync();
                }

                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // Seed data in order of dependencies
                await SeedTeamsAsync();
                await SeedUsersAsync();
                await SeedEmployeesAsync();
                await SeedEmployeeSkillsAsync();
                await SeedClientsAsync();
                await SeedProjectsAsync();
                await SeedTasksAsync();
                await SeedAssignmentsAsync();
                await SeedLeaveRequestsAsync();

                _logger.LogInformation("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during database seeding");
                throw;
            }
        }

        private async Task ClearDataAsync()
        {
            // Clear data in reverse dependency order
            _context.Assignments.RemoveRange(_context.Assignments);
            _context.LeaveRequests.RemoveRange(_context.LeaveRequests);
            _context.ProjectTasks.RemoveRange(_context.ProjectTasks);
            _context.Projects.RemoveRange(_context.Projects);
            _context.EmployeeSkills.RemoveRange(_context.EmployeeSkills);
            _context.Employees.RemoveRange(_context.Employees);
            _context.RefreshTokens.RemoveRange(_context.RefreshTokens);
            _context.Users.RemoveRange(_context.Users);
            _context.Teams.RemoveRange(_context.Teams);
            
            // Keep clients, skills, and task types as they are seeded by migrations
            
            await _context.SaveChangesAsync();
        }

        private async Task SeedTeamsAsync()
        {
            if (!await _context.Teams.AnyAsync())
            {
                var team = new Team
                {
                    Id = 1,
                    Name = "Design & Development Team",
                    Description = "Main team responsible for design and development projects",
                    Code = "TEAM01",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Teams.Add(team);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Teams seeded successfully");
            }
        }

        private async Task SeedUsersAsync()
        {
            if (!await _context.Users.AnyAsync())
            {
                var users = new List<User>
                {
                    // Manager
                    new User
                    {
                        Id = 1,
                        Username = "manager",
                        Email = "manager@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "Sarah",
                        LastName = "Johnson",
                        Role = UserRole.Manager,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    },
                    // Team Members
                    new User
                    {
                        Id = 2,
                        Username = "alex.smith",
                        Email = "alex.smith@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "Alex",
                        LastName = "Smith",
                        Role = UserRole.TeamMember,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-5)
                    },
                    new User
                    {
                        Id = 3,
                        Username = "emma.wilson",
                        Email = "emma.wilson@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "Emma",
                        LastName = "Wilson",
                        Role = UserRole.TeamMember,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-4)
                    },
                    new User
                    {
                        Id = 4,
                        Username = "david.brown",
                        Email = "david.brown@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "David",
                        LastName = "Brown",
                        Role = UserRole.TeamMember,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-3)
                    },
                    new User
                    {
                        Id = 5,
                        Username = "lisa.taylor",
                        Email = "lisa.taylor@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "Lisa",
                        LastName = "Taylor",
                        Role = UserRole.TeamMember,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-2)
                    },
                    new User
                    {
                        Id = 6,
                        Username = "mike.garcia",
                        Email = "mike.garcia@designplanner.com",
                        PasswordHash = HashPassword("password123"),
                        FirstName = "Mike",
                        LastName = "Garcia",
                        Role = UserRole.TeamMember,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-1)
                    }
                };

                _context.Users.AddRange(users);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Users seeded successfully");
            }
        }

        private async Task SeedEmployeesAsync()
        {
            if (!await _context.Employees.AnyAsync())
            {
                var employees = new List<Employee>
                {
                    new Employee
                    {
                        Id = 1,
                        UserId = 1,
                        TeamId = 1,
                        EmployeeId = "EMP001",
                        Position = "Team Manager",
                        PhoneNumber = "+1-555-0001",
                        HireDate = DateTime.UtcNow.AddMonths(-24),
                        TotalAnnualLeaveDays = 30,
                        UsedLeaveDays = 8,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-6)
                    },
                    new Employee
                    {
                        Id = 2,
                        UserId = 2,
                        TeamId = 1,
                        EmployeeId = "EMP002",
                        Position = "Senior UI/UX Designer",
                        PhoneNumber = "+1-555-0002",
                        HireDate = DateTime.UtcNow.AddMonths(-18),
                        TotalAnnualLeaveDays = 25,
                        UsedLeaveDays = 5,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-5)
                    },
                    new Employee
                    {
                        Id = 3,
                        UserId = 3,
                        TeamId = 1,
                        EmployeeId = "EMP003",
                        Position = "Full Stack Developer",
                        PhoneNumber = "+1-555-0003",
                        HireDate = DateTime.UtcNow.AddMonths(-15),
                        TotalAnnualLeaveDays = 25,
                        UsedLeaveDays = 3,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-4)
                    },
                    new Employee
                    {
                        Id = 4,
                        UserId = 4,
                        TeamId = 1,
                        EmployeeId = "EMP004",
                        Position = "Backend Developer",
                        PhoneNumber = "+1-555-0004",
                        HireDate = DateTime.UtcNow.AddMonths(-12),
                        TotalAnnualLeaveDays = 25,
                        UsedLeaveDays = 2,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-3)
                    },
                    new Employee
                    {
                        Id = 5,
                        UserId = 5,
                        TeamId = 1,
                        EmployeeId = "EMP005",
                        Position = "Frontend Developer",
                        PhoneNumber = "+1-555-0005",
                        HireDate = DateTime.UtcNow.AddMonths(-8),
                        TotalAnnualLeaveDays = 25,
                        UsedLeaveDays = 1,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-2)
                    },
                    new Employee
                    {
                        Id = 6,
                        UserId = 6,
                        TeamId = 1,
                        EmployeeId = "EMP006",
                        Position = "QA Tester",
                        PhoneNumber = "+1-555-0006",
                        HireDate = DateTime.UtcNow.AddMonths(-6),
                        TotalAnnualLeaveDays = 25,
                        UsedLeaveDays = 0,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-1)
                    }
                };

                _context.Employees.AddRange(employees);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Employees seeded successfully");
            }
        }

        private async Task SeedEmployeeSkillsAsync()
        {
            if (!await _context.EmployeeSkills.AnyAsync())
            {
                var employeeSkills = new List<EmployeeSkill>
                {
                    // Sarah Johnson (Manager) - Leadership and technical overview
                    new EmployeeSkill { EmployeeId = 1, SkillId = 5, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-3) }, // Project Management
                    new EmployeeSkill { EmployeeId = 1, SkillId = 1, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // C#
                    
                    // Alex Smith (UI/UX Designer)
                    new EmployeeSkill { EmployeeId = 2, SkillId = 4, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-4) }, // UI/UX Design
                    new EmployeeSkill { EmployeeId = 2, SkillId = 2, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // JavaScript
                    new EmployeeSkill { EmployeeId = 2, SkillId = 3, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-1) }, // React
                    
                    // Emma Wilson (Full Stack Developer)
                    new EmployeeSkill { EmployeeId = 3, SkillId = 1, ProficiencyLevel = 4, AcquiredDate = DateTime.UtcNow.AddYears(-3) }, // C#
                    new EmployeeSkill { EmployeeId = 3, SkillId = 2, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-4) }, // JavaScript
                    new EmployeeSkill { EmployeeId = 3, SkillId = 3, ProficiencyLevel = 4, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // React
                    new EmployeeSkill { EmployeeId = 3, SkillId = 6, ProficiencyLevel = 4, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // Database Design
                    new EmployeeSkill { EmployeeId = 3, SkillId = 7, ProficiencyLevel = 4, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // API Development
                    
                    // David Brown (Backend Developer)
                    new EmployeeSkill { EmployeeId = 4, SkillId = 1, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-5) }, // C#
                    new EmployeeSkill { EmployeeId = 4, SkillId = 6, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-3) }, // Database Design
                    new EmployeeSkill { EmployeeId = 4, SkillId = 7, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-3) }, // API Development
                    new EmployeeSkill { EmployeeId = 4, SkillId = 8, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-1) }, // Testing
                    
                    // Lisa Taylor (Frontend Developer)
                    new EmployeeSkill { EmployeeId = 5, SkillId = 2, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-3) }, // JavaScript
                    new EmployeeSkill { EmployeeId = 5, SkillId = 3, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // React
                    new EmployeeSkill { EmployeeId = 5, SkillId = 4, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-1) }, // UI/UX Design
                    
                    // Mike Garcia (QA Tester)
                    new EmployeeSkill { EmployeeId = 6, SkillId = 8, ProficiencyLevel = 5, AcquiredDate = DateTime.UtcNow.AddYears(-4) }, // Testing
                    new EmployeeSkill { EmployeeId = 6, SkillId = 2, ProficiencyLevel = 3, AcquiredDate = DateTime.UtcNow.AddYears(-2) }, // JavaScript
                    new EmployeeSkill { EmployeeId = 6, SkillId = 1, ProficiencyLevel = 2, AcquiredDate = DateTime.UtcNow.AddYears(-1) }  // C#
                };

                _context.EmployeeSkills.AddRange(employeeSkills);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Employee skills seeded successfully");
            }
        }

        private async Task SeedClientsAsync()
        {
            var clients = await _context.Clients.ToListAsync();
            
            // Update existing clients with contact information and colors
            var clientUpdates = new Dictionary<string, (string ContactEmail, string ContactPhone, string Address)>
            {
                ["AWS"] = ("contact@aws.amazon.com", "+1-206-266-1000", "410 Terry Avenue North, Seattle, WA 98109"),
                ["MSFT"] = ("contact@microsoft.com", "+1-425-882-8080", "One Microsoft Way, Redmond, WA 98052"),
                ["GOOGLE"] = ("contact@google.com", "+1-650-253-0000", "1600 Amphitheatre Parkway, Mountain View, CA 94043"),
                ["EQX"] = ("contact@equinix.com", "+1-650-598-6000", "One Lagoon Drive, Redwood City, CA 94065"),
                ["TATE"] = ("info@tate.org.uk", "+44-20-7887-8888", "Millbank, London SW1P 4RG, United Kingdom")
            };

            foreach (var client in clients)
            {
                if (clientUpdates.ContainsKey(client.Code))
                {
                    var (email, phone, address) = clientUpdates[client.Code];
                    client.ContactEmail = email;
                    client.ContactPhone = phone;
                    client.Address = address;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Client information updated successfully");
        }

        private async Task SeedProjectsAsync()
        {
            if (!await _context.Projects.AnyAsync())
            {
                var projects = new List<Project>
                {
                    // AWS Projects
                    new Project
                    {
                        Id = 1,
                        ClientId = 1, // AWS
                        Code = "AWS001",
                        Name = "AWS Cloud Migration Dashboard",
                        Description = "Develop a comprehensive dashboard for monitoring cloud migration processes",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddMonths(-2),
                        EndDate = DateTime.UtcNow.AddMonths(3),
                        DeadlineDate = DateTime.UtcNow.AddMonths(3),
                        Budget = 125000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-2)
                    },
                    new Project
                    {
                        Id = 2,
                        ClientId = 1, // AWS
                        Code = "AWS015",
                        Name = "Serverless Analytics Platform",
                        Description = "Build serverless analytics platform using AWS Lambda and DynamoDB",
                        Status = ProjectStatus.Planning,
                        StartDate = DateTime.UtcNow.AddDays(15),
                        EndDate = DateTime.UtcNow.AddMonths(4),
                        DeadlineDate = DateTime.UtcNow.AddMonths(4),
                        Budget = 85000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-7)
                    },
                    
                    // Microsoft Projects
                    new Project
                    {
                        Id = 3,
                        ClientId = 2, // MSFT
                        Code = "MSF023",
                        Name = "Teams Integration Suite",
                        Description = "Develop custom integrations for Microsoft Teams platform",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddMonths(-1),
                        EndDate = DateTime.UtcNow.AddMonths(2),
                        DeadlineDate = DateTime.UtcNow.AddMonths(2),
                        Budget = 95000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-1)
                    },
                    new Project
                    {
                        Id = 4,
                        ClientId = 2, // MSFT
                        Code = "MSF056",
                        Name = "Azure DevOps Extensions",
                        Description = "Create custom extensions for Azure DevOps workflows",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddDays(-21),
                        EndDate = DateTime.UtcNow.AddMonths(2).AddDays(10),
                        DeadlineDate = DateTime.UtcNow.AddMonths(2).AddDays(10),
                        Budget = 67000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-21)
                    },
                    
                    // Google Projects
                    new Project
                    {
                        Id = 5,
                        ClientId = 3, // GOOGLE
                        Code = "GOO017",
                        Name = "Firebase Real-time Chat App",
                        Description = "Develop real-time chat application using Firebase and React",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddDays(-14),
                        EndDate = DateTime.UtcNow.AddMonths(1).AddDays(16),
                        DeadlineDate = DateTime.UtcNow.AddMonths(1).AddDays(16),
                        Budget = 48000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-14)
                    },
                    new Project
                    {
                        Id = 6,
                        ClientId = 3, // GOOGLE
                        Code = "GOO029",
                        Name = "Google Workspace Automation",
                        Description = "Automate workflows across Google Workspace applications",
                        Status = ProjectStatus.Planning,
                        StartDate = DateTime.UtcNow.AddDays(30),
                        EndDate = DateTime.UtcNow.AddMonths(3),
                        DeadlineDate = DateTime.UtcNow.AddMonths(3),
                        Budget = 72000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    },
                    
                    // Equinix Projects
                    new Project
                    {
                        Id = 7,
                        ClientId = 4, // EQX
                        Code = "EQX042",
                        Name = "Data Center Monitoring System",
                        Description = "Build comprehensive monitoring system for data center operations",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddMonths(-1).AddDays(5),
                        EndDate = DateTime.UtcNow.AddMonths(3).AddDays(5),
                        DeadlineDate = DateTime.UtcNow.AddMonths(3).AddDays(5),
                        Budget = 156000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddMonths(-1).AddDays(5)
                    },
                    new Project
                    {
                        Id = 8,
                        ClientId = 4, // EQX
                        Code = "EQX011",
                        Name = "Network Performance Analytics",
                        Description = "Develop analytics platform for network performance monitoring",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddDays(-28),
                        EndDate = DateTime.UtcNow.AddMonths(2).AddDays(2),
                        DeadlineDate = DateTime.UtcNow.AddMonths(2).AddDays(2),
                        Budget = 89000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-28)
                    },
                    
                    // Tate Projects
                    new Project
                    {
                        Id = 9,
                        ClientId = 5, // TATE
                        Code = "TAT008",
                        Name = "Digital Art Gallery Platform",
                        Description = "Create interactive digital platform for art exhibitions",
                        Status = ProjectStatus.Active,
                        StartDate = DateTime.UtcNow.AddDays(-35),
                        EndDate = DateTime.UtcNow.AddMonths(2).AddDays(25),
                        DeadlineDate = DateTime.UtcNow.AddMonths(2).AddDays(25),
                        Budget = 115000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-35)
                    },
                    new Project
                    {
                        Id = 10,
                        ClientId = 5, // TATE
                        Code = "TAT003",
                        Name = "Virtual Museum Tours",
                        Description = "Develop VR-enabled virtual tours for museum collections",
                        Status = ProjectStatus.Planning,
                        StartDate = DateTime.UtcNow.AddDays(45),
                        EndDate = DateTime.UtcNow.AddMonths(5),
                        DeadlineDate = DateTime.UtcNow.AddMonths(5),
                        Budget = 203000.00m,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-10)
                    }
                };

                _context.Projects.AddRange(projects);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Projects seeded successfully");
            }
        }

        private async Task SeedTasksAsync()
        {
            if (!await _context.ProjectTasks.AnyAsync())
            {
                var tasks = new List<ProjectTask>();
                var taskId = 1;

                // Helper method to create tasks
                void AddTask(int projectId, string title, int taskTypeId, DesignPlanner.Core.Enums.TaskStatus status, TaskPriority priority, int estimatedHours, DateTime? dueDate = null)
                {
                    tasks.Add(new ProjectTask
                    {
                        Id = taskId++,
                        ProjectId = projectId,
                        TaskTypeId = taskTypeId,
                        Title = title,
                        Status = status,
                        Priority = priority,
                        EstimatedHours = estimatedHours,
                        DueDate = dueDate,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30))
                    });
                }

                // AWS001 - AWS Cloud Migration Dashboard
                AddTask(1, "Design migration dashboard wireframes", 1, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 8, DateTime.UtcNow.AddDays(2));
                AddTask(1, "Implement user authentication system", 2, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.High, 16, DateTime.UtcNow.AddDays(5));
                AddTask(1, "Create migration progress tracking API", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 12, DateTime.UtcNow.AddDays(8));
                AddTask(1, "Test dashboard functionality", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 6, DateTime.UtcNow.AddDays(12));
                AddTask(1, "Review security implementation", 6, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 4, DateTime.UtcNow.AddDays(15));

                // MSF023 - Teams Integration Suite
                AddTask(3, "Research Teams API capabilities", 4, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.Medium, 6);
                AddTask(3, "Design integration architecture", 5, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 10);
                AddTask(3, "Develop bot integration module", 2, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.High, 20, DateTime.UtcNow.AddDays(3));
                AddTask(3, "Create webhook handlers", 2, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.Medium, 14, DateTime.UtcNow.AddDays(6));
                AddTask(3, "Test Teams integration", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 8, DateTime.UtcNow.AddDays(10));

                // MSF056 - Azure DevOps Extensions
                AddTask(4, "Analyze extension requirements", 4, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.Medium, 4);
                AddTask(4, "Design extension UI mockups", 1, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.Medium, 12, DateTime.UtcNow.AddDays(1));
                AddTask(4, "Implement pipeline extension", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 18, DateTime.UtcNow.AddDays(7));
                AddTask(4, "Create automated tests", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 10, DateTime.UtcNow.AddDays(14));

                // GOO017 - Firebase Real-time Chat App
                AddTask(5, "Design chat interface", 1, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 8);
                AddTask(5, "Set up Firebase configuration", 2, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 4);
                AddTask(5, "Implement real-time messaging", 2, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.Critical, 16, DateTime.UtcNow.AddDays(2));
                AddTask(5, "Add user presence indicators", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 6, DateTime.UtcNow.AddDays(5));
                AddTask(5, "Test real-time functionality", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 8, DateTime.UtcNow.AddDays(9));

                // EQX042 - Data Center Monitoring System
                AddTask(7, "Plan monitoring architecture", 5, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 12);
                AddTask(7, "Design monitoring dashboard", 1, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.High, 16, DateTime.UtcNow.AddDays(3));
                AddTask(7, "Develop sensor data collection", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Critical, 20, DateTime.UtcNow.AddDays(8));
                AddTask(7, "Create alert system", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 14, DateTime.UtcNow.AddDays(12));
                AddTask(7, "Test monitoring accuracy", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 10, DateTime.UtcNow.AddDays(18));

                // EQX011 - Network Performance Analytics
                AddTask(8, "Research analytics requirements", 4, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.Medium, 6);
                AddTask(8, "Design analytics dashboard", 1, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.Medium, 12, DateTime.UtcNow.AddDays(4));
                AddTask(8, "Implement data processing pipeline", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 18, DateTime.UtcNow.AddDays(9));
                AddTask(8, "Create performance reports", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 8, DateTime.UtcNow.AddDays(15));

                // TAT008 - Digital Art Gallery Platform
                AddTask(9, "Design gallery interface", 1, DesignPlanner.Core.Enums.TaskStatus.Done, TaskPriority.High, 14);
                AddTask(9, "Develop artwork display system", 2, DesignPlanner.Core.Enums.TaskStatus.InProgress, TaskPriority.High, 20, DateTime.UtcNow.AddDays(1));
                AddTask(9, "Implement search functionality", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 12, DateTime.UtcNow.AddDays(6));
                AddTask(9, "Create admin management panel", 2, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.Medium, 16, DateTime.UtcNow.AddDays(11));
                AddTask(9, "Test platform usability", 3, DesignPlanner.Core.Enums.TaskStatus.NotStarted, TaskPriority.High, 10, DateTime.UtcNow.AddDays(16));

                _context.ProjectTasks.AddRange(tasks);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Project tasks seeded successfully");
            }
        }

        private async Task SeedAssignmentsAsync()
        {
            if (!await _context.Assignments.AnyAsync())
            {
                var assignments = new List<Assignment>();
                var random = new Random(42); // Fixed seed for consistent results

                // Get current week Monday
                var today = DateTime.Today;
                var daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
                var currentWeekMonday = today.AddDays(-daysUntilMonday);

                // Generate assignments for current week and next week (14 days)
                for (int dayOffset = 0; dayOffset < 14; dayOffset++)
                {
                    var assignmentDate = currentWeekMonday.AddDays(dayOffset);
                    
                    // Skip weekends
                    if (assignmentDate.DayOfWeek == DayOfWeek.Saturday || assignmentDate.DayOfWeek == DayOfWeek.Sunday)
                        continue;

                    // Get active tasks that could be assigned
                    var availableTasks = new List<int> { 2, 3, 8, 9, 13, 14, 18, 20, 22, 25, 27, 30, 32, 34 }; // Task IDs for in-progress and not-started tasks

                    // Assign tasks to employees (ensuring variety and realistic workload)
                    var employeeAssignments = new Dictionary<int, List<(int taskId, Slot slot)>>();

                    // Initialize employee assignment tracking
                    for (int empId = 1; empId <= 6; empId++)
                    {
                        employeeAssignments[empId] = new List<(int, Slot)>();
                    }

                    // Distribute tasks across employees and slots
                    var taskIndex = 0;
                    foreach (var empId in employeeAssignments.Keys.ToList())
                    {
                        // Each employee gets 1-4 tasks per day (varied distribution)
                        var tasksPerDay = dayOffset < 7 ? random.Next(2, 5) : random.Next(1, 4); // More tasks current week

                        for (int taskNum = 0; taskNum < tasksPerDay && taskIndex < availableTasks.Count; taskNum++)
                        {
                            var slot = taskNum < 2 ? Slot.Morning : Slot.Afternoon;
                            var taskId = availableTasks[taskIndex % availableTasks.Count];
                            employeeAssignments[empId].Add((taskId, slot));
                            taskIndex++;
                        }
                    }

                    // Create assignment records
                    foreach (var empId in employeeAssignments.Keys)
                    {
                        foreach (var (taskId, slot) in employeeAssignments[empId])
                        {
                            assignments.Add(new Assignment
                            {
                                TaskId = taskId,
                                EmployeeId = empId,
                                AssignedDate = assignmentDate,
                                Slot = slot,
                                Notes = GenerateAssignmentNote(taskId, slot),
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 7))
                            });
                        }
                    }
                }

                _context.Assignments.AddRange(assignments);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Assignments seeded successfully - {assignments.Count} assignments created");
            }
        }

        private static string GenerateAssignmentNote(int taskId, Slot slot)
        {
            var notes = new Dictionary<int, string>
            {
                [2] = "Focus on authentication security best practices",
                [3] = "Ensure API follows RESTful conventions",
                [8] = "Coordinate with Teams API documentation",
                [9] = "Test webhook reliability under load",
                [13] = "Follow Azure DevOps extension guidelines",
                [14] = "Include unit and integration tests",
                [18] = "Optimize for real-time performance",
                [20] = "Consider offline functionality",
                [22] = "Implement responsive design principles",
                [25] = "Focus on scalability requirements",
                [27] = "Ensure cross-browser compatibility",
                [30] = "Include error handling and logging",
                [32] = "Test with various data volumes",
                [34] = "Document API endpoints thoroughly"
            };

            var baseNote = notes.ContainsKey(taskId) ? notes[taskId] : "Standard task execution";
            var slotNote = slot == Slot.Morning ? "Morning focus session" : "Afternoon collaboration time";
            
            return $"{baseNote} - {slotNote}";
        }

        private async Task SeedLeaveRequestsAsync()
        {
            if (!await _context.LeaveRequests.AnyAsync())
            {
                var leaveRequests = new List<LeaveRequest>
                {
                    // Approved leave request (past)
                    new LeaveRequest
                    {
                        Id = 1,
                        EmployeeId = 2, // Alex Smith
                        LeaveType = LeaveType.Annual,
                        StartDate = DateTime.Today.AddDays(-20),
                        EndDate = DateTime.Today.AddDays(-18),
                        LeaveDaysRequested = 3,
                        Reason = "Family vacation to celebrate anniversary",
                        Status = LeaveStatus.Approved,
                        ApprovedByUserId = 1, // Manager
                        ApprovalNotes = "Approved - enjoy your time off!",
                        ApprovedAt = DateTime.UtcNow.AddDays(-25),
                        CreatedAt = DateTime.UtcNow.AddDays(-30)
                    },
                    // Approved leave request (upcoming)
                    new LeaveRequest
                    {
                        Id = 2,
                        EmployeeId = 5, // Lisa Taylor
                        LeaveType = LeaveType.Training,
                        StartDate = DateTime.Today.AddDays(10),
                        EndDate = DateTime.Today.AddDays(12),
                        LeaveDaysRequested = 3,
                        Reason = "Attending React Advanced Conference 2024",
                        Status = LeaveStatus.Approved,
                        ApprovedByUserId = 1, // Manager
                        ApprovalNotes = "Great opportunity for skill development. Approved.",
                        ApprovedAt = DateTime.UtcNow.AddDays(-5),
                        CreatedAt = DateTime.UtcNow.AddDays(-7)
                    },
                    // Pending leave request
                    new LeaveRequest
                    {
                        Id = 3,
                        EmployeeId = 3, // Emma Wilson
                        LeaveType = LeaveType.Annual,
                        StartDate = DateTime.Today.AddDays(25),
                        EndDate = DateTime.Today.AddDays(29),
                        LeaveDaysRequested = 5,
                        Reason = "Summer holiday trip to Europe",
                        Status = LeaveStatus.Pending,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    // Pending sick leave
                    new LeaveRequest
                    {
                        Id = 4,
                        EmployeeId = 6, // Mike Garcia
                        LeaveType = LeaveType.Sick,
                        StartDate = DateTime.Today.AddDays(1),
                        EndDate = DateTime.Today.AddDays(1),
                        LeaveDaysRequested = 1,
                        Reason = "Doctor appointment and recovery time",
                        Status = LeaveStatus.Pending,
                        CreatedAt = DateTime.UtcNow
                    },
                    // Half-day leave request (approved)
                    new LeaveRequest
                    {
                        Id = 5,
                        EmployeeId = 4, // David Brown
                        LeaveType = LeaveType.Annual,
                        StartDate = DateTime.Today.AddDays(7),
                        EndDate = DateTime.Today.AddDays(7),
                        IsStartDateAM = false, // PM only
                        IsEndDateAM = false,
                        LeaveDaysRequested = 0.5m,
                        Reason = "Personal appointment in the afternoon",
                        Status = LeaveStatus.Approved,
                        ApprovedByUserId = 1, // Manager
                        ApprovalNotes = "Half-day approved for afternoon appointment.",
                        ApprovedAt = DateTime.UtcNow.AddDays(-3),
                        CreatedAt = DateTime.UtcNow.AddDays(-5)
                    },
                    // Manager's own leave request (approved by another manager or admin)
                    new LeaveRequest
                    {
                        Id = 6,
                        EmployeeId = 1, // Sarah Johnson (Manager)
                        LeaveType = LeaveType.Annual,
                        StartDate = DateTime.Today.AddDays(35),
                        EndDate = DateTime.Today.AddDays(42),
                        LeaveDaysRequested = 6, // Excluding weekends
                        Reason = "Annual family vacation and rest period",
                        Status = LeaveStatus.Approved,
                        ApprovedByUserId = 1, // Self-approved (or another admin would approve)
                        ApprovalNotes = "Management coverage arranged with regional manager.",
                        ApprovedAt = DateTime.UtcNow.AddDays(-10),
                        CreatedAt = DateTime.UtcNow.AddDays(-15)
                    }
                };

                _context.LeaveRequests.AddRange(leaveRequests);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Leave requests seeded successfully");
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    // Extension method for easy registration
    public static class DatabaseSeederExtensions
    {
        public static IServiceCollection AddDatabaseSeeder(this IServiceCollection services)
        {
            services.AddScoped<DatabaseSeeder>();
            return services;
        }
    }
}