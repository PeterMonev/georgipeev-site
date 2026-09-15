using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Features.News;

internal static class NewsEndpoints
{
    internal static IEndpointRouteBuilder MapNewsEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/news").WithTags("News");

        group.MapGet("/", GetPublishedAsync)
            .WithName("GetNews")
            .WithSummary("Published stories, newest first.");

        group.MapGet("/{slug}", GetBySlugAsync)
            .WithName("GetNewsBySlug")
            .WithSummary("One published story by its slug.");

        return routes;
    }

    private static async Task<Ok<List<NewsListItem>>> GetPublishedAsync(
        AppDbContext db,
        TimeProvider clock,
        string? lang,
        CancellationToken cancellationToken)
    {
        var english = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);
        var now = clock.GetUtcNow();

        var stories = await db.News
            .AsNoTracking()
            // A story dated in the future is scheduled, not hidden: it shows
            // up on its day without anyone touching the admin.
            .Where(n => n.IsPublished && n.PublishedAt <= now)
            .OrderByDescending(n => n.PublishedAt)
            .Select(n => new NewsListItem(
                n.Slug,
                n.PublishedAt,
                english && n.Title.En != "" ? n.Title.En : n.Title.Bg,
                english && n.Summary.En != "" ? n.Summary.En : n.Summary.Bg,
                n.Link))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(stories);
    }

    private static async Task<Results<Ok<NewsDetail>, NotFound>> GetBySlugAsync(
        string slug,
        AppDbContext db,
        TimeProvider clock,
        string? lang,
        CancellationToken cancellationToken)
    {
        var english = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);
        var now = clock.GetUtcNow();

        var story = await db.News
            .AsNoTracking()
            .Where(n => n.IsPublished && n.PublishedAt <= now && n.Slug == slug)
            .Select(n => new NewsDetail(
                n.Slug,
                n.PublishedAt,
                english && n.Title.En != "" ? n.Title.En : n.Title.Bg,
                english && n.Summary.En != "" ? n.Summary.En : n.Summary.Bg,
                english && n.Body.En != "" ? n.Body.En : n.Body.Bg,
                n.Link))
            .FirstOrDefaultAsync(cancellationToken);

        return story is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(story);
    }
}
