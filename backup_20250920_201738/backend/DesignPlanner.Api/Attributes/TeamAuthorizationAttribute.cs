using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using DesignPlanner.Core.Services;
using System.Security.Claims;

namespace DesignPlanner.Api.Attributes
{
    /// <summary>
    /// Authorization attribute for team-based operations
    /// </summary>
    public class TeamAuthorizationAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public enum PermissionType
        {
            ManageTeam,
            ViewTeam,
            ManageEmployee,
            ViewEmployee,
            ModifyAssignment
        }

        private readonly PermissionType _permissionType;
        private readonly string _resourceIdParameterName;

        public TeamAuthorizationAttribute(PermissionType permissionType, string resourceIdParameterName = "id")
        {
            _permissionType = permissionType;
            _resourceIdParameterName = resourceIdParameterName;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authService = context.HttpContext.RequestServices.GetService<ITeamAuthorizationService>();
            if (authService == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Get user ID from claims
            var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Get resource ID from route or query parameters
            var resourceId = GetResourceId(context);
            if (resourceId == null)
            {
                context.Result = new BadRequestObjectResult($"Missing {_resourceIdParameterName} parameter");
                return;
            }

            // Check permission based on type
            bool hasPermission = _permissionType switch
            {
                PermissionType.ManageTeam => await authService.CanManageTeamAsync(userId, resourceId.Value),
                PermissionType.ViewTeam => await authService.CanViewTeamAsync(userId, resourceId.Value),
                PermissionType.ManageEmployee => await authService.CanManageEmployeeAsync(userId, resourceId.Value),
                PermissionType.ViewEmployee => await authService.CanViewEmployeeAsync(userId, resourceId.Value),
                PermissionType.ModifyAssignment => await authService.CanModifyAssignmentAsync(userId, resourceId.Value),
                _ => false
            };

            if (!hasPermission)
            {
                context.Result = new ForbidResult($"Insufficient permissions for {_permissionType}");
            }
        }

        private int? GetResourceId(AuthorizationFilterContext context)
        {
            // Try to get from route values first
            if (context.RouteData.Values.TryGetValue(_resourceIdParameterName, out var routeValue))
            {
                if (int.TryParse(routeValue?.ToString(), out int routeId))
                {
                    return routeId;
                }
            }

            // Try to get from query parameters
            if (context.HttpContext.Request.Query.TryGetValue(_resourceIdParameterName, out var queryValue))
            {
                if (int.TryParse(queryValue.FirstOrDefault(), out int queryId))
                {
                    return queryId;
                }
            }

            // Try to get from request body for POST/PUT operations
            if (context.HttpContext.Request.HasFormContentType)
            {
                if (context.HttpContext.Request.Form.TryGetValue(_resourceIdParameterName, out var formValue))
                {
                    if (int.TryParse(formValue.FirstOrDefault(), out int formId))
                    {
                        return formId;
                    }
                }
            }

            return null;
        }
    }
}