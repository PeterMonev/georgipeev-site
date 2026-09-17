namespace GeorgiPeev.Web.Features.Photos;

/// <summary>
/// Where the picture files live. The site only ever talks to this: it saves
/// bytes under a key, deletes by key, and asks for the public URL of a key.
///
/// Two implementations, and that is the whole reason it is an interface: a
/// folder on disk while developing, Cloudflare R2 in production. The
/// database stores keys, never URLs — the storage can move and every row
/// stays valid.
/// </summary>
public interface IPhotoStorage
{
    /// <summary>Stores the bytes under <paramref name="key"/>, replacing any earlier file.</summary>
    Task SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken);

    /// <summary>Removes the file; a key that does not exist is not an error.</summary>
    Task DeleteAsync(string key, CancellationToken cancellationToken);

    /// <summary>The address a browser loads the file from.</summary>
    string UrlFor(string key);
}
