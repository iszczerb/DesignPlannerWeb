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
            // Verify client exists first
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId);
            if (client == null)
                throw new ArgumentException("Client not found");


            // Validate dates
            if (request.EndDate.HasValue && request.StartDate.HasValue && request.EndDate < request.StartDate)
                throw new ArgumentException("End date cannot be before start date");
            if (request.DeadlineDate.HasValue && request.StartDate.HasValue && request.DeadlineDate < request.StartDate)
                throw new ArgumentException("Deadline date cannot be before start date");

            var project = new Project
            {
                ClientId = request.ClientId,
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                Status = request.Status,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DeadlineDate = request.DeadlineDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Reload with client and category data using projection
            var reloadedProject = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.Category)
                .Where(p => p.Id == project.Id)
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
                .FirstAsync();

            return reloadedProject;
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
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                throw new ArgumentException("Project not found");


            // Verify client exists
            if (!await _context.Clients.AnyAsync(c => c.Id == request.ClientId))
                throw new ArgumentException("Client not found");

            // Validate dates
            if (request.EndDate.HasValue && request.EndDate < request.StartDate)
                throw new ArgumentException("End date cannot be before start date");
            if (request.DeadlineDate.HasValue && request.DeadlineDate < request.StartDate)
                throw new ArgumentException("Deadline date cannot be before start date");

            project.ClientId = request.ClientId;
            project.CategoryId = request.CategoryId;
            project.Name = request.Name;
            project.Description = request.Description;
            project.Status = request.Status;
            project.StartDate = request.StartDate ?? project.StartDate;
            project.EndDate = request.EndDate;
            project.DeadlineDate = request.DeadlineDate;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload with updated client and category data using projection
            var updatedProject = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.Category)
                .Where(p => p.Id == projectId)
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
                .FirstAsync();

            return updatedProject;
        }

        /// <summary>
        /// Hard deletes a project from the database
        /// </summary>
        /// <param name="projectId">ID of the project to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the project</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteProjectAsync(int projectId, int deletedByUserId)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null)
                return false;

            // Check if project has tasks
            var hasTasks = await _context.ProjectTasks
                .AnyAsync(t => t.ProjectId == projectId);

            if (hasTasks)
                throw new InvalidOperationException("Cannot delete project with tasks. Please delete or reassign tasks first.");

            _context.Projects.Remove(project);
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
                .Include(p => p.Category)
                .Where(p => p.Id == projectId)
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
                .FirstOrDefaultAsync();

            return project;
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
                .Include(p => p.Category)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
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
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
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
        /// Gets all active projects for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the projects</param>
        /// <returns>List of active project DTOs</returns>
        public async Task<List<ProjectResponseDto>> GetActiveProjectsAsync(int requestingUserId)
        {
            var projects = await _context.Projects
                .Include(p => p.Client)
                .Include(p => p.Category)
                .OrderBy(p => p.Name)
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
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


            var projects = await queryable
                .OrderBy(p => p.Name)
                .Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    ClientId = p.ClientId,
                    ClientName = p.Client.Name,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    DeadlineDate = p.DeadlineDate,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TaskCount = 0
                })
                .ToListAsync();

            return projects;
        }


    }
}