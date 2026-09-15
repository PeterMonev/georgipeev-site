using System.ComponentModel.DataAnnotations;
using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.News;

/// <summary>What the admin form sends, for both create and update.</summary>
public sealed record NewsInput(
    [property: Required(ErrorMessage = "Required")]
    [property: MaxLength(120, ErrorMessage = "TooLong")]
    [property: RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$", ErrorMessage = "InvalidSlug")]
    string Slug,
    DateTimeOffset PublishedAt,
    [property: LocalizedText(200, RequireBg = true)] Localized Title,
    [property: LocalizedText(400, RequireBg = true)] Localized Summary,
    [property: LocalizedText(8000)] Localized Body,
    [property: Url(ErrorMessage = "InvalidUrl")]
    [property: MaxLength(400, ErrorMessage = "TooLong")]
    string? Link,
    bool IsPublished,
    uint Version);
