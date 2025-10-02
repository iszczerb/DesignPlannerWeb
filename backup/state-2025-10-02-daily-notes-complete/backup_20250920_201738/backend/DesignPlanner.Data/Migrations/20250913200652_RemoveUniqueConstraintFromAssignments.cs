using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUniqueConstraintFromAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assignments_EmployeeId_AssignedDate_Slot",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EmployeeId_AssignedDate_Slot",
                table: "Assignments",
                columns: new[] { "EmployeeId", "AssignedDate", "Slot" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assignments_EmployeeId_AssignedDate_Slot",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EmployeeId_AssignedDate_Slot",
                table: "Assignments",
                columns: new[] { "EmployeeId", "AssignedDate", "Slot" },
                unique: true);
        }
    }
}
