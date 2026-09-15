using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.News;

public sealed class NewsItem
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    /// <summary>Public identifier used in URLs: /news/nov-singal-2026</summary>
    public required string Slug { get; set; }

    /// <summary>
    /// The date on the story and the order of the list. Georgi sets it, so an
    /// old story can be back-dated and a story dated tomorrow appears tomorrow.
    /// </summary>
    public required DateTimeOffset PublishedAt { get; set; }

    public required Localized Title { get; set; }

    /// <summary>One or two sentences for the list; the body is for the page.</summary>
    public required Localized Summary { get; set; }

    public required Localized Body { get; set; }

    /// <summary>Where the story continues: a video, an interview, a ticket page.</summary>
    public string? Link { get; set; }

    public bool IsPublished { get; set; }

    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset? UpdatedUtc { get; set; }
}
