using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Core.Services
{
    /// <summary>
    /// Service interface for client management operations
    /// </summary>
    public interface IClientService
    {
        /// <summary>
        /// Creates a new client
        /// </summary>
        /// <param name="request">The client creation request</param>
        /// <param name="createdByUserId">ID of the user creating the client</param>
        /// <returns>The created client DTO</returns>
        Task<ClientDto?> CreateClientAsync(CreateClientRequestDto request, int createdByUserId);

        /// <summary>
        /// Updates an existing client
        /// </summary>
        /// <param name="clientId">ID of the client to update</param>
        /// <param name="request">The client update request</param>
        /// <param name="updatedByUserId">ID of the user updating the client</param>
        /// <returns>The updated client DTO</returns>
        Task<ClientDto?> UpdateClientAsync(int clientId, UpdateClientRequestDto request, int updatedByUserId);

        /// <summary>
        /// Soft deletes a client by setting IsActive to false
        /// </summary>
        /// <param name="clientId">ID of the client to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the client</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteClientAsync(int clientId, int deletedByUserId);

        /// <summary>
        /// Gets a client by ID
        /// </summary>
        /// <param name="clientId">ID of the client to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the client</param>
        /// <returns>The client DTO if found</returns>
        Task<ClientDto?> GetClientByIdAsync(int clientId, int requestingUserId);

        /// <summary>
        /// Gets a paginated list of clients with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the clients</param>
        /// <returns>Paginated client list response</returns>
        Task<ClientListResponseDto> GetClientsAsync(ClientQueryDto query, int requestingUserId);

        /// <summary>
        /// Toggles the active status of a client
        /// </summary>
        /// <param name="clientId">ID of the client to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        Task<bool> ToggleClientStatusAsync(int clientId, bool isActive, int updatedByUserId);

        /// <summary>
        /// Gets all active clients for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the clients</param>
        /// <returns>List of active client DTOs</returns>
        Task<List<ClientDto>> GetActiveClientsAsync(int requestingUserId);

        /// <summary>
        /// Checks if a client code is already in use
        /// </summary>
        /// <param name="code">The client code to check</param>
        /// <param name="excludeClientId">Optional client ID to exclude from the check (for updates)</param>
        /// <returns>True if the code is already in use</returns>
        Task<bool> IsClientCodeExistsAsync(string code, int? excludeClientId = null);
    }
}