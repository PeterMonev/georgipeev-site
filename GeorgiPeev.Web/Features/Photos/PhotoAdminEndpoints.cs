using GeorgiPeev.Web.Common;
using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GeorgiPeev.Web.Features.Photos;

internal static class PhotoAdminEndpoints
{
    internal static IEndpointRouteBuilder MapPhotoAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/photos")
            .WithTags("Photos (admin)")
            .RequireAuthorization();

        group.MapGet("/", ListAsync)
            .WithName("ListAdminPhotos");

        group.MapPost("/", UploadAsync)
            .WithName("UploadPhoto")
            // A form post needs an antiforgery token unless we say otherwise.
            // The cookie is SameSite=Strict: a form on another site cannot
            // send it, which is exactly the attack the token exists to stop.
            .DisableAntiforgery();

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeletePhoto");

        return routes;
    }

    private static async Task<Ok<List<PhotoAdminItem>>> ListAsync(
        AppDbContext db,
        IPhotoStorage storage,
        CancellationToken cancellationToken)
    {
        var photos = await db.Photos
            .AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedUtc)
            .ToListAsync(cancellationToken);

        // Mapped after the query, not inside it: UrlFor is C#, not SQL.
        return TypedResults.Ok(photos.Select(p => ToItem(p, storage)).ToList());
    }

    /// <summary>
    /// One file per request. The browser uploads a batch as parallel requests,
    /// and each one succeeds or fails on its own — one bad file does not sink
    /// the other nine.
    /// </summary>
    private static async Task<Results<Created<PhotoAdminItem>, ValidationProblem>> UploadAsync(
        IFormFile file,
        AppDbContext db,
        IPhotoStorage storage,
        PhotoProcessor processor,
        IOptions<PhotoOptions> options,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0 || file.Length > options.Value.MaxUploadBytes)
        {
            return Refused("TooLarge");
        }

        var photo = new Photo
        {
            Alt = new Localized("", ""),
            CreatedUtc = clock.GetUtcNow(),
            // New pictures go to the end of the gallery.
            SortOrder = await db.Photos.MaxAsync(p => (int?)p.SortOrder, cancellationToken) + 1 ?? 0,
        };

        await using var upload = file.OpenReadStream();
        var result = await processor.ProcessAsync(photo.Id, upload, cancellationToken);

        switch (result)
        {
            case ProcessResult.Refused refused:
                return Refused(refused.Code);

            case ProcessResult.Stored stored:
                photo.Width = stored.Width;
                photo.Height = stored.Height;
                break;
        }

        db.Photos.Add(photo);
        await db.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/admin/photos/{photo.Id}", ToItem(photo, storage));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteAsync(
        Guid id,
        AppDbContext db,
        PhotoProcessor processor,
        CancellationToken cancellationToken)
    {
        // The row first: once it is gone nothing links to the files, so a
        // failure between the two steps leaves orphan files, never a broken
        // picture on the site.
        var deleted = await db.Photos
            .Where(p => p.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted == 0)
        {
            return TypedResults.NotFound();
        }

        await processor.DeleteAsync(id, cancellationToken);
        return TypedResults.NoContent();
    }

    private static PhotoAdminItem ToItem(Photo p, IPhotoStorage storage) => new(
        p.Id, p.Alt, p.Width, p.Height, p.FocusX, p.FocusY, p.SortOrder, p.IsPublished,
        new PhotoUrls(
            storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[0])),
            storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[1])),
            storage.UrlFor(PhotoProcessor.KeyFor(p.Id, PhotoProcessor.Sizes[2]))));

    /// <summary>The same 400 shape as every other validation failure, keyed by the form field.</summary>
    private static ValidationProblem Refused(string code) =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]> { ["File"] = [code] });
}
