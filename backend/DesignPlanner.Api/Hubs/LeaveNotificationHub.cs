using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DesignPlanner.Api.Hubs
{
    [Authorize]
    public class LeaveNotificationHub : Hub
    {
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal notification group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                // Add managers to the managers group
                if (Context.User.IsInRole("Manager") || Context.User.IsInRole("Admin"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "managers");
                }
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                if (Context.User.IsInRole("Manager") || Context.User.IsInRole("Admin"))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, "managers");
                }
            }
            
            await base.OnDisconnectedAsync(exception);
        }
    }
}