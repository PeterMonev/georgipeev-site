using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.News;

/// <summary>One story in the public list: enough to decide whether to open it.</summary>
public sealed record NewsListItem(
    string Slug,
    DateTimeOffset PublishedAt,
    string Title,
    string Summary,
    string? Link);

/// <summary>The story's own page: the list fields plus the body.</summary>
public sealed record NewsDetail(
    string Slug,
    DateTimeOffset PublishedAt,
    string Title,
    string Summary,
    string Body,
    string? Link);

/// <summary>One row in the admin table.</summary>
public sealed record NewsAdminListItem(
    Guid Id,
    string Slug,
    DateTimeOffset PublishedAt,
    string Title,
    bool IsPublished);

/// <summary>Everything the edit form needs, both languages, plus the row version.</summary>
public sealed record NewsAdminDetail(
    Guid Id,
    string Slug,
    DateTimeOffset PublishedAt,
    Localized Title,
    Localized Summary,
    Localized Body,
    string? Link,
    bool IsPublished,
    uint Version);
