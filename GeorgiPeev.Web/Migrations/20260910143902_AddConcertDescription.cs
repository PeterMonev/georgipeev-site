using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeorgiPeev.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddConcertDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description_bg",
                table: "concerts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "concerts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "description_bg",
                table: "concerts");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "concerts");
        }
    }
}
