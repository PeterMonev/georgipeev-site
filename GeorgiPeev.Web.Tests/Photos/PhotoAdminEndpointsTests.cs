using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GeorgiPeev.Web.Features.Photos;
using GeorgiPeev.Web.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;
using SkiaSharp;

namespace GeorgiPeev.Web.Tests.Photos;

[Collection(SharedApp.Name)]
public sealed class PhotoAdminEndpointsTests(TestApp app)
{
    private const string Base = "/api/admin/photos";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task An_upload_is_stored_as_three_webp_variants()
    {
        var client = await app.SignedInClientAsync();

        var response = await client.PostAsync(Base, Picture(2000, 1500), Cancel);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var photo = await response.Content.ReadFromJsonAsync<PhotoAdminItem>(Cancel);
        Assert.NotNull(photo);
        // 2000×1500 shrunk to fit 1600 on the long side, aspect ratio kept.
        Assert.Equal((1600, 1200), (photo.Width, photo.Height));

        // The files are really there, served as WebP, and the small one is small.
        var small = await client.GetAsync(photo.Urls.Small, Cancel);
        Assert.Equal(HttpStatusCode.OK, small.StatusCode);
        Assert.Equal("image/webp", small.Content.Headers.ContentType?.MediaType);
        Assert.InRange(small.Content.Headers.ContentLength ?? long.MaxValue, 1, 60_000);
    }

    [Fact]
    public async Task A_small_picture_is_never_upscaled()
    {
        var client = await app.SignedInClientAsync();

        var response = await client.PostAsync(Base, Picture(800, 600), Cancel);

        var photo = await response.Content.ReadFromJsonAsync<PhotoAdminItem>(Cancel);
        Assert.NotNull(photo);
        Assert.Equal((800, 600), (photo.Width, photo.Height));
    }

    [Fact]
    public async Task Something_that_is_not_an_image_is_refused()
    {
        var client = await app.SignedInClientAsync();
        var form = new MultipartFormDataContent
        {
            { new ByteArrayContent("<html>not a picture</html>"u8.ToArray()), "file", "page.jpg" },
        };

        var response = await client.PostAsync(Base, form, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(Cancel);
        Assert.NotNull(problem);
        Assert.Equal("NotAnImage", Assert.Single(problem.Errors["File"]));
    }

    [Fact]
    public async Task Deleting_removes_the_row_and_the_files()
    {
        var client = await app.SignedInClientAsync();
        var created = await client.PostAsync(Base, Picture(400, 400), Cancel);
        var photo = await created.Content.ReadFromJsonAsync<PhotoAdminItem>(Cancel);
        Assert.NotNull(photo);

        var deleted = await client.DeleteAsync($"{Base}/{photo.Id}", Cancel);
        var again = await client.DeleteAsync($"{Base}/{photo.Id}", Cancel);
        var file = await client.GetAsync(photo.Urls.Large, Cancel);

        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, file.StatusCode);
    }

    /// <summary>A real JPEG of the given size, drawn on the spot — no test files to keep in the repo.</summary>
    private static MultipartFormDataContent Picture(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height);
        using var canvas = new SKCanvas(bitmap);
        canvas.Clear(SKColors.DarkOrange);
        using var paint = new SKPaint { Color = SKColors.Navy };
        canvas.DrawCircle(width / 2f, height / 2f, Math.Min(width, height) / 3f, paint);

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 90);

        var content = new ByteArrayContent(data.ToArray());
        content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

        return new MultipartFormDataContent { { content, "file", "picture.jpg" } };
    }
}
