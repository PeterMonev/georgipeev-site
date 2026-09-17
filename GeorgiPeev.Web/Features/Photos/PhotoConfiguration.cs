using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GeorgiPeev.Web.Features.Photos;

internal sealed class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        // The gallery is always "published, in Georgi's order".
        builder.HasIndex(p => new { p.IsPublished, p.SortOrder });

        builder.OwnsOne(p => p.Alt, a =>
        {
            a.Property(x => x.Bg).HasMaxLength(300);
            a.Property(x => x.En).HasMaxLength(300);
        });
    }
}
