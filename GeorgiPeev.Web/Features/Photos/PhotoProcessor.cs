using SkiaSharp;

namespace GeorgiPeev.Web.Features.Photos;

/// <summary>
/// Turns one upload into the three files the site actually serves. Runs once,
/// at upload time: the visitor never pays for it, and the original is never
/// kept — Georgi has it, and nobody would ever ask the site for 8 MB.
/// </summary>
internal sealed class PhotoProcessor(IPhotoStorage storage)
{
    /// <summary>Longest side of each variant: grid thumbnail, page, lightbox and og:image.</summary>
    public static readonly int[] Sizes = [400, 900, 1600];

    /// <summary>A JPEG bomb can be 100 KB on disk and 20 GB decoded. This is the line.</summary>
    private const long MaxPixels = 50_000_000;

    private const int WebpQuality = 80;

    /// <summary>Mitchell is the classic choice for shrinking photographs: sharp without ringing.</summary>
    private static readonly SKSamplingOptions Sampling = new(SKCubicResampler.Mitchell);

    public static string KeyFor(Guid id, int size) => $"photos/{id:N}/{size}.webp";

    /// <summary>
    /// Validates, resizes and stores. Returns the pixel size of the largest
    /// variant, or a code the browser can translate when the file is refused.
    /// </summary>
    public async Task<ProcessResult> ProcessAsync(Guid id, Stream upload, CancellationToken cancellationToken)
    {
        // The codec reads only the header: format, dimensions, orientation —
        // not a single pixel. That is how a bomb is refused before it goes off.
        using var codec = SKCodec.Create(upload);
        if (codec is null)
        {
            return new ProcessResult.Refused("NotAnImage");
        }

        if ((long)codec.Info.Width * codec.Info.Height > MaxPixels)
        {
            return new ProcessResult.Refused("TooLarge");
        }

        // Decode straight into sRGB. A phone may shoot in Display P3; without
        // this the colours would come out flat once the profile is gone.
        using var decoded = SKBitmap.Decode(codec, codec.Info.WithColorSpace(SKColorSpace.CreateSrgb()));
        if (decoded is null)
        {
            return new ProcessResult.Refused("NotAnImage");
        }

        // Phones store the picture as the sensor saw it and note the rotation
        // in EXIF. Bake the rotation in; the encoder below writes no EXIF at
        // all, so GPS, camera model and timestamps vanish with it.
        using var upright = Upright(decoded, codec.EncodedOrigin);

        var largest = new SKSizeI(upright.Width, upright.Height);

        foreach (var size in Sizes)
        {
            using var variant = Shrink(upright, size);
            using var image = SKImage.FromBitmap(variant);
            using var encoded = image.Encode(SKEncodedImageFormat.Webp, WebpQuality);

            if (size == Sizes[^1])
            {
                largest = new SKSizeI(variant.Width, variant.Height);
            }

            await storage.SaveAsync(KeyFor(id, size), encoded.AsStream(), "image/webp", cancellationToken);
        }

        return new ProcessResult.Stored(largest.Width, largest.Height);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        foreach (var size in Sizes)
        {
            await storage.DeleteAsync(KeyFor(id, size), cancellationToken);
        }
    }

    /// <summary>Fits the longest side into <paramref name="size"/>; never upscales.</summary>
    private static SKBitmap Shrink(SKBitmap source, int size)
    {
        var scale = Math.Min(size / (double)source.Width, size / (double)source.Height);
        if (scale >= 1)
        {
            return source.Copy();
        }

        var width = Math.Max(1, (int)Math.Round(source.Width * scale));
        var height = Math.Max(1, (int)Math.Round(source.Height * scale));
        return source.Resize(new SKSizeI(width, height), Sampling);
    }

    /// <summary>
    /// Only the three rotations a phone produces; the mirrored origins exist
    /// in the EXIF standard but no camera writes them.
    /// </summary>
    private static SKBitmap Upright(SKBitmap source, SKEncodedOrigin origin) => origin switch
    {
        SKEncodedOrigin.RightTop => Rotate(source, 90),
        SKEncodedOrigin.BottomRight => Rotate(source, 180),
        SKEncodedOrigin.LeftBottom => Rotate(source, 270),
        _ => source.Copy(),
    };

    private static SKBitmap Rotate(SKBitmap source, int degrees)
    {
        var swaps = degrees is 90 or 270;
        var rotated = new SKBitmap(swaps ? source.Height : source.Width, swaps ? source.Width : source.Height);

        using var canvas = new SKCanvas(rotated);
        canvas.Translate(rotated.Width / 2f, rotated.Height / 2f);
        canvas.RotateDegrees(degrees);
        canvas.Translate(-source.Width / 2f, -source.Height / 2f);
        // A rotation by a right angle moves whole pixels; nearest keeps them intact.
        canvas.DrawBitmap(source, 0, 0, new SKSamplingOptions(SKFilterMode.Nearest));

        return rotated;
    }
}

/// <summary>
/// Either the variants are stored, or the upload was refused for a reason
/// the browser can show. A C# closed hierarchy: the same idea as the
/// discriminated unions on the TypeScript side.
/// </summary>
internal abstract record ProcessResult
{
    private ProcessResult() { }

    public sealed record Stored(int Width, int Height) : ProcessResult;

    public sealed record Refused(string Code) : ProcessResult;
}
