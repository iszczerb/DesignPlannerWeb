using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasIndex(e => e.Username).IsUnique();
            builder.Property(e => e.Role).HasConversion<int>();
        }
    }

    public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.HasIndex(e => e.EmployeeId).IsUnique();
            builder.HasIndex(e => e.UserId).IsUnique();
            
            // One-to-one relationship between User and Employee
            builder.HasOne(e => e.User)
                .WithOne(u => u.Employee)
                .HasForeignKey<Employee>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Many-to-one relationship between Employee and Team
            builder.HasOne(e => e.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class TeamConfiguration : IEntityTypeConfiguration<Team>
    {
        public void Configure(EntityTypeBuilder<Team> builder)
        {
            builder.HasIndex(e => e.Code).IsUnique();
            builder.HasIndex(e => e.Name).IsUnique();
        }
    }

    public class ClientConfiguration : IEntityTypeConfiguration<Client>
    {
        public void Configure(EntityTypeBuilder<Client> builder)
        {
            builder.HasIndex(e => e.Code).IsUnique();
            builder.HasIndex(e => e.Name).IsUnique();
        }
    }

    public class ProjectConfiguration : IEntityTypeConfiguration<Project>
    {
        public void Configure(EntityTypeBuilder<Project> builder)
        {
            builder.HasIndex(e => e.Code).IsUnique();
            builder.Property(e => e.Status).HasConversion<int>();
            
            builder.HasOne(p => p.Client)
                .WithMany(c => c.Projects)
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class TaskTypeConfiguration : IEntityTypeConfiguration<TaskType>
    {
        public void Configure(EntityTypeBuilder<TaskType> builder)
        {
            builder.HasIndex(e => e.Name).IsUnique();
        }
    }

    public class TaskConfiguration : IEntityTypeConfiguration<ProjectTask>
    {
        public void Configure(EntityTypeBuilder<ProjectTask> builder)
        {
            builder.Property(e => e.Status).HasConversion<int>();
            builder.Property(e => e.Priority).HasConversion<int>();

            builder.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.TaskType)
                .WithMany(tt => tt.Tasks)
                .HasForeignKey(t => t.TaskTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Index for performance
            builder.HasIndex(t => new { t.ProjectId, t.Status });
        }
    }

    public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
    {
        public void Configure(EntityTypeBuilder<Assignment> builder)
        {
            builder.Property(e => e.Slot).HasConversion<int>();
            
            builder.HasOne(a => a.Task)
                .WithMany(t => t.Assignments)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.Employee)
                .WithMany(e => e.Assignments)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Composite index for performance (removed IsUnique to allow multiple tasks per slot)
            builder.HasIndex(a => new { a.EmployeeId, a.AssignedDate, a.Slot });
            builder.HasIndex(a => new { a.AssignedDate, a.Slot });
        }
    }

    public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
    {
        public void Configure(EntityTypeBuilder<LeaveRequest> builder)
        {
            builder.Property(e => e.LeaveType).HasConversion<int>();
            builder.Property(e => e.Status).HasConversion<int>();

            builder.HasOne(lr => lr.Employee)
                .WithMany(e => e.LeaveRequests)
                .HasForeignKey(lr => lr.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(lr => lr.ApprovedByUser)
                .WithMany()
                .HasForeignKey(lr => lr.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Index for performance
            builder.HasIndex(lr => new { lr.EmployeeId, lr.Status });
            builder.HasIndex(lr => new { lr.StartDate, lr.EndDate });
        }
    }

    public class SkillConfiguration : IEntityTypeConfiguration<Skill>
    {
        public void Configure(EntityTypeBuilder<Skill> builder)
        {
            builder.HasIndex(e => e.Name).IsUnique();
        }
    }

    public class EmployeeSkillConfiguration : IEntityTypeConfiguration<EmployeeSkill>
    {
        public void Configure(EntityTypeBuilder<EmployeeSkill> builder)
        {
            builder.HasOne(es => es.Employee)
                .WithMany(e => e.Skills)
                .HasForeignKey(es => es.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(es => es.Skill)
                .WithMany(s => s.EmployeeSkills)
                .HasForeignKey(es => es.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint to prevent duplicate skills for the same employee
            builder.HasIndex(es => new { es.EmployeeId, es.SkillId }).IsUnique();
        }
    }

    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.HasIndex(e => e.Name).IsUnique();

            // Configure relationship with Projects
            builder.HasMany(c => c.Projects)
                .WithOne(p => p.Category)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}