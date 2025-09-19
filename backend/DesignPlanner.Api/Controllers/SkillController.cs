using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DesignPlanner.Core.DTOs;
using DesignPlanner.Core.Services;

namespace DesignPlanner.Api.Controllers
{
    /// <summary>
    /// Controller for managing skills
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SkillController : ControllerBase
    {
        private readonly ISkillService _skillService;
        private readonly ILogger<SkillController> _logger;

        public SkillController(ISkillService skillService, ILogger<SkillController> logger)
        {
            _skillService = skillService;
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
        /// Get all skills
        /// </summary>
        /// <returns>List of skills</returns>
        [HttpGet]
        public async Task<ActionResult> GetSkills([FromQuery] SkillQueryDto? query = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                query ??= new SkillQueryDto();
                var skillsResponse = await _skillService.GetSkillsAsync(query, userId);
                return Ok(new { skills = skillsResponse.Skills });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills");
                return StatusCode(500, "An error occurred while retrieving skills");
            }
        }

        /// <summary>
        /// Get a specific skill by ID
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <returns>Skill details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<SkillResponseDto>> GetSkill(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var skill = await _skillService.GetSkillByIdAsync(id, userId);
                if (skill == null)
                {
                    return NotFound("Skill not found");
                }

                return Ok(skill);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skill {SkillId}", id);
                return StatusCode(500, "An error occurred while retrieving the skill");
            }
        }

        /// <summary>
        /// Create a new skill
        /// </summary>
        /// <param name="createDto">Skill creation data</param>
        /// <returns>Created skill</returns>
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<SkillResponseDto>> CreateSkill([FromBody] CreateSkillRequestDto createDto)
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

                var skill = await _skillService.CreateSkillAsync(createDto, userId);
                return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skill);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating skill");
                return StatusCode(500, "An error occurred while creating the skill");
            }
        }

        /// <summary>
        /// Update an existing skill
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <param name="updateDto">Skill update data</param>
        /// <returns>Updated skill</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<SkillResponseDto>> UpdateSkill(int id, [FromBody] UpdateSkillRequestDto updateDto)
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

                var skill = await _skillService.UpdateSkillAsync(id, updateDto, userId);
                return Ok(skill);
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
                _logger.LogError(ex, "Error updating skill {SkillId}", id);
                return StatusCode(500, "An error occurred while updating the skill");
            }
        }

        /// <summary>
        /// Delete a skill
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult> DeleteSkill(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var result = await _skillService.DeleteSkillAsync(id, userId);
                if (!result)
                {
                    return NotFound("Skill not found");
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting skill {SkillId}", id);
                return StatusCode(500, "An error occurred while deleting the skill");
            }
        }

        /// <summary>
        /// Get active skills
        /// </summary>
        /// <returns>List of active skills</returns>
        [HttpGet("active")]
        public async Task<ActionResult<List<SkillResponseDto>>> GetActiveSkills()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var skills = await _skillService.GetActiveSkillsAsync(userId);
                return Ok(skills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active skills");
                return StatusCode(500, "An error occurred while retrieving active skills");
            }
        }

        /// <summary>
        /// Get skills by category
        /// </summary>
        /// <param name="category">Skill category</param>
        /// <returns>List of skills in the category</returns>
        [HttpGet("category/{category}")]
        public async Task<ActionResult<List<SkillResponseDto>>> GetSkillsByCategory(string category)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var skills = await _skillService.GetSkillsByCategoryAsync(category, userId);
                return Ok(skills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills for category {Category}", category);
                return StatusCode(500, "An error occurred while retrieving skills by category");
            }
        }

        /// <summary>
        /// Search skills by name or description
        /// </summary>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of matching skills</returns>
        [HttpGet("search")]
        public async Task<ActionResult<List<SkillResponseDto>>> SearchSkills([FromQuery] string searchTerm)
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

                var query = new SkillQueryDto { SearchTerm = searchTerm };
                var result = await _skillService.GetSkillsAsync(query, userId);
                var skills = result.Skills;
                return Ok(skills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching skills with term {SearchTerm}", searchTerm);
                return StatusCode(500, "An error occurred while searching skills");
            }
        }

        /// <summary>
        /// Get all skill categories
        /// </summary>
        /// <returns>List of skill categories</returns>
        [HttpGet("categories")]
        public async Task<ActionResult<List<string>>> GetSkillCategories()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                var categories = await _skillService.GetSkillCategoriesAsync(userId);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skill categories");
                return StatusCode(500, "An error occurred while retrieving skill categories");
            }
        }

        /// <summary>
        /// Get employees with a specific skill
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <returns>List of employees with the skill</returns>
        [HttpGet("{id}/employees")]
        public async Task<ActionResult<List<object>>> GetEmployeesWithSkill(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                {
                    return Unauthorized("Unable to identify user");
                }

                // This method doesn't exist in the interface, return not implemented
                return StatusCode(501, "Get employees with skill functionality not implemented");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employees with skill {SkillId}", id);
                return StatusCode(500, "An error occurred while retrieving employees with skill");
            }
        }
    }
}