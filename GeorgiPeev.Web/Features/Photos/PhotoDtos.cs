using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.Photos;

/// <summary>The three variants, ready for srcset. Built from keys at request time, never stored.</summary>
public sealed record PhotoUrls(string Small, string Medium, string Large);

public sealed record PhotoAdminItem(
    Guid Id,
    Localized Alt,
    int Width,
    int Height,
    double FocusX,
    double FocusY,
    int SortOrder,
    bool IsPublished,
    PhotoUrls Urls);
