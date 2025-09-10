using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DesignPlanner.Core.Entities;

namespace DesignPlanner.Data.Configurations
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.HasKey(rt => rt.Id);

            builder.Property(rt => rt.Token)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(rt => rt.UserId)
                .IsRequired();

            builder.Property(rt => rt.ExpiresAt)
                .IsRequired();

            builder.Property(rt => rt.IsRevoked)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(rt => rt.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(rt => rt.DeviceInfo)
                .HasMaxLength(500);

            // Relationships
            builder.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(rt => rt.Token)
                .IsUnique();

            builder.HasIndex(rt => rt.UserId);

            builder.HasIndex(rt => rt.ExpiresAt);
        }
    }
}