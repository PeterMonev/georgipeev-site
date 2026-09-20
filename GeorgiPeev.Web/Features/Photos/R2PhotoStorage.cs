using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace GeorgiPeev.Web.Features.Photos;

/// <summary>
/// Cloudflare R2, through the S3 API it speaks. The production implementation:
/// the files outlive any one server, and browsers fetch them from Cloudflare's
/// edge, never from us.
/// </summary>
internal sealed class R2PhotoStorage : IPhotoStorage, IDisposable
{
    private readonly AmazonS3Client _client;
    private readonly string _bucket;
    private readonly string _publicBaseUrl;

    public R2PhotoStorage(IOptions<PhotoOptions> options)
    {
        // ValidateOnStart in Program.cs has already refused to boot without
        // these; the throw here is for the type system, not for runtime.
        var r2 = options.Value.R2 ?? throw new InvalidOperationException("Photos:R2 is not configured.");

        _bucket = r2.Bucket;
        _publicBaseUrl = r2.PublicBaseUrl.TrimEnd('/');
        _client = new AmazonS3Client(
            new BasicAWSCredentials(r2.AccessKey, r2.SecretKey),
            new AmazonS3Config
            {
                ServiceURL = r2.Endpoint,
                // R2 has one region called "auto" and addresses buckets by path,
                // not by subdomain. Both differ from Amazon's defaults.
                AuthenticationRegion = "auto",
                ForcePathStyle = true,
                // The SDK's newer integrity checksums are not understood by R2;
                // "when required" keeps them off unless an operation demands one.
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            });
    }

    public async Task SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken)
    {
        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            // Each file is fetched for a year from the browser cache; keys never change.
            Headers = { CacheControl = "public,max-age=31536000,immutable" },
            // Chunked uploads need a signing scheme R2 does not support.
            UseChunkEncoding = false,
        }, cancellationToken);
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        // S3 semantics: deleting a key that is not there succeeds. Same as File.Delete.
        await _client.DeleteObjectAsync(_bucket, key, cancellationToken);
    }

    public string UrlFor(string key) => $"{_publicBaseUrl}/{key}";

    public void Dispose() => _client.Dispose();
}
