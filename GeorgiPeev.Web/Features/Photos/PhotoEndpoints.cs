using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Features.Photos;

/// <summary>The public gallery: one list, no detail — a picture has no page of its own.</summary>
internal static class PhotoEndpoints
{
    internal static IEndpointRouteBuilder MapPhotoEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/photos", GetPublishedAsync)
            .WithTags("Photos")
            .WithName("GetPhotos")
            .WithSummary("Published pictures in Georgi's order.");

        return routes;
    }

    private static async Task<Ok<List<PhotoItem>>> GetPublishedAsync(
        AppDbContext db,
        IPhotoStorage storage,
        string? lang,
        CancellationToken cancellationToken)
    {
        var english = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);

        var photos = await db.Photos
            .AsNoTracking()
            .Where(p => p.IsPublished)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedUtc)
            .ToListAsync(cancellationToken);

        // Mapped after the query: UrlFor is C#, not SQL.
        var items = photos.Select(p => new PhotoItem(
            english && p.Alt.En != "" ? p.Alt.En : p.Alt.Bg,
            p.Width,
            p.Height,
            p.FocusX,
            p.FocusY,
            new PhotoUrls(
                storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[0])),
                storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[1])),
                storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[2])))))
            .ToList();

        return TypedResults.Ok(items);
    }
}
