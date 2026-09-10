using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.Concerts;

public sealed class Concert
{
    /// <summary>
    /// Version 7 GUIDs carry a timestamp in their leading bits, so new rows land
    /// at the end of the primary-key index instead of scattering across it the
    /// way random v4 GUIDs do. Generated here rather than by the database, so an
    /// id exists before the row is ever saved.
    /// </summary>
    public Guid Id { get; init; } = Guid.CreateVersion7();

    /// <summary>Public identifier used in URLs: /koncerti/2026-10-12-burgas</summary>
    public required string Slug { get; set; }

    /// <summary>
    /// The instant the show starts, stored as timestamptz. Displayed in
    /// Europe/Sofia. An instant is the right model here because every show is
    /// in one place; an event series across time zones would need the local
    /// wall clock plus an IANA zone instead.
    /// </summary>
    public required DateTimeOffset StartsAt { get; set; }

    public required Localized Venue { get; set; }
    public required Localized City { get; set; }

    /// <summary>The small line under the venue: "Solo show", "with the orchestra".</summary>
    public required Localized Note { get; set; }

    public required Localized Description { get; set; }

    public string? TicketUrl { get; set; }

    /// <summary>Georgi can save a draft and publish it when he is ready.</summary>
    public bool IsPublished { get; set; }

    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset? UpdatedUtc { get; set; }

}
