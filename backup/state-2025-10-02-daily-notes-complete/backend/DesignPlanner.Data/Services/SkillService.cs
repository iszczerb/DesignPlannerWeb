using Microsoft.EntityFrameworkCore;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Entities;
using DesignPlanner.Core.Services;
using DesignPlanner.Data.Context;

namespace DesignPlanner.Data.Services
{
    /// <summary>
    /// Service implementation for skill management operations
    /// </summary>
    public class SkillService : ISkillService
    {
        private readonly ApplicationDbContext _context;

        public SkillService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Creates a new skill
        /// </summary>
        /// <param name="request">The skill creation request</param>
        /// <param name="createdByUserId">ID of the user creating the skill</param>
        /// <returns>The created skill DTO</returns>
        public async Task<SkillResponseDto?> CreateSkillAsync(CreateSkillRequestDto request, int createdByUserId)
        {
            // Check if skill name already exists
            if (await IsSkillNameExistsAsync(request.Name))
            {
                throw new ArgumentException($"Skill '{request.Name}' already exists");
            }

            var skill = new Skill
            {
                Name = request.Name,
                Description = request.Description,
                Category = request.Category,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Skills.Add(skill);
            await _context.SaveChangesAsync();

            return MapToSkillResponseDto(skill);
        }

        /// <summary>
        /// Updates an existing skill
        /// </summary>
        /// <param name="skillId">ID of the skill to update</param>
        /// <param name="request">The skill update request</param>
        /// <param name="updatedByUserId">ID of the user updating the skill</param>
        /// <returns>The updated skill DTO</returns>
        public async Task<SkillResponseDto?> UpdateSkillAsync(int skillId, UpdateSkillRequestDto request, int updatedByUserId)
        {
            var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
            if (skill == null)
                throw new ArgumentException("Skill not found");

            // Check if skill name already exists (excluding current skill)
            if (await IsSkillNameExistsAsync(request.Name, skillId))
            {
                throw new ArgumentException($"Skill '{request.Name}' already exists");
            }

            skill.Name = request.Name;
            skill.Description = request.Description;
            skill.Category = request.Category;
            skill.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return MapToSkillResponseDto(skill);
        }

        /// <summary>
        /// Soft deletes a skill by setting IsActive to false
        /// </summary>
        /// <param name="skillId">ID of the skill to delete</param>
        /// <param name="deletedByUserId">ID of the user deleting the skill</param>
        /// <returns>True if deletion was successful</returns>
        public async Task<bool> DeleteSkillAsync(int skillId, int deletedByUserId)
        {
            var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
            if (skill == null)
                return false;

            // Check if skill is assigned to any employees (all employees in DB are active)
            var hasEmployeeSkills = await _context.EmployeeSkills
                .AnyAsync(es => es.SkillId == skillId);

            if (hasEmployeeSkills)
                throw new InvalidOperationException("Cannot delete skill that is assigned to employees. Please remove skill assignments first.");

            skill.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets a skill by ID
        /// </summary>
        /// <param name="skillId">ID of the skill to retrieve</param>
        /// <param name="requestingUserId">ID of the user requesting the skill</param>
        /// <returns>The skill DTO if found</returns>
        public async Task<SkillResponseDto?> GetSkillByIdAsync(int skillId, int requestingUserId)
        {
            var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
            return skill != null ? MapToSkillResponseDto(skill) : null;
        }

        /// <summary>
        /// Gets a paginated list of skills with filtering and sorting
        /// </summary>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <returns>Paginated skill list response</returns>
        public async Task<SkillListResponseDto> GetSkillsAsync(SkillQueryDto query, int requestingUserId)
        {
            var queryable = _context.Skills.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                var searchTerm = query.SearchTerm.ToLower();
                queryable = queryable.Where(s =>
                    s.Name.ToLower().Contains(searchTerm) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchTerm)) ||
                    (s.Category != null && s.Category.ToLower().Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(query.Category))
            {
                queryable = queryable.Where(s => s.Category != null && s.Category.ToLower() == query.Category.ToLower());
            }

            if (query.IsActive.HasValue)
            {
                queryable = queryable.Where(s => s.IsActive == query.IsActive.Value);
            }

            // Apply sorting
            queryable = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(s => s.Name)
                    : queryable.OrderBy(s => s.Name),
                "category" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(s => s.Category)
                    : queryable.OrderBy(s => s.Category),
                "createdat" => query.SortDirection.ToLower() == "desc"
                    ? queryable.OrderByDescending(s => s.CreatedAt)
                    : queryable.OrderBy(s => s.CreatedAt),
                _ => queryable.OrderBy(s => s.Name)
            };

            var totalCount = await queryable.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            var skillEntities = await queryable
                .Include(s => s.TaskTypeSkills)
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var skills = skillEntities.Select(s => MapToSkillResponseDtoWithCounts(s)).ToList();

            return new SkillListResponseDto
            {
                Skills = skills,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// Toggles the active status of a skill
        /// </summary>
        /// <param name="skillId">ID of the skill to toggle</param>
        /// <param name="isActive">New active status</param>
        /// <param name="updatedByUserId">ID of the user updating the status</param>
        /// <returns>True if status was successfully updated</returns>
        public async Task<bool> ToggleSkillStatusAsync(int skillId, bool isActive, int updatedByUserId)
        {
            var skill = await _context.Skills.FirstOrDefaultAsync(s => s.Id == skillId);
            if (skill == null)
                return false;

            // If deactivating, check for employee assignments (all employees in DB are active)
            if (!isActive && skill.IsActive)
            {
                var hasEmployeeSkills = await _context.EmployeeSkills
                    .AnyAsync(es => es.SkillId == skillId);

                if (hasEmployeeSkills)
                    throw new InvalidOperationException("Cannot deactivate skill that is assigned to employees. Please remove skill assignments first.");
            }

            skill.IsActive = isActive;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Gets all active skills for dropdown/selection purposes
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <returns>List of active skill DTOs</returns>
        public async Task<List<SkillResponseDto>> GetActiveSkillsAsync(int requestingUserId)
        {
            var skills = await _context.Skills
                .Where(s => s.IsActive)
                .OrderBy(s => s.Category)
                .ThenBy(s => s.Name)
                .Select(s => MapToSkillResponseDto(s))
                .ToListAsync();

            return skills;
        }

        /// <summary>
        /// Gets skills by category
        /// </summary>
        /// <param name="category">The skill category</param>
        /// <param name="requestingUserId">ID of the user requesting the skills</param>
        /// <param name="includeInactive">Whether to include inactive skills</param>
        /// <returns>List of skill DTOs in the specified category</returns>
        public async Task<List<SkillResponseDto>> GetSkillsByCategoryAsync(string category, int requestingUserId, bool includeInactive = false)
        {
            var queryable = _context.Skills
                .Where(s => s.Category != null && s.Category.ToLower() == category.ToLower());

            if (!includeInactive)
            {
                queryable = queryable.Where(s => s.IsActive);
            }

            var skills = await queryable
                .OrderBy(s => s.Name)
                .Select(s => MapToSkillResponseDto(s))
                .ToListAsync();

            return skills;
        }

        /// <summary>
        /// Gets all skill categories
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the categories</param>
        /// <returns>List of distinct skill categories</returns>
        public async Task<List<string>> GetSkillCategoriesAsync(int requestingUserId)
        {
            var categories = await _context.Skills
                .Where(s => s.Category != null && s.IsActive)
                .Select(s => s.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return categories;
        }

        /// <summary>
        /// Checks if a skill name is already in use
        /// </summary>
        /// <param name="name">The skill name to check</param>
        /// <param name="excludeSkillId">Optional skill ID to exclude from the check (for updates)</param>
        /// <returns>True if the name is already in use</returns>
        public async Task<bool> IsSkillNameExistsAsync(string name, int? excludeSkillId = null)
        {
            var query = _context.Skills.Where(s => s.Name.ToLower() == name.ToLower());

            if (excludeSkillId.HasValue)
            {
                query = query.Where(s => s.Id != excludeSkillId.Value);
            }

            return await query.AnyAsync();
        }

        /// <summary>
        /// Maps a Skill entity to SkillResponseDto
        /// </summary>
        /// <param name="skill">The skill entity</param>
        /// <returns>The skill DTO</returns>
        private static SkillResponseDto MapToSkillResponseDto(Skill skill)
        {
            return new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Description = skill.Description,
                Category = skill.Category,
                IsActive = skill.IsActive,
                CreatedAt = skill.CreatedAt,
                EmployeeCount = 0 // This will need to be calculated separately if needed
            };
        }

        /// <summary>
        /// Maps a Skill entity to SkillResponseDto with counts calculated
        /// </summary>
        /// <param name="skill">The skill entity with TaskTypeSkills included</param>
        /// <returns>The skill DTO with task types count</returns>
        private static SkillResponseDto MapToSkillResponseDtoWithCounts(Skill skill)
        {
            return new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Description = skill.Description,
                Category = skill.Category,
                IsActive = skill.IsActive,
                CreatedAt = skill.CreatedAt,
                EmployeeCount = 0, // This will need to be calculated separately if needed
                TaskTypesCount = skill.TaskTypeSkills?.Count ?? 0
            };
        }

        /// <summary>
        /// Gets all employee skill levels
        /// </summary>
        /// <param name="requestingUserId">ID of the user requesting the data</param>
        /// <returns>List of employee skill levels</returns>
        public async Task<List<EmployeeSkillResponseDto>> GetEmployeeSkillsAsync(int requestingUserId)
        {
            var employeeSkills = await _context.EmployeeSkills
                .Include(es => es.Employee)
                .Include(es => es.Skill)
                .ToListAsync();

            return employeeSkills.Select(es => new EmployeeSkillResponseDto
            {
                EmployeeId = es.EmployeeId,
                SkillId = es.SkillId,
                ProficiencyLevel = es.ProficiencyLevel,
                Notes = es.Notes,
                AcquiredDate = es.AcquiredDate
            }).ToList();
        }

        /// <summary>
        /// Updates an employee's skill level
        /// </summary>
        /// <param name="employeeId">Employee ID</param>
        /// <param name="skillId">Skill ID</param>
        /// <param name="request">Update request</param>
        /// <param name="requestingUserId">ID of the user making the request</param>
        /// <returns>Task</returns>
        public async Task UpdateEmployeeSkillAsync(int employeeId, int skillId, UpdateEmployeeSkillRequestDto request, int requestingUserId)
        {
            // Verify employee and skill exist
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null)
                throw new ArgumentException($"Employee with ID {employeeId} not found");

            var skill = await _context.Skills.FindAsync(skillId);
            if (skill == null)
                throw new ArgumentException($"Skill with ID {skillId} not found");

            // Find existing employee skill
            var existingEmployeeSkill = await _context.EmployeeSkills
                .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

            if (existingEmployeeSkill == null)
            {
                // Create new employee skill
                var newEmployeeSkill = new EmployeeSkill
                {
                    EmployeeId = employeeId,
                    SkillId = skillId,
                    ProficiencyLevel = request.ProficiencyLevel,
                    Notes = request.Notes,
                    AcquiredDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.EmployeeSkills.Add(newEmployeeSkill);
            }
            else
            {
                // Update existing employee skill
                existingEmployeeSkill.ProficiencyLevel = request.ProficiencyLevel;
                existingEmployeeSkill.Notes = request.Notes;
                existingEmployeeSkill.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Deletes an employee's skill level
        /// </summary>
        /// <param name="employeeId">Employee ID</param>
        /// <param name="skillId">Skill ID</param>
        /// <param name="requestingUserId">ID of the user making the request</param>
        /// <returns>Task</returns>
        public async Task DeleteEmployeeSkillAsync(int employeeId, int skillId, int requestingUserId)
        {
            var employeeSkill = await _context.EmployeeSkills
                .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

            if (employeeSkill == null)
                throw new ArgumentException($"Employee skill not found for employee {employeeId} and skill {skillId}");

            _context.EmployeeSkills.Remove(employeeSkill);
            await _context.SaveChangesAsync();
        }
    }
}