using System.Net.Http.Json;
using GeorgiPeev.Web.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace GeorgiPeev.Web.Tests.Infrastructure;

/// <summary>
/// The whole site, started once per test class against a throwaway Postgres
/// running in Docker. Tests talk to it over HTTP exactly as the browser does,
/// so a passing test means the cookie, the validation, the SQL and the JSON
/// all agreed — not that four separate mocks did.
/// </summary>
public sealed class TestApp : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdminEmail = "test@admin.local";
    public const string AdminPassword = "Test-Password-123!";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public TestApp()
    {
        // The auth cookie is marked Secure, and a cookie jar refuses to send
        // such a cookie over http. The in-memory server never touches TLS, so
        // pretending to be https costs nothing and makes sign-in work.
        ClientOptions.BaseAddress = new Uri("https://localhost");
    }

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        // The app seeds the admin account on start-up and needs the Identity
        // tables for that, so the schema goes in before the app is built.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .UseSnakeCaseNamingConvention()
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Same code path as F5: Development means the seeder runs. The values
        // below are configuration, exactly like User Secrets would be.
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Db", _postgres.GetConnectionString());
        builder.UseSetting("Admins:0:Email", AdminEmail);
        builder.UseSetting("Admins:0:Password", AdminPassword);
    }

    /// <summary>A client that has already signed in and carries the cookie.</summary>
    public async Task<HttpClient> SignedInClientAsync()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email = AdminEmail, password = AdminPassword },
            TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return client;
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}
