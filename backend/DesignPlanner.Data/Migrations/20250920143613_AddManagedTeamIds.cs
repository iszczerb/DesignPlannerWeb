using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedTeamIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ManagedTeamIds",
                table: "Users",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ManagedTeamIds",
                table: "Users");
        }
    }
}
