using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// DTO for client entity
    /// </summary>
    public class ClientDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ProjectCount { get; set; }
    }
}