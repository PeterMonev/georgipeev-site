using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeorgiPeev.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddNews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "news",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    title_bg = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    summary_bg = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    summary_en = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    body_bg = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    body_en = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    link = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_news", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_news_is_published_published_at",
                table: "news",
                columns: new[] { "is_published", "published_at" });

            migrationBuilder.CreateIndex(
                name: "ix_news_slug",
                table: "news",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "news");
        }
    }
}
