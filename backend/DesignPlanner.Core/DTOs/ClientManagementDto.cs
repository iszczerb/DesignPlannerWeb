using System.ComponentModel.DataAnnotations;

namespace DesignPlanner.Core.DTOs
{
    /// <summary>
    /// Data transfer object for creating a new client
    /// </summary>
    public class CreateClientDto
    {
        /// <summary>
        /// Client code (e.g., AWS, MSFT, GOOGLE)
        /// </summary>
        [Required(ErrorMessage = "Client code is required")]
        [StringLength(10, MinimumLength = 2, ErrorMessage = "Client code must be between 2 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Client name
        /// </summary>
        [Required(ErrorMessage = "Client name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Client name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Client description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Contact email address
        /// </summary>
        [StringLength(255, ErrorMessage = "Contact email cannot exceed 255 characters")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address")]
        public string? ContactEmail { get; set; }

        /// <summary>
        /// Contact phone number
        /// </summary>
        [StringLength(20, ErrorMessage = "Contact phone cannot exceed 20 characters")]
        public string? ContactPhone { get; set; }

        /// <summary>
        /// Client address
        /// </summary>
        [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
        public string? Address { get; set; }

        /// <summary>
        /// Client color for visual identification
        /// </summary>
        [Required(ErrorMessage = "Client color is required")]
        [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code (e.g., #0066CC)")]
        public string Color { get; set; } = "#0066CC";
    }

    /// <summary>
    /// Data transfer object for updating an existing client
    /// </summary>
    public class UpdateClientDto
    {
        /// <summary>
        /// Client ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Client code (e.g., AWS, MSFT, GOOGLE)
        /// </summary>
        [Required(ErrorMessage = "Client code is required")]
        [StringLength(10, MinimumLength = 2, ErrorMessage = "Client code must be between 2 and 10 characters")]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Client name
        /// </summary>
        [Required(ErrorMessage = "Client name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Client name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Client description
        /// </summary>
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        /// <summary>
        /// Contact email address
        /// </summary>
        [StringLength(255, ErrorMessage = "Contact email cannot exceed 255 characters")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address")]
        public string? ContactEmail { get; set; }

        /// <summary>
        /// Contact phone number
        /// </summary>
        [StringLength(20, ErrorMessage = "Contact phone cannot exceed 20 characters")]
        public string? ContactPhone { get; set; }

        /// <summary>
        /// Client address
        /// </summary>
        [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
        public string? Address { get; set; }

        /// <summary>
        /// Whether the client is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Client color for visual identification
        /// </summary>
        [Required(ErrorMessage = "Client color is required")]
        [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a valid hex color code (e.g., #0066CC)")]
        public string Color { get; set; } = "#0066CC";
    }

    /// <summary>
    /// Data transfer object for client list response
    /// </summary>
    public class ClientListResponseDto
    {
        /// <summary>
        /// List of clients
        /// </summary>
        public List<ClientDto> Clients { get; set; } = new();

        /// <summary>
        /// Total number of clients
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Current page number
        /// </summary>
        public int PageNumber { get; set; }

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Data transfer object for client query parameters
    /// </summary>
    public class ClientQueryDto
    {
        /// <summary>
        /// Page number for pagination
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Search term for filtering clients
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// Field to sort by
        /// </summary>
        public string SortBy { get; set; } = "Name";

        /// <summary>
        /// Sort direction (asc or desc)
        /// </summary>
        public string SortDirection { get; set; } = "asc";
    }

    /// <summary>
    /// Request DTO for creating a client (alias for CreateClientDto)
    /// </summary>
    public class CreateClientRequestDto : CreateClientDto
    {
    }

    /// <summary>
    /// Request DTO for updating a client (alias for UpdateClientDto)
    /// </summary>
    public class UpdateClientRequestDto : UpdateClientDto
    {
    }
}