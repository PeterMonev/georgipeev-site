using System.ComponentModel.DataAnnotations;
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

/// <summary>
/// What the edit form may change. Size and files are fixed at upload.
/// Spelled RangeAttribute in full because System.Range — the `1..3` type —
/// is in scope through implicit usings and wins the name.
/// </summary>
public sealed record PhotoUpdate(
    [property: LocalizedText(300)] Localized Alt,
    [property: RangeAttribute(0, 1, ErrorMessage = "OutOfRange")] double FocusX,
    [property: RangeAttribute(0, 1, ErrorMessage = "OutOfRange")] double FocusY,
    bool IsPublished);
