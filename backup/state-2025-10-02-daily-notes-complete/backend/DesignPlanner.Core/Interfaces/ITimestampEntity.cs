namespace DesignPlanner.Core.Interfaces
{
    public interface ITimestampEntity
    {
        DateTime CreatedAt { get; set; }
        DateTime UpdatedAt { get; set; }
    }
}