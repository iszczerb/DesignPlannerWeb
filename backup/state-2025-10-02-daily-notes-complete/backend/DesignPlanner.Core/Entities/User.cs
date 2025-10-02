using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;


        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        // Managed teams for Manager/Admin roles (comma-separated team IDs) - LEGACY: Will be removed after migration
        [MaxLength(500)]
        public string? ManagedTeamIds { get; set; }

        // Navigation properties
        public Employee? Employee { get; set; }

        /// <summary>
        /// Many-to-many relationship: Teams this user manages (for Manager/Admin roles)
        /// </summary>
        public virtual ICollection<UserTeamManagement> ManagedTeams { get; set; } = new List<UserTeamManagement>();
    }
}