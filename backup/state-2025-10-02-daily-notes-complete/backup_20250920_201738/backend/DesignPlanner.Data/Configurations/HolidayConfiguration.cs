using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DesignPlanner.Core.Entities;

namespace DesignPlanner.Data.Configurations
{
    public class HolidayConfiguration : IEntityTypeConfiguration<Holiday>
    {
        public void Configure(EntityTypeBuilder<Holiday> builder)
        {
            builder.ToTable("Holidays");

            builder.HasKey(h => h.Id);

            builder.Property(h => h.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(h => h.Date)
                .IsRequired();

            builder.Property(h => h.Type)
                .IsRequired();

            builder.Property(h => h.Description)
                .HasMaxLength(200);

            builder.Property(h => h.IsActive)
                .HasDefaultValue(true);

            builder.HasIndex(h => h.Date)
                .HasDatabaseName("IX_Holidays_Date");
        }
    }
}