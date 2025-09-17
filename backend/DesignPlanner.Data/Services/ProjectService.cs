using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for project management operations
    /// </summary>
    public class ProjectService : IProjectService
    {
        private readonly ApplicationDbContext _context;

        public ProjectService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new project
        /// </summary>
        /// <param name="request">The project creation request</param>
        /// <param name="createdByUserId">ID of the user creating the project</param>
        /// <returns>The created project DTO</returns>
        public async Task<ProjectResponseDto?> CreateProjectAsync(CreateProjectRequestDto request, int createdByUserId)
        {
            // Check if project code already exists
            if (await IsProjectCodeExistsAsync(request.Code))
            {
                throw new ArgumentException($"Project code '{request.Code}' is already in use");
            }

            // Verify client exists and is active
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId);
            if (client == null)
                throw new ArgumentException("Client not found");
            if (!client.IsActive)
                throw new ArgumentException("Cannot create project for inactive client");

            // Validate dates
            if (request.EndDate.HasValue && request.EndDate < request.StartDate)
                throw new ArgumentException("End date cannot be before start date");
            if (request.DeadlineDate.HasValue && request.DeadlineDate < request.StartDate)
                throw new ArgumentException("Deadline date cannot be before start date");

            var project = new Project
            {
                ClientId = request.ClientId,
                Code = request.Code.ToUpper(),
                Name = request.Name,
                Description = request.Description,
                Status = request.Status,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DeadlineDate = request.DeadlineDate,
                Budget = request.Budget,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Reload with client data
            project = await _context.Projects
                .Include(p => p.Client)
                .FirstAsync(p => p.Id == project.Id);

            return MapToProjectResponseDto(project);
        }

        /// <summary>
        /// Updates an existing project
        /// </summary>
        /// <param name="projectId">ID of the project to update</param>
        /// <param name="request">The project update request</param>
        /// <param name="updatedByUserId">ID of the user updating the project</param>
        /// <returns>The updated project DTO</returns>
        public async Task<ProjectResponseDto?> UpdateProjectAsync(int projectId, UpdateProjectRequestDto request, int updatedByUserId)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new ArgumentException("Project not found");

            // Check if project code already exists (excluding current project)
            if (await IsProjectCodeExistsAsync(request.Code, projectId))
            {
                throw new ArgumentException($"Project code '{request.Code}' is already in use");
            }

            // Verify client exists and is active
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId);
            if (client == null)
                throw new ArgumentException("Client not found");
            if (!client.IsActive)
                throw new ArgumentException("Cannot assign project to inactive client");

            // Validate dates
            if (request.EndDate.HasValue && request.EndDate < request.StartDate)
                throw new ArgumentException("End date cannot be before start date");
            if (request.DeadlineDate.HasValue && request.DeadlineDate < request.StartDate)
                throw new ArgumentException("Deadline date cannot be before start date");

            project.ClientId = request.ClientId;
            project.Code = request.Code.ToUpper();
            project.Name = request.Name;
            project.Description = request.Description;
            project.Status = request.Status;
            project.StartDate = request.StartDate;
            project.EndDate = request.EndDate;
            project.DeadlineDate = request.DeadlineDate;
            project.Budget = request.Budget;
            project.IsActive = request.IsActive;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload with updated client data if changed
            if (project.Client.Id != request.ClientId)
            {
                project = await _context.Projects
                    .Include(p => p.Client)
                    .FirstAsync(p => p.Id == projectId);
            }

            return MapToProjectResponseDto(project);
        }

        /// <summary>
        /// Soft deletes a project by setting IsActive to false
        /// </summary>
        /// <param name="projectId">ID of the project to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the project</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteProjectAsync(int projectId, int deletedByUserId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null)
                return false;

            // Check if project has active tasks
            var hasActiveTasks = await _context.ProjectTasks
                .AnyAsync(t => t.ProjectId == projectId && t.IsActive);

            if (hasActiveTasks)
                throw new InvalidOperationException("Cannot delete project with active tasks. Please complete or deactivate tasks first.");

            project.IsActive = false;
            project.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a project by ID
        /// </summary>
        /// <param name="projectId">ID of the project to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the project</param>
        /// <returns>The project DTO if found</returns>
        public async Task<ProjectResponseDto?> GetProjectByIdAsync(int projectId, int requestingUserId)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            return project != null ? MapToProjectResponseDto(project) : null;
        }

        /// <summary>
        /// Gets a paginated list of projects with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <returns>Paginated project list response</returns>
        public async Task<ProjectListResponseDto> GetProjectsAsync(ProjectQueryDto query, int requestingUserId)
        {
            var queryable = _context.Projects
                .Include(p => p.Client)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Code.ToLower().Contains(searchTerm) ||
                    (p.Description != null && p.Description.ToLower().Contains(searchTerm)) ||
                    p.Client.Name.ToLower().Contains(searchTerm));
            }

            if (query.ClientId.HasValue)
            {
                queryable = queryable.Where(p => p.ClientId == query.ClientId.Value);
            }

            if (query.Status.HasValue)
            {
                queryable = queryable.Where(p => p.Status == query.Status.Value);
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(p => p.IsActive == query.IsActive.Value);
            }

            if (query.StartDateFrom.HasValue)
            {
                queryable = queryable.Where(p => p.StartDate >= query.StartDateFrom.Value);
            }

            if (query.StartDateTo.HasValue)
            {
                queryable = queryable.Where(p => p.StartDate <= query.StartDateTo.Value);
            }

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "code" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.Code)
                    : queryable.OrderBy(p => p.Code),
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.Name)
                    : queryable.OrderBy(p => p.Name),
                "client" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.Client.Name)
                    : queryable.OrderBy(p => p.Client.Name),
                "status" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.Status)
                    : queryable.OrderBy(p => p.Status),
                "startdate" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.StartDate)
                    : queryable.OrderBy(p => p.StartDate),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(p => p.CreatedAt)
                    : queryable.OrderBy(p => p.CreatedAt),
                _ => queryable.OrderBy(p => p.Name)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var projects = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(p => MapToProjectResponseDto(p))
                .ToListAsync();

            return new ProjectListResponseDto
            {
                Projects = projects,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Toggles the active status of a project
        /// </summary>
        /// <param name="projectId">ID of the project to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        public async Task<bool> ToggleProjectStatusAsync(int projectId, bool isActive, int updatedByUserId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null)
                return false;

            // If deactivating, check for active tasks
            if (!isActive && project.IsActive)
            {
                var hasActiveTasks = await _context.ProjectTasks
                    .AnyAsync(t => t.ProjectId == projectId && t.IsActive);

                if (hasActiveTasks)
                    throw new InvalidOperationException("Cannot deactivate project with active tasks. Please complete or deactivate tasks first.");
            }

            project.IsActive = isActive;
            project.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets all active projects for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <returns>List of active project DTOs</returns>
        public async Task<List<ProjectResponseDto>> GetActiveProjectsAsync(int requestingUserId)
        {
            var projects = await _context.Projects
                .Include(p => p.Client)
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .Select(p => MapToProjectResponseDto(p))
                .ToListAsync();

            return projects;
        }

        /// <summary>
        /// Gets projects by client ID
        /// </summary>
        /// <param name="clientId">ID of the client</param>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <param name="includeInactive">Whether to include inactive projects</param>
        /// <returns>List of project DTOs for the specified client</returns>
        public async Task<List<ProjectResponseDto>> GetProjectsByClientAsync(int clientId, int requestingUserId, bool includeInactive = false)
        {
            var queryable = _context.Projects
                .Include(p => p.Client)
                .Where(p => p.ClientId == clientId);

            if (!includeInactive)
            {
                queryable = queryable.Where(p => p.IsActive);
            }

            var projects = await queryable
                .OrderBy(p => p.Name)
                .Select(p => MapToProjectResponseDto(p))
                .ToListAsync();

            return projects;
        }

        /// <summary>
        /// Checks if a project code is already in use
        /// </summary>
        /// <param name="code">The project code to check</param>
        /// <param name="excludeProjectId">Optional project ID to exclude from the check (for updates)</param>
        /// <returns>True if the code is already in use</returns>
        public async Task<bool> IsProjectCodeExistsAsync(string code, int? excludeProjectId = null)
        {
            var query = _context.Projects.Where(p => p.Code.ToLower() == code.ToLower());

            if (excludeProjectId.HasValue)
            {
                query = query.Where(p => p.Id != excludeProjectId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Maps a Project entity to ProjectResponseDto
        /// </summary>
        /// <param name="project">The project entity</param>
        /// <returns>The project DTO</returns>
        private static ProjectResponseDto MapToProjectResponseDto(Project project)
        {
            return new ProjectResponseDto
            {
                Id = project.Id,
                ClientId = project.ClientId,
                ClientName = project.Client?.Name ?? string.Empty,
                ClientCode = project.Client?.Code ?? string.Empty,
                Code = project.Code,
                Name = project.Name,
                Description = project.Description,
                Status = project.Status,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                DeadlineDate = project.DeadlineDate,
                Budget = project.Budget,
                IsActive = project.IsActive,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                TaskCount = 0 // This will need to be calculated separately if needed
            };
        }
    }
}