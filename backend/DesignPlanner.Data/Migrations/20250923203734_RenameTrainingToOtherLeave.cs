using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameTrainingToOtherLeave : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TrainingDaysAllowed",
                table: "AbsenceAllocations",
                newName: "OtherLeaveDaysAllowed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OtherLeaveDaysAllowed",
                table: "AbsenceAllocations",
                newName: "TrainingDaysAllowed");
        }
    }
}
