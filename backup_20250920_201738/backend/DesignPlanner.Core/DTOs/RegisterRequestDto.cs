using System.ComponentModel.DataAnnotations;
using DesignPlanner.Core.Enums;

namespace DesignPlanner.Core.DTOs
{
    public class RegisterRequestDto
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

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.TeamMember;

        // Optional employee fields
        public int? TeamId { get; set; }
        public string? EmployeeId { get; set; }
        public string? Position { get; set; }
        public string? PhoneNumber { get; set; }
    }
}