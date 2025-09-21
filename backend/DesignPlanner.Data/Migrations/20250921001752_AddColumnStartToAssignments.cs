using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddColumnStartToAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ColumnStart",
                table: "Assignments",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColumnStart",
                table: "Assignments");
        }
    }
}
