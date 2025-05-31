using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vrooom.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportStatusFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Support",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "Support",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResolvedByUserId",
                table: "Support",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Support",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Support_ResolvedByUserId",
                table: "Support",
                column: "ResolvedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Support_AspNetUsers_ResolvedByUserId",
                table: "Support",
                column: "ResolvedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Support_AspNetUsers_ResolvedByUserId",
                table: "Support");

            migrationBuilder.DropIndex(
                name: "IX_Support_ResolvedByUserId",
                table: "Support");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Support");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "Support");

            migrationBuilder.DropColumn(
                name: "ResolvedByUserId",
                table: "Support");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Support");
        }
    }
}
