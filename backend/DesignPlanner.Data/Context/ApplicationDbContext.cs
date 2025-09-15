using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;
using DesignPlanner.Core.Interfaces;
using DesignPlanner.Data.Configurations;

namespace DesignPlanner.Data.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<TaskType> TaskTypes { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<Leave> Leaves { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<EmployeeSkill> EmployeeSkills { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply all configurations
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new EmployeeConfiguration());
            modelBuilder.ApplyConfiguration(new TeamConfiguration());
            modelBuilder.ApplyConfiguration(new ClientConfiguration());
            modelBuilder.ApplyConfiguration(new ProjectConfiguration());
            modelBuilder.ApplyConfiguration(new TaskTypeConfiguration());
            modelBuilder.ApplyConfiguration(new TaskConfiguration());
            modelBuilder.ApplyConfiguration(new AssignmentConfiguration());
            modelBuilder.ApplyConfiguration(new LeaveRequestConfiguration());
            modelBuilder.ApplyConfiguration(new LeaveConfiguration());
            modelBuilder.ApplyConfiguration(new HolidayConfiguration());
            modelBuilder.ApplyConfiguration(new SkillConfiguration());
            modelBuilder.ApplyConfiguration(new EmployeeSkillConfiguration());
            modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());

            // Seed data for default clients
            var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Client>().HasData(
                new Client { Id = 1, Code = "AWS", Name = "Amazon Web Services", IsActive = true, CreatedAt = seedDate },
                new Client { Id = 2, Code = "MSFT", Name = "Microsoft", IsActive = true, CreatedAt = seedDate },
                new Client { Id = 3, Code = "GOOGLE", Name = "Google", IsActive = true, CreatedAt = seedDate },
                new Client { Id = 4, Code = "EQX", Name = "Equinix", IsActive = true, CreatedAt = seedDate },
                new Client { Id = 5, Code = "TATE", Name = "Tate", IsActive = true, CreatedAt = seedDate }
            );

            // Seed data for default task types
            modelBuilder.Entity<TaskType>().HasData(
                new TaskType { Id = 1, Name = "Design", Description = "UI/UX Design tasks", Color = "#FF6B6B", IsActive = true, CreatedAt = seedDate },
                new TaskType { Id = 2, Name = "Development", Description = "Software development tasks", Color = "#4ECDC4", IsActive = true, CreatedAt = seedDate },
                new TaskType { Id = 3, Name = "Testing", Description = "Quality assurance and testing", Color = "#45B7D1", IsActive = true, CreatedAt = seedDate },
                new TaskType { Id = 4, Name = "Research", Description = "Research and analysis tasks", Color = "#96CEB4", IsActive = true, CreatedAt = seedDate },
                new TaskType { Id = 5, Name = "Planning", Description = "Project planning and management", Color = "#FECA57", IsActive = true, CreatedAt = seedDate },
                new TaskType { Id = 6, Name = "Review", Description = "Code review and documentation", Color = "#FF9FF3", IsActive = true, CreatedAt = seedDate }
            );

            // Seed data for default skills
            modelBuilder.Entity<Skill>().HasData(
                new Skill { Id = 1, Name = "C#", Category = "Technical", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 2, Name = "JavaScript", Category = "Technical", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 3, Name = "React", Category = "Technical", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 4, Name = "UI/UX Design", Category = "Design", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 5, Name = "Project Management", Category = "Management", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 6, Name = "Database Design", Category = "Technical", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 7, Name = "API Development", Category = "Technical", IsActive = true, CreatedAt = seedDate },
                new Skill { Id = 8, Name = "Testing", Category = "Technical", IsActive = true, CreatedAt = seedDate }
            );
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entities = ChangeTracker.Entries()
                .Where(x => x.Entity is ITimestampEntity && (x.State == EntityState.Added || x.State == EntityState.Modified));

            foreach (var entity in entities)
            {
                var now = DateTime.UtcNow;

                if (entity.State == EntityState.Added)
                {
                    ((ITimestampEntity)entity.Entity).CreatedAt = now;
                }

                ((ITimestampEntity)entity.Entity).UpdatedAt = now;
            }
        }
    }

}