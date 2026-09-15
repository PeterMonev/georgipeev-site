using System.Net;
using System.Net.Http.Json;
using GeorgiPeev.Web.Common;
using GeorgiPeev.Web.Features.News;
using GeorgiPeev.Web.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;

namespace GeorgiPeev.Web.Tests.News;

[Collection(SharedApp.Name)]
public sealed class NewsAdminEndpointsTests(TestApp app)
{
    private const string Base = "/api/admin/news";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Anonymous_requests_are_rejected()
    {
        var client = app.CreateClient();

        var response = await client.GetAsync(Base, Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_created_story_can_be_read_back_unchanged()
    {
        var client = await app.SignedInClientAsync();
        var input = NewStory();

        var response = await client.PostAsJsonAsync(Base, input, Cancel);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<NewsAdminDetail>(Cancel);
        Assert.NotNull(created);
        Assert.Equal($"{Base}/{created.Id}", response.Headers.Location?.PathAndQuery);
        Assert.NotEqual(0u, created.Version);

        var fetched = await client.GetFromJsonAsync<NewsAdminDetail>($"{Base}/{created.Id}", Cancel);
        Assert.Equal(created, fetched);
    }

    [Fact]
    public async Task Invalid_input_is_answered_with_a_code_per_field()
    {
        var client = await app.SignedInClientAsync();
        var input = NewStory() with
        {
            Slug = "Not A Slug",
            Title = new Localized("", "Title"),
            Link = "not a url",
        };

        var response = await client.PostAsJsonAsync(Base, input, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(Cancel);
        Assert.NotNull(problem);
        Assert.Equal("InvalidSlug", Assert.Single(problem.Errors["Slug"]));
        Assert.Equal("BgRequired", Assert.Single(problem.Errors["Title"]));
        Assert.Equal("InvalidUrl", Assert.Single(problem.Errors["Link"]));
    }

    [Fact]
    public async Task A_slug_already_in_use_is_reported_as_taken()
    {
        var client = await app.SignedInClientAsync();
        var input = NewStory();
        await CreateAsync(client, input);

        var response = await client.PostAsJsonAsync(Base, input, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(Cancel);
        Assert.NotNull(problem);
        Assert.Equal("Taken", Assert.Single(problem.Errors["Slug"]));
    }

    [Fact]
    public async Task Saving_over_a_newer_version_conflicts()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewStory());

        var stale = ToInput(created) with { Version = created.Version - 1 };
        var conflict = await client.PutAsJsonAsync($"{Base}/{created.Id}", stale, Cancel);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);

        var current = ToInput(created) with { Summary = new Localized("Ново кратко", "") };
        var ok = await client.PutAsJsonAsync($"{Base}/{created.Id}", current, Cancel);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var updated = await ok.Content.ReadFromJsonAsync<NewsAdminDetail>(Cancel);
        Assert.NotNull(updated);
        Assert.True(updated.Version > created.Version);
        Assert.Equal("Ново кратко", updated.Summary.Bg);
    }

    [Fact]
    public async Task A_published_story_with_a_past_date_is_on_the_public_site()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewStory() with
        {
            PublishedAt = new DateTimeOffset(2020, 1, 1, 0, 0, 0, TimeSpan.Zero),
            Title = new Localized("Стара новина", ""),
            IsPublished = true,
        });

        var stories = await client.GetFromJsonAsync<List<NewsListItem>>("/api/news?lang=en", Cancel);

        Assert.NotNull(stories);
        var item = Assert.Single(stories, s => s.Slug == created.Slug);
        // English left empty: the Bulgarian title stands in for it.
        Assert.Equal("Стара новина", item.Title);
    }

    [Fact]
    public async Task A_story_dated_in_the_future_is_not_public_yet()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewStory() with
        {
            PublishedAt = new DateTimeOffset(2099, 1, 1, 0, 0, 0, TimeSpan.Zero),
            IsPublished = true,
        });

        var stories = await client.GetFromJsonAsync<List<NewsListItem>>("/api/news", Cancel);
        var page = await client.GetAsync($"/api/news/{created.Slug}", Cancel);

        Assert.NotNull(stories);
        Assert.DoesNotContain(stories, s => s.Slug == created.Slug);
        // Not even by direct link: the day has not come.
        Assert.Equal(HttpStatusCode.NotFound, page.StatusCode);
    }

    [Fact]
    public async Task Drafts_stay_off_the_public_site()
    {
        var client = await app.SignedInClientAsync();
        var draft = await CreateAsync(client, NewStory() with
        {
            PublishedAt = new DateTimeOffset(2020, 1, 1, 0, 0, 0, TimeSpan.Zero),
            IsPublished = false,
        });

        var stories = await client.GetFromJsonAsync<List<NewsListItem>>("/api/news", Cancel);

        Assert.NotNull(stories);
        Assert.DoesNotContain(stories, s => s.Slug == draft.Slug);
    }

    [Fact]
    public async Task Deleting_twice_reports_not_found_the_second_time()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewStory());

        var first = await client.DeleteAsync($"{Base}/{created.Id}", Cancel);
        var second = await client.DeleteAsync($"{Base}/{created.Id}", Cancel);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
    }

    /// <summary>A valid story with a slug no other test will ever produce.</summary>
    private static NewsInput NewStory() => new(
        Slug: $"test-{Guid.NewGuid():N}",
        PublishedAt: new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero),
        Title: new Localized("Заглавие", "Title"),
        Summary: new Localized("Кратко", "Summary"),
        Body: new Localized("", ""),
        Link: null,
        IsPublished: true,
        Version: 0);

    private static NewsInput ToInput(NewsAdminDetail n) => new(
        n.Slug, n.PublishedAt, n.Title, n.Summary, n.Body, n.Link, n.IsPublished, n.Version);

    private static async Task<NewsAdminDetail> CreateAsync(HttpClient client, NewsInput input)
    {
        var response = await client.PostAsJsonAsync(Base, input, Cancel);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<NewsAdminDetail>(Cancel);
        Assert.NotNull(created);
        return created;
    }
}
