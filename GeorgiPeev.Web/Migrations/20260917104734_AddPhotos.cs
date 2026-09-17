using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeorgiPeev.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    alt_bg = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    alt_en = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    width = table.Column<int>(type: "integer", nullable: false),
                    height = table.Column<int>(type: "integer", nullable: false),
                    focus_x = table.Column<double>(type: "double precision", nullable: false),
                    focus_y = table.Column<double>(type: "double precision", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_photos", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_photos_is_published_sort_order",
                table: "photos",
                columns: new[] { "is_published", "sort_order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "photos");
        }
    }
}
