using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSlotOrderToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SlotOrder",
                table: "Assignments",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SlotOrder",
                table: "Assignments");
        }
    }
}
