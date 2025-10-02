using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DesignPlanner.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskTypeSkillsNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SkillId1",
                table: "TaskTypeSkills",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTypeSkills_SkillId1",
                table: "TaskTypeSkills",
                column: "SkillId1");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskTypeSkills_Skills_SkillId1",
                table: "TaskTypeSkills",
                column: "SkillId1",
                principalTable: "Skills",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskTypeSkills_Skills_SkillId1",
                table: "TaskTypeSkills");

            migrationBuilder.DropIndex(
                name: "IX_TaskTypeSkills_SkillId1",
                table: "TaskTypeSkills");

            migrationBuilder.DropColumn(
                name: "SkillId1",
                table: "TaskTypeSkills");
        }
    }
}
