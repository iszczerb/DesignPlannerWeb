using Microsoft.Extensions.Logging;

namespace DesignPlanner.Core.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger)
        {
            _logger = logger;
        }

        public async Task NotifyLeaveRequestSubmittedAsync(int leaveRequestId, string employeeName, string leaveType)
        {
            // For now, just log the notification. In a real implementation, this would use SignalR
            _logger.LogInformation("Leave request notification: {LeaveType} request from {EmployeeName} (ID: {LeaveRequestId})", 
                leaveType, employeeName, leaveRequestId);
            
            await Task.CompletedTask;
        }

        public async Task NotifyLeaveRequestProcessedAsync(int employeeUserId, bool approved, string leaveType, string managerName)
        {
            var status = approved ? "approved" : "rejected";
            _logger.LogInformation("Leave request processed: {LeaveType} request {Status} for user {UserId} by {ManagerName}", 
                leaveType, status, employeeUserId, managerName);
            
            await Task.CompletedTask;
        }

        public async Task NotifyLeaveBalanceUpdatedAsync(int employeeUserId, int newBalance)
        {
            _logger.LogInformation("Leave balance updated for user {UserId}: {NewBalance} days", 
                employeeUserId, newBalance);
            
            await Task.CompletedTask;
        }

        public async Task NotifyManagersAsync(string message, object? data = null)
        {
            _logger.LogInformation("Manager notification: {Message}", message);
            
            await Task.CompletedTask;
        }

        public async Task NotifyUserAsync(int userId, string message, object? data = null)
        {
            _logger.LogInformation("User notification for {UserId}: {Message}", userId, message);
            
            await Task.CompletedTask;
        }
    }
}