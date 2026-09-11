using System.ComponentModel.DataAnnotations;
using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.Concerts;

/// <summary>
/// What the admin form sends, for both create and update. Not the entity: the
/// entity has an id, timestamps and a row version the client must not set.
///
/// Every ErrorMessage is a code, not a sentence — the browser translates.
/// </summary>
public sealed record ConcertInput(
    [property: Required(ErrorMessage = "Required")]
    [property: MaxLength(120, ErrorMessage = "TooLong")]
    [property: RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$", ErrorMessage = "InvalidSlug")]
    string Slug,
    DateTimeOffset StartsAt,
    [property: LocalizedText(200, RequireBg = true)] Localized Venue,
    [property: LocalizedText(120, RequireBg = true)] Localized City,
    [property: LocalizedText(200)] Localized Note,
    [property: LocalizedText(2000)] Localized Description,
    [property: Url(ErrorMessage = "InvalidUrl")]
    [property: MaxLength(400, ErrorMessage = "TooLong")]
    string? TicketUrl,
    bool IsPublished,
    /// <summary>
    /// The row version the form was loaded with; 0 for a new concert. On
    /// update the server refuses to save over a newer version.
    /// </summary>
    uint Version);
