using System.Net;
using System.Net.Http.Json;
using GeorgiPeev.Web.Common;
using GeorgiPeev.Web.Features.Concerts;
using GeorgiPeev.Web.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;

namespace GeorgiPeev.Web.Tests.Concerts;

/// <summary>
/// Tests never clean up after themselves; instead each one creates concerts
/// with slugs nobody else uses, so they cannot see each other — and the one
/// shared server in the collection never needs resetting.
/// </summary>
[Collection(SharedApp.Name)]
public sealed class ConcertAdminEndpointsTests(TestApp app)
{
    private const string Base = "/api/admin/concerts";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Anonymous_requests_are_rejected()
    {
        var client = app.CreateClient();

        var response = await client.GetAsync(Base, Cancel);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task A_created_concert_can_be_read_back_unchanged()
    {
        var client = await app.SignedInClientAsync();
        var input = NewConcert();

        var response = await client.PostAsJsonAsync(Base, input, Cancel);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ConcertAdminDetail>(Cancel);
        Assert.NotNull(created);
        Assert.Equal($"{Base}/{created.Id}", response.Headers.Location?.PathAndQuery);
        Assert.NotEqual(0u, created.Version);

        // Records compare by value: one line checks every field at once.
        var fetched = await client.GetFromJsonAsync<ConcertAdminDetail>($"{Base}/{created.Id}", Cancel);
        Assert.Equal(created, fetched);
    }

    [Fact]
    public async Task Invalid_input_is_answered_with_a_code_per_field()
    {
        var client = await app.SignedInClientAsync();
        var input = NewConcert() with
        {
            Slug = "",
            City = new Localized("", "Sofia"),
            TicketUrl = "not a url",
        };

        var response = await client.PostAsJsonAsync(Base, input, Cancel);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(Cancel);
        Assert.NotNull(problem);
        Assert.Equal("Required", Assert.Single(problem.Errors["Slug"]));
        Assert.Equal("BgRequired", Assert.Single(problem.Errors["City"]));
        Assert.Equal("InvalidUrl", Assert.Single(problem.Errors["TicketUrl"]));
    }

    [Fact]
    public async Task A_slug_already_in_use_is_reported_as_taken()
    {
        var client = await app.SignedInClientAsync();
        var input = NewConcert();
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
        var created = await CreateAsync(client, NewConcert());

        // Someone else saved in between: our version is one behind.
        var stale = ToInput(created) with { Version = created.Version - 1 };
        var conflict = await client.PutAsJsonAsync($"{Base}/{created.Id}", stale, Cancel);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);

        // With the right version the save goes through and hands back a newer one.
        var current = ToInput(created) with { Note = new Localized("Соло", "") };
        var ok = await client.PutAsJsonAsync($"{Base}/{created.Id}", current, Cancel);
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        var updated = await ok.Content.ReadFromJsonAsync<ConcertAdminDetail>(Cancel);
        Assert.NotNull(updated);
        Assert.True(updated.Version > created.Version);
        Assert.Equal("Соло", updated.Note.Bg);
    }

    [Fact]
    public async Task Empty_english_falls_back_to_bulgarian_on_the_public_site()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewConcert() with
        {
            Venue = new Localized("Летен театър", ""),
            IsPublished = true,
        });

        var upcoming = await client.GetFromJsonAsync<List<ConcertListItem>>("/api/concerts?lang=en", Cancel);

        Assert.NotNull(upcoming);
        var item = Assert.Single(upcoming, c => c.Slug == created.Slug);
        Assert.Equal("Летен театър", item.Venue);
    }

    [Fact]
    public async Task Drafts_stay_off_the_public_site()
    {
        var client = await app.SignedInClientAsync();
        var draft = await CreateAsync(client, NewConcert() with { IsPublished = false });

        var upcoming = await client.GetFromJsonAsync<List<ConcertListItem>>("/api/concerts", Cancel);

        Assert.NotNull(upcoming);
        Assert.DoesNotContain(upcoming, c => c.Slug == draft.Slug);
    }

    [Fact]
    public async Task Deleting_twice_reports_not_found_the_second_time()
    {
        var client = await app.SignedInClientAsync();
        var created = await CreateAsync(client, NewConcert());

        var first = await client.DeleteAsync($"{Base}/{created.Id}", Cancel);
        var second = await client.DeleteAsync($"{Base}/{created.Id}", Cancel);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
    }

    /// <summary>A valid concert with a slug no other test will ever produce.</summary>
    private static ConcertInput NewConcert() => new(
        Slug: $"2030-01-01-test-{Guid.NewGuid():N}",
        StartsAt: new DateTimeOffset(2030, 1, 1, 20, 0, 0, TimeSpan.Zero),
        Venue: new Localized("Зала 1", "Hall 1"),
        City: new Localized("София", "Sofia"),
        Note: new Localized("", ""),
        Description: new Localized("", ""),
        TicketUrl: null,
        IsPublished: true,
        Version: 0);

    private static ConcertInput ToInput(ConcertAdminDetail c) => new(
        c.Slug, c.StartsAt, c.Venue, c.City, c.Note, c.Description,
        c.TicketUrl, c.IsPublished, c.Version);

    private static async Task<ConcertAdminDetail> CreateAsync(HttpClient client, ConcertInput input)
    {
        var response = await client.PostAsJsonAsync(Base, input, Cancel);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<ConcertAdminDetail>(Cancel);
        Assert.NotNull(created);
        return created;
    }
}
