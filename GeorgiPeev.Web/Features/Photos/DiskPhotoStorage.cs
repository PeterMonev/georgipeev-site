using Microsoft.Extensions.Options;

namespace GeorgiPeev.Web.Features.Photos;

/// <summary>
/// Files in a folder, served by the static file middleware under /media.
/// The development implementation — nothing to sign up for, nothing to
/// configure. Not for production: a second server would not see the files.
/// </summary>
internal sealed class DiskPhotoStorage(IOptions<PhotoOptions> options, IHostEnvironment environment) : IPhotoStorage
{
    /// <summary>A relative DiskRoot is relative to the content root, so it works the same from VS and from `dotnet run`.</summary>
    public string Root { get; } = Path.GetFullPath(options.Value.DiskRoot, environment.ContentRootPath);

    public async Task SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken)
    {
        var path = PathFor(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        await using var file = File.Create(path);
        await content.CopyToAsync(file, cancellationToken);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        File.Delete(PathFor(key));
        return Task.CompletedTask;
    }

    public string UrlFor(string key) => $"/media/{key}";

    /// <summary>
    /// Keys are made by us, never by the client, so "../" cannot appear —
    /// but the check costs nothing and turns a future mistake into an
    /// exception instead of a file written outside the folder.
    /// </summary>
    private string PathFor(string key)
    {
        var path = Path.GetFullPath(key, Root);

        if (!path.StartsWith(Root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        {
            throw new ArgumentException($"Key '{key}' leaves the storage root.", nameof(key));
        }

        return path;
    }
}
