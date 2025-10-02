using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DesignPlanner.Api.Hubs
{
    [Authorize]
    public class ScheduleUpdateHub : Hub
    {
        public async Task JoinScheduleGroup()
        {
            // Add all users to a general schedule updates group
            await Groups.AddToGroupAsync(Context.ConnectionId, "schedule_updates");
        }

        public async Task LeaveScheduleGroup()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "schedule_updates");
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Add all authenticated users to the schedule updates group
                await Groups.AddToGroupAsync(Context.ConnectionId, "schedule_updates");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "schedule_updates");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}