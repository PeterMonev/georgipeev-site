using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// Routes for the concerts feature. Program.cs calls MapConcertEndpoints and
/// stays a table of contents instead of growing into a list of every route in
/// the application.
/// </summary>
internal static class ConcertEndpoints
{
    internal static IEndpointRouteBuilder MapConcertEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/concerts").WithTags("Concerts");

        group.MapGet("/", GetUpcomingAsync)
            .WithName("GetUpcomingConcerts")
            .WithSummary("Published concerts that have not happened yet, soonest first.");

        return routes;
    }

    /// <summary>
    /// The returned type is Ok&lt;List&lt;T&gt;&gt; rather than IResult on purpose: it makes the
    /// method callable from a unit test without spinning up HTTP, and it lets
    /// OpenAPI describe the response without us writing it out by hand.
    /// </summary>
    private static async Task<Ok<List<ConcertListItem>>> GetUpcomingAsync(
        AppDbContext db,
        TimeProvider clock,
        string? lang,
        CancellationToken cancellationToken)
    {
        var english = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);
        var now = clock.GetUtcNow();

        var concerts = await db.Concerts
            // Read-only query: skipping the change tracker avoids building a
            // graph of entities nobody is going to modify.
            .AsNoTracking()
            .Where(c => c.IsPublished && c.StartsAt >= now)
            .OrderBy(c => c.StartsAt)
            // Projecting into the DTO inside the query means SQL selects only
            // these columns. Mapping after ToListAsync would fetch every one.
            .Select(c => new ConcertListItem(
                c.Slug,
                c.StartsAt,
                english ? c.Venue.En : c.Venue.Bg,
                english ? c.City.En : c.City.Bg,
                english ? c.Note.En : c.Note.Bg,
                c.TicketUrl))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(concerts);
    }
}
