namespace DesignPlanner.Core.Services
{
    public interface INotificationService
    {
        Task NotifyLeaveRequestSubmittedAsync(int leaveRequestId, string employeeName, string leaveType);
        Task NotifyLeaveRequestProcessedAsync(int employeeUserId, bool approved, string leaveType, string managerName);
        Task NotifyLeaveBalanceUpdatedAsync(int employeeUserId, int newBalance);
        Task NotifyManagersAsync(string message, object? data = null);
        Task NotifyUserAsync(int userId, string message, object? data = null);
    }
}