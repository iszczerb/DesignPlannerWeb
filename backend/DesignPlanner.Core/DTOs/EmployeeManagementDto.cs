using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class CreateEmployeeRequestDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.TeamMember;

        // Employee fields
        public int? TeamId { get; set; }
        
        [StringLength(50, ErrorMessage = "Employee ID cannot exceed 50 characters")]
        public string? EmployeeId { get; set; }
        
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string? Position { get; set; }
        
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }
        
        public DateTime? HireDate { get; set; }
    }

    public class UpdateEmployeeRequestDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        // Employee fields
        public int? TeamId { get; set; }
        
        [StringLength(50, ErrorMessage = "Employee ID cannot exceed 50 characters")]
        public string? EmployeeId { get; set; }
        
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string? Position { get; set; }
        
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }
        
        public DateTime? HireDate { get; set; }
        
        public bool IsActive { get; set; } = true;
    }

    public class EmployeeListResponseDto
    {
        public List<EmployeeListItemDto> Employees { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class EmployeeListItemDto
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
        
        // Employee information
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? HireDate { get; set; }
        public string? TeamName { get; set; }
    }

    public class EmployeeQueryDto
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public UserRole? Role { get; set; }
        public int? TeamId { get; set; }
        public bool? IsActive { get; set; }
        public string SortBy { get; set; } = "LastName";
        public string SortDirection { get; set; } = "asc";
    }

    public class ResetPasswordRequestDto
    {
        [Required(ErrorMessage = "New password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }
}