using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Features.News;

internal static class NewsAdminEndpoints
{
    internal static IEndpointRouteBuilder MapNewsAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/news")
            .WithTags("News (admin)")
            .RequireAuthorization();

        group.MapGet("/", ListAsync)
            .WithName("ListAdminNews");

        group.MapGet("/{id:guid}", GetAsync)
            .WithName("GetAdminNewsItem");

        group.MapPost("/", CreateAsync)
            .WithName("CreateNewsItem");

        group.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateNewsItem");

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteNewsItem");

        return routes;
    }

    private static async Task<Ok<List<NewsAdminListItem>>> ListAsync(
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var stories = await db.News
            .AsNoTracking()
            .OrderByDescending(n => n.PublishedAt)
            .Select(n => new NewsAdminListItem(n.Id, n.Slug, n.PublishedAt, n.Title.Bg, n.IsPublished))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(stories);
    }

    private static async Task<Results<Ok<NewsAdminDetail>, NotFound>> GetAsync(
        Guid id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var story = await db.News
            .AsNoTracking()
            .Where(n => n.Id == id)
            .Select(n => new NewsAdminDetail(
                n.Id, n.Slug, n.PublishedAt, n.Title, n.Summary, n.Body,
                n.Link, n.IsPublished, EF.Property<uint>(n, "xmin")))
            .FirstOrDefaultAsync(cancellationToken);

        return story is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(story);
    }

    private static async Task<Results<CreatedAtRoute<NewsAdminDetail>, ValidationProblem>> CreateAsync(
        NewsInput input,
        AppDbContext db,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        var story = new NewsItem
        {
            Slug = input.Slug,
            PublishedAt = input.PublishedAt,
            Title = input.Title,
            Summary = input.Summary,
            Body = input.Body,
            CreatedUtc = clock.GetUtcNow(),
        };
        Apply(story, input);

        db.News.Add(story);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException e) when (e.IsUniqueViolation())
        {
            return SlugConflict.Problem();
        }

        return TypedResults.CreatedAtRoute(
            ToDetail(db, story), "GetAdminNewsItem", new { id = story.Id });
    }

    private static async Task<Results<Ok<NewsAdminDetail>, NotFound, Conflict, ValidationProblem>> UpdateAsync(
        Guid id,
        NewsInput input,
        AppDbContext db,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        var story = await db.News.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (story is null)
        {
            return TypedResults.NotFound();
        }

        db.Entry(story).Property<uint>("xmin").OriginalValue = input.Version;

        Apply(story, input);
        story.UpdatedUtc = clock.GetUtcNow();

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Conflict();
        }
        catch (DbUpdateException e) when (e.IsUniqueViolation())
        {
            return SlugConflict.Problem();
        }

        return TypedResults.Ok(ToDetail(db, story));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteAsync(
        Guid id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var deleted = await db.News
            .Where(n => n.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0
            ? TypedResults.NotFound()
            : TypedResults.NoContent();
    }

    private static void Apply(NewsItem story, NewsInput input)
    {
        story.Slug = input.Slug;
        story.PublishedAt = input.PublishedAt.ToUniversalTime();
        story.Title = input.Title;
        story.Summary = input.Summary;
        story.Body = input.Body;
        story.Link = string.IsNullOrWhiteSpace(input.Link) ? null : input.Link;
        story.IsPublished = input.IsPublished;
    }

    private static NewsAdminDetail ToDetail(AppDbContext db, NewsItem n) => new(
        n.Id, n.Slug, n.PublishedAt, n.Title, n.Summary, n.Body,
        n.Link, n.IsPublished, db.Entry(n).Property<uint>("xmin").CurrentValue);
}
