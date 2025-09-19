using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for client management operations
    /// </summary>
    public class ClientService : IClientService
    {
        private readonly ApplicationDbContext _context;

        public ClientService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new client
        /// </summary>
        /// <param name="request">The client creation request</param>
        /// <param name="createdByUserId">ID of the user creating the client</param>
        /// <returns>The created client DTO</returns>
        public async Task<ClientDto?> CreateClientAsync(CreateClientRequestDto request, int createdByUserId)
        {
            // Check if client code already exists
            if (await IsClientCodeExistsAsync(request.Code))
            {
                throw new ArgumentException($"Client code '{request.Code}' is already in use");
            }

            var client = new Client
            {
                Code = request.Code.ToUpper(),
                Name = request.Name,
                Description = request.Description,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
                Color = request.Color,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return MapToClientDto(client);
        }

        /// <summary>
        /// Updates an existing client
        /// </summary>
        /// <param name="clientId">ID of the client to update</param>
        /// <param name="request">The client update request</param>
        /// <param name="updatedByUserId">ID of the user updating the client</param>
        /// <returns>The updated client DTO</returns>
        public async Task<ClientDto?> UpdateClientAsync(int clientId, UpdateClientRequestDto request, int updatedByUserId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client == null)
                throw new ArgumentException("Client not found");

            // Check if client code already exists (excluding current client)
            if (await IsClientCodeExistsAsync(request.Code, clientId))
            {
                throw new ArgumentException($"Client code '{request.Code}' is already in use");
            }

            client.Code = request.Code.ToUpper();
            client.Name = request.Name;
            client.Description = request.Description;
            client.ContactEmail = request.ContactEmail;
            client.ContactPhone = request.ContactPhone;
            client.Address = request.Address;
            client.Color = request.Color;

            await _context.SaveChangesAsync();

            return MapToClientDto(client);
        }

        /// <summary>
        /// Hard deletes a client from the database
        /// </summary>
        /// <param name="clientId">ID of the client to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the client</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteClientAsync(int clientId, int deletedByUserId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client == null)
                return false;

            // Check if client has projects
            var hasProjects = await _context.Projects
                .AnyAsync(p => p.ClientId == clientId);

            if (hasProjects)
                throw new InvalidOperationException("Cannot delete client with projects. Please delete or reassign projects first.");

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a client by ID
        /// </summary>
        /// <param name="clientId">ID of the client to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the client</param>
        /// <returns>The client DTO if found</returns>
        public async Task<ClientDto?> GetClientByIdAsync(int clientId, int requestingUserId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            return client != null ? MapToClientDto(client) : null;
        }

        /// <summary>
        /// Gets a paginated list of clients with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the clients</param>
        /// <returns>Paginated client list response</returns>
        public async Task<ClientListResponseDto> GetClientsAsync(ClientQueryDto query, int requestingUserId)
        {
            var queryable = _context.Clients.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(c =>
                    c.Name.ToLower().Contains(searchTerm) ||
                    c.Code.ToLower().Contains(searchTerm) ||
                    (c.Description != null && c.Description.ToLower().Contains(searchTerm)));
            }


            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "code" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(c => c.Code)
                    : queryable.OrderBy(c => c.Code),
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(c => c.Name)
                    : queryable.OrderBy(c => c.Name),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(c => c.CreatedAt)
                    : queryable.OrderBy(c => c.CreatedAt),
                _ => queryable.OrderBy(c => c.Name)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var clients = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(c => MapToClientDto(c))
                .ToListAsync();

            return new ClientListResponseDto
            {
                Clients = clients,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Toggles the active status of a client
        /// </summary>
        /// <param name="clientId">ID of the client to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        public async Task<bool> ToggleClientStatusAsync(int clientId, bool isActive, int updatedByUserId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client == null)
                return false;

            // If deactivating, check for active projects
            if (!isActive && client.IsActive)
            {
                var hasProjects = await _context.Projects
                    .AnyAsync(p => p.ClientId == clientId);

                if (hasProjects)
                    throw new InvalidOperationException("Cannot deactivate client with existing projects. Please reassign projects first.");
            }

            client.IsActive = isActive;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets all active clients for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the clients</param>
        /// <returns>List of active client DTOs</returns>
        public async Task<List<ClientDto>> GetActiveClientsAsync(int requestingUserId)
        {
            var clients = await _context.Clients
                .OrderBy(c => c.Name)
                .Select(c => MapToClientDto(c))
                .ToListAsync();

            return clients;
        }

        /// <summary>
        /// Checks if a client code is already in use
        /// </summary>
        /// <param name="code">The client code to check</param>
        /// <param name="excludeClientId">Optional client ID to exclude from the check (for updates)</param>
        /// <returns>True if the code is already in use</returns>
        public async Task<bool> IsClientCodeExistsAsync(string code, int? excludeClientId = null)
        {
            var query = _context.Clients.Where(c => c.Code.ToLower() == code.ToLower());

            if (excludeClientId.HasValue)
            {
                query = query.Where(c => c.Id != excludeClientId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Maps a Client entity to ClientDto
        /// </summary>
        /// <param name="client">The client entity</param>
        /// <returns>The client DTO</returns>
        private static ClientDto MapToClientDto(Client client)
        {
            return new ClientDto
            {
                Id = client.Id,
                Code = client.Code,
                Name = client.Name,
                Description = client.Description,
                ContactEmail = client.ContactEmail,
                ContactPhone = client.ContactPhone,
                Address = client.Address,
                Color = client.Color,
                IsActive = client.IsActive,
                CreatedAt = client.CreatedAt
            };
        }
    }
}