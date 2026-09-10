using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// Mapping lives next to the entity it maps, not in one ever-growing
/// OnModelCreating. Internal, because nothing outside this feature needs it.
/// </summary>
internal sealed class ConcertConfiguration : IEntityTypeConfiguration<Concert>
{
    public void Configure(EntityTypeBuilder<Concert> builder)
    {
        builder.HasKey(c => c.Id);

        // The id comes from C#, so EF must not try to generate one.
        builder.Property(c => c.Id).ValueGeneratedNever();

        // Postgres already tracks the transaction that last touched each row in
        // a hidden xmin column. Using it as a concurrency token gives optimistic
        // locking for free: two admins editing the same concert cannot silently
        // overwrite each other. No extra column, nothing to bump by hand.
        builder.Property<uint>("xmin")
         .HasColumnName("xmin")
         .HasColumnType("xid")
         .ValueGeneratedOnAddOrUpdate()
         .IsConcurrencyToken();

        builder.Property(c => c.Slug).HasMaxLength(120);
        builder.HasIndex(c => c.Slug).IsUnique();

        builder.Property(c => c.TicketUrl).HasMaxLength(400);

        // The public list is always "published, in date order". One composite
        // index serves both the filter and the sort.
        builder.HasIndex(c => new { c.IsPublished, c.StartsAt });

        builder.OwnsOne(c => c.Venue, v =>
        {
            v.Property(p => p.Bg).HasMaxLength(200);
            v.Property(p => p.En).HasMaxLength(200);
        });

        builder.OwnsOne(c => c.City, v =>
        {
            v.Property(p => p.Bg).HasMaxLength(120);
            v.Property(p => p.En).HasMaxLength(120);
        });

        builder.OwnsOne(c => c.Note, v =>
        {
            v.Property(p => p.Bg).HasMaxLength(200);
            v.Property(p => p.En).HasMaxLength(200);
        });

        builder.OwnsOne(c => c.Description, v =>
        {
            v.Property(p => p.Bg).HasMaxLength(2000);
            v.Property(p => p.En).HasMaxLength(2000);
        });
    }
}
