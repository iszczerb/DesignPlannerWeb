using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DesignPlanner.Core.Entities;

namespace DesignPlanner.Data.Configurations
{
    public class LeaveConfiguration : IEntityTypeConfiguration<Leave>
    {
        public void Configure(EntityTypeBuilder<Leave> builder)
        {
            builder.ToTable("Leaves");

            builder.HasKey(l => l.Id);

            builder.Property(l => l.Date)
                .IsRequired();

            builder.Property(l => l.Type)
                .IsRequired();

            builder.Property(l => l.Duration)
                .IsRequired();

            builder.Property(l => l.Notes)
                .HasMaxLength(200);

            builder.Property(l => l.IsActive)
                .HasDefaultValue(true);

            builder.HasOne(l => l.Employee)
                .WithMany()
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(l => new { l.EmployeeId, l.Date })
                .HasDatabaseName("IX_Leaves_EmployeeId_Date");
        }
    }
}