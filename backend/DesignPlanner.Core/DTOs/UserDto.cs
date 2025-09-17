using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        
        // Employee information if applicable
        public EmployeeDto? Employee { get; set; }
    }
    
    public class EmployeeDto
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        public TeamDto? Team { get; set; }
    }
}