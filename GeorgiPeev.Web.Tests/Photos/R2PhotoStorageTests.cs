using System.Net;
using GeorgiPeev.Web.Features.Photos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace GeorgiPeev.Web.Tests.Photos;

/// <summary>
/// R2 cannot run in a container, so this talks to the real bucket — and only
/// when the developer's User Secrets hold the keys. Anywhere else (CI, a
/// colleague's machine) it skips rather than fails: a missing credential is
/// not a bug in the code under test.
/// </summary>
public sealed class R2PhotoStorageTests
{
    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_saved_file_is_public_until_it_is_deleted()
    {
        using var storage = LiveStorage();

        // A key nobody else will ever write, under its own prefix so a
        // forgotten one is easy to spot in the bucket.
        var key = $"tests/{Guid.NewGuid():N}.txt";
        var body = "hello from the test suite"u8.ToArray();
        using var http = new HttpClient();

        await storage.SaveAsync(key, new MemoryStream(body), "text/plain", Cancel);
        var fetched = await http.GetAsync(storage.UrlFor(key), Cancel);

        Assert.Equal(HttpStatusCode.OK, fetched.StatusCode);
        Assert.Equal("text/plain", fetched.Content.Headers.ContentType?.MediaType);
        Assert.Equal(body, await fetched.Content.ReadAsByteArrayAsync(Cancel));
        Assert.Contains("immutable", fetched.Headers.CacheControl?.ToString());

        await storage.DeleteAsync(key, Cancel);
        var gone = await http.GetAsync(storage.UrlFor(key), Cancel);

        Assert.Equal(HttpStatusCode.NotFound, gone.StatusCode);
    }

    [Fact]
    public async Task Deleting_a_key_that_does_not_exist_is_not_an_error()
    {
        using var storage = LiveStorage();

        await storage.DeleteAsync($"tests/{Guid.NewGuid():N}.txt", Cancel);
    }

    /// <summary>The real thing, from User Secrets — or a skip.</summary>
    private static R2PhotoStorage LiveStorage()
    {
        var options = new ConfigurationBuilder()
            .AddUserSecrets<Program>()
            .Build()
            .GetSection(PhotoOptions.Section)
            .Get<PhotoOptions>();

        Assert.SkipWhen(options?.R2?.IsComplete != true, "Photos:R2 is not configured in User Secrets.");

        return new R2PhotoStorage(Options.Create(options));
    }
}
