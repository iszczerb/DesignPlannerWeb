using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using DesignPlanner.Data.Context;
using DesignPlanner.Core.DTOs;

namespace DesignPlanner.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(ApplicationDbContext context, ILogger<ProjectController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("clients")]
        public async Task<ActionResult<IEnumerable<ClientDto>>> GetClients()
        {
            try
            {
                var clients = await _context.Clients
                    .Where(c => c.IsActive)
                    .Select(c => new ClientDto
                    {
                        Id = c.Id,
                        Code = c.Code,
                        Name = c.Name
                    })
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching clients");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("clients/{clientId}/projects")]
        public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjectsByClient(int clientId)
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => p.IsActive && p.ClientId == clientId)
                    .Include(p => p.Client)
                    .Select(p => new ProjectDto
                    {
                        Id = p.Id,
                        Code = p.Code,
                        Name = p.Name,
                        ClientName = p.Client.Name,
                        ClientId = p.ClientId
                    })
                    .OrderBy(p => p.Code)
                    .ToListAsync();

                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching projects for client {ClientId}", clientId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("task-types")]
        public async Task<ActionResult<IEnumerable<TaskTypeDto>>> GetTaskTypes()
        {
            try
            {
                var taskTypes = await _context.TaskTypes
                    .Where(tt => tt.IsActive)
                    .Select(tt => new TaskTypeDto
                    {
                        Id = tt.Id,
                        Name = tt.Name
                    })
                    .OrderBy(tt => tt.Name)
                    .ToListAsync();

                return Ok(taskTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching task types");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{projectId}/tasks")]
        public async Task<ActionResult<IEnumerable<ProjectTaskDto>>> GetProjectTasks(int projectId)
        {
            try
            {
                var tasks = await _context.ProjectTasks
                    .Where(pt => pt.ProjectId == projectId && pt.IsActive)
                    .Include(pt => pt.TaskType)
                    .Select(pt => new ProjectTaskDto
                    {
                        Id = pt.Id,
                        Title = pt.Title,
                        TaskTypeId = pt.TaskTypeId,
                        TaskTypeName = pt.TaskType.Name,
                        Priority = pt.Priority,
                        Status = pt.Status
                    })
                    .OrderBy(pt => pt.Title)
                    .ToListAsync();

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching project tasks for project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}