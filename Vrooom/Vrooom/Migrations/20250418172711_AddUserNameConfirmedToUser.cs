using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vrooom.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNameConfirmedToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UserNameConfirmed",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserNameConfirmed",
                table: "AspNetUsers");
        }
    }
}
