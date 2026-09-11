using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// Everything the admin does to concerts. A separate group from the public
/// routes so that one RequireAuthorization covers all of it — there is no way
/// to add an admin route here and forget to protect it.
/// </summary>
internal static class ConcertAdminEndpoints
{
    internal static IEndpointRouteBuilder MapConcertAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/concerts")
            .WithTags("Concerts (admin)")
            .RequireAuthorization();

        group.MapGet("/", ListAsync)
            .WithName("ListAdminConcerts");

        group.MapGet("/{id:guid}", GetAsync)
            .WithName("GetAdminConcert");

        group.MapPost("/", CreateAsync)
            .WithName("CreateConcert");

        group.MapPut("/{id:guid}", UpdateAsync)
            .WithName("UpdateConcert");

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteConcert");

        return routes;
    }

    /// <summary>Every concert, drafts included, newest first — the admin's view.</summary>
    private static async Task<Ok<List<ConcertAdminListItem>>> ListAsync(
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var concerts = await db.Concerts
            .AsNoTracking()
            .OrderByDescending(c => c.StartsAt)
            .Select(c => new ConcertAdminListItem(
                c.Id, c.Slug, c.StartsAt, c.Venue.Bg, c.City.Bg, c.IsPublished))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(concerts);
    }

    private static async Task<Results<Ok<ConcertAdminDetail>, NotFound>> GetAsync(
        Guid id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var concert = await db.Concerts
            .AsNoTracking()
            .Where(c => c.Id == id)
            // xmin is a shadow property: it exists in the model but not on the
            // class, so EF.Property is the only way to name it in a query.
            .Select(c => new ConcertAdminDetail(
                c.Id, c.Slug, c.StartsAt, c.Venue, c.City, c.Note, c.Description,
                c.TicketUrl, c.IsPublished, EF.Property<uint>(c, "xmin")))
            .FirstOrDefaultAsync(cancellationToken);

        return concert is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(concert);
    }

    private static async Task<Results<CreatedAtRoute<ConcertAdminDetail>, ValidationProblem>> CreateAsync(
        ConcertInput input,
        AppDbContext db,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        // The required members are set here and again in Apply. The compiler
        // insists on the first; the second keeps create and update identical.
        var concert = new Concert
        {
            Slug = input.Slug,
            StartsAt = input.StartsAt,
            Venue = input.Venue,
            City = input.City,
            Note = input.Note,
            Description = input.Description,
            CreatedUtc = clock.GetUtcNow(),
        };
        Apply(concert, input);

        db.Concerts.Add(concert);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException e) when (IsUniqueViolation(e))
        {
            return SlugTaken();
        }

        // 201 with a Location header pointing at the new resource, and the
        // resource itself in the body so the form has its id and version.
        return TypedResults.CreatedAtRoute(
            ToDetail(db, concert), "GetAdminConcert", new { id = concert.Id });
    }

    /// <summary>
    /// Optimistic concurrency: the client sends back the version it loaded.
    /// EF puts that into the WHERE clause of the UPDATE; if someone saved in
    /// between, zero rows match and the save fails instead of overwriting.
    /// </summary>
    private static async Task<Results<Ok<ConcertAdminDetail>, NotFound, Conflict, ValidationProblem>> UpdateAsync(
        Guid id,
        ConcertInput input,
        AppDbContext db,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        var concert = await db.Concerts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (concert is null)
        {
            return TypedResults.NotFound();
        }

        // "The row looked like this when I read it." EF compares against this
        // value, not against whatever the database holds right now.
        db.Entry(concert).Property<uint>("xmin").OriginalValue = input.Version;

        Apply(concert, input);
        concert.UpdatedUtc = clock.GetUtcNow();

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Conflict();
        }
        catch (DbUpdateException e) when (IsUniqueViolation(e))
        {
            return SlugTaken();
        }

        return TypedResults.Ok(ToDetail(db, concert));
    }

    private static async Task<Results<NoContent, NotFound>> DeleteAsync(
        Guid id,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        // One DELETE statement, no entity loaded first. The row count says
        // whether there was anything to delete.
        var deleted = await db.Concerts
            .Where(c => c.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0
            ? TypedResults.NotFound()
            : TypedResults.NoContent();
    }

    /// <summary>The fields the form owns. Id, timestamps and version are not among them.</summary>
    private static void Apply(Concert concert, ConcertInput input)
    {
        concert.Slug = input.Slug;
        // timestamptz stores an instant, not an offset. Npgsql refuses any
        // offset but zero so nobody can imagine "+03:00" survived the trip.
        concert.StartsAt = input.StartsAt.ToUniversalTime();
        concert.Venue = input.Venue;
        concert.City = input.City;
        concert.Note = input.Note;
        concert.Description = input.Description;
        // An empty box in the form means "no link", and null is how the
        // database says that.
        concert.TicketUrl = string.IsNullOrWhiteSpace(input.TicketUrl) ? null : input.TicketUrl;
        concert.IsPublished = input.IsPublished;
    }

    /// <summary>
    /// After SaveChanges the database has told EF the row's new xmin, and the
    /// form needs it for its next save.
    /// </summary>
    private static ConcertAdminDetail ToDetail(AppDbContext db, Concert c) => new(
        c.Id, c.Slug, c.StartsAt, c.Venue, c.City, c.Note, c.Description,
        c.TicketUrl, c.IsPublished, db.Entry(c).Property<uint>("xmin").CurrentValue);

    /// <summary>
    /// The unique index on slug is the one rule only the database can enforce:
    /// two requests can pass every check and still collide. So there is no
    /// check-then-insert here — we insert, and translate the one failure we
    /// expect into the same 400 the validator would have produced.
    /// </summary>
    private static bool IsUniqueViolation(DbUpdateException e) =>
        e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    private static ValidationProblem SlugTaken() =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            [nameof(ConcertInput.Slug)] = ["Taken"],
        });
}
