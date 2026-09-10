namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// What the public site receives for one concert.
///
/// Deliberately not the entity. The entity is the storage shape and will change
/// whenever the database does; this is a contract the frontend and the search
/// engines depend on. Returning entities directly means every column rename is
/// a breaking API change, and every field added for internal use leaks out.
/// </summary>
public sealed record ConcertListItem(
    string Slug,
    DateTimeOffset StartsAt,
    string Venue,
    string City,
    string Note,
    string? TicketUrl);
