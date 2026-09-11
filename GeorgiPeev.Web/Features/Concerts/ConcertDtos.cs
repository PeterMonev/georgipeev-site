using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// What the public site receives for one concert in a list.
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

/// <summary>
/// What one concert's own page receives. Carries the description, which the
/// list deliberately omits: sending a paragraph of prose for every row in a
/// list of forty concerts would be waste on every page load.
/// </summary>
public sealed record ConcertDetail(
    string Slug,
    DateTimeOffset StartsAt,
    string Venue,
    string City,
    string Note,
    string Description,
    string? TicketUrl);

/// <summary>
/// One row in the admin table. Bulgarian only and no description: the table
/// is for finding a concert, the edit form is for reading it.
/// </summary>
public sealed record ConcertAdminListItem(
    Guid Id,
    string Slug,
    DateTimeOffset StartsAt,
    string Venue,
    string City,
    bool IsPublished);

/// <summary>
/// Everything the edit form needs, both languages, plus the row version it
/// must send back so the server can tell whether someone else saved first.
/// </summary>
public sealed record ConcertAdminDetail(
    Guid Id,
    string Slug,
    DateTimeOffset StartsAt,
    Localized Venue,
    Localized City,
    Localized Note,
    Localized Description,
    string? TicketUrl,
    bool IsPublished,
    uint Version);
