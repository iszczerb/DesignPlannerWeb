using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTaskTypeColorAndIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TaskTypes",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "Color",
                table: "TaskTypes");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "TaskTypes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "TaskTypes",
                type: "TEXT",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "TaskTypes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "TaskTypes",
                columns: new[] { "Id", "Color", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "#FF6B6B", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "UI/UX Design tasks", true, "Design" },
                    { 2, "#4ECDC4", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Software development tasks", true, "Development" },
                    { 3, "#45B7D1", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Quality assurance and testing", true, "Testing" },
                    { 4, "#96CEB4", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Research and analysis tasks", true, "Research" },
                    { 5, "#FECA57", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Project planning and management", true, "Planning" },
                    { 6, "#FF9FF3", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Code review and documentation", true, "Review" }
                });
        }
    }
}
