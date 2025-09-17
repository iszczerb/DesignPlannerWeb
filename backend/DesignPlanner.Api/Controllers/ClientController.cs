using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing clients
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly ILogger<ClientController> _logger;

        public ClientController(IClientService clientService, ILogger<ClientController> logger)
        {
            _clientService = clientService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the current user ID from JWT token
        /// </summary>
        /// <returns>User ID or 0 if not found</returns>
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        /// <summary>
        /// Get all clients
        /// </summary>
        /// <returns>List of clients</returns>
        [HttpGet]
        public async Task<ActionResult<ClientListResponseDto>> GetClients([FromQuery] ClientQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new ClientQueryDto();
                var clients = await _clientService.GetClientsAsync(query, userId);
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving clients");
                return StatusCode(500, "An error occurred while retrieving clients");
            }
        }

        /// <summary>
        /// Get a specific client by ID
        /// </summary>
        /// <param name="id">Client ID</param>
        /// <returns>Client details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<ClientDto>> GetClient(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var client = await _clientService.GetClientByIdAsync(id, userId);
                if (client == null)
                {
                    return NotFound("Client not found");
                }

                return Ok(client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving client {ClientId}", id);
                return StatusCode(500, "An error occurred while retrieving the client");
            }
        }

        /// <summary>
        /// Create a new client
        /// </summary>
        /// <param name="createDto">Client creation data</param>
        /// <returns>Created client</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ClientDto>> CreateClient([FromBody] CreateClientRequestDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var client = await _clientService.CreateClientAsync(createDto, userId);
                return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating client");
                return StatusCode(500, "An error occurred while creating the client");
            }
        }

        /// <summary>
        /// Update an existing client
        /// </summary>
        /// <param name="id">Client ID</param>
        /// <param name="updateDto">Client update data</param>
        /// <returns>Updated client</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ClientDto>> UpdateClient(int id, [FromBody] UpdateClientRequestDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var client = await _clientService.UpdateClientAsync(id, updateDto, userId);
                return Ok(client);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating client {ClientId}", id);
                return StatusCode(500, "An error occurred while updating the client");
            }
        }

        /// <summary>
        /// Delete a client
        /// </summary>
        /// <param name="id">Client ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteClient(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _clientService.DeleteClientAsync(id, userId);
                if (!result)
                {
                    return NotFound("Client not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting client {ClientId}", id);
                return StatusCode(500, "An error occurred while deleting the client");
            }
        }

        /// <summary>
        /// Get clients with active projects
        /// </summary>
        /// <returns>List of clients with active projects</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<ClientDto>>> GetActiveClients()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var clients = await _clientService.GetActiveClientsAsync(userId);
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active clients");
                return StatusCode(500, "An error occurred while retrieving active clients");
            }
        }

        /// <summary>
        /// Search clients by name or code
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching clients</returns>
        [HttpGet("search")]
        public async Task<ActionResult<List<ClientDto>>> SearchClients([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest("Search term is required");
                }

                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var query = new ClientQueryDto { SearchTerm = searchTerm };
                var result = await _clientService.GetClientsAsync(query, userId);
                var clients = result.Clients;
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching clients with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching clients");
            }
        }
    }
}