using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GeorgiPeev.Web.Features.News;

internal sealed class NewsItemConfiguration : IEntityTypeConfiguration<NewsItem>
{
    public void Configure(EntityTypeBuilder<NewsItem> builder)
    {
        // The convention would call it news_items; "news" is what everyone
        // would type in a query.
        builder.ToTable("news");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).ValueGeneratedNever();

        // Same optimistic locking as concerts: Postgres's own row version.
        builder.Property<uint>("xmin")
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsConcurrencyToken();

        builder.Property(n => n.Slug).HasMaxLength(120);
        builder.HasIndex(n => n.Slug).IsUnique();

        builder.Property(n => n.Link).HasMaxLength(400);

        // The public list is always "published, newest first".
        builder.HasIndex(n => new { n.IsPublished, n.PublishedAt });

        builder.OwnsOne(n => n.Title, t =>
        {
            t.Property(p => p.Bg).HasMaxLength(200);
            t.Property(p => p.En).HasMaxLength(200);
        });

        builder.OwnsOne(n => n.Summary, s =>
        {
            s.Property(p => p.Bg).HasMaxLength(400);
            s.Property(p => p.En).HasMaxLength(400);
        });

        builder.OwnsOne(n => n.Body, b =>
        {
            b.Property(p => p.Bg).HasMaxLength(8000);
            b.Property(p => p.En).HasMaxLength(8000);
        });
    }
}
