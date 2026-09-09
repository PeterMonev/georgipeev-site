using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeorgiPeev.Web.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "concerts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    venue_bg = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    venue_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    city_bg = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    city_en = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    note_bg = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    note_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ticket_url = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_concerts", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_concerts_is_published_starts_at",
                table: "concerts",
                columns: new[] { "is_published", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_concerts_slug",
                table: "concerts",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "concerts");
        }
    }
}
