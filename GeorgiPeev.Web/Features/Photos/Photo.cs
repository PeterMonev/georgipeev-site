using GeorgiPeev.Web.Common;

namespace GeorgiPeev.Web.Features.Photos;

public sealed class Photo
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    /// <summary>
    /// What a screen reader says and what Google indexes. Empty is allowed:
    /// a decorative picture is better with no alt than with a wrong one.
    /// </summary>
    public required Localized Alt { get; set; }

    /// <summary>Pixels of the largest variant, so the browser can reserve space before loading.</summary>
    public int Width { get; set; }
    public int Height { get; set; }

    /// <summary>
    /// Where the eye should land, 0..1 from the top-left. Every crop — the
    /// square in the grid, the wide strip on a page — is centred on this
    /// point, so a face never ends up cut off. Defaults to the upper middle,
    /// where faces usually are.
    /// </summary>
    public double FocusX { get; set; } = 0.5;
    public double FocusY { get; set; } = 0.3;

    /// <summary>Georgi's order in the gallery; lower comes first.</summary>
    public int SortOrder { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTimeOffset CreatedUtc { get; set; }
}
