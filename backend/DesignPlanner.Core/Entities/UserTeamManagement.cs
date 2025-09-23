using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DesignPlanner.Core.Entities
{
    /// <summary>
    /// Junction entity for many-to-many relationship between Users (managers) and Teams
    /// Allows multiple managers to manage multiple teams
    /// </summary>
    public class UserTeamManagement
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int TeamId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("TeamId")]
        public virtual Team Team { get; set; } = null!;
    }
}