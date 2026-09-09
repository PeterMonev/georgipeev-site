using GeorgiPeev.Web.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Fail loudly and early. A missing connection string surfaces here, as one
// readable sentence, instead of thirty frames deep inside Npgsql with an empty
// server name and no hint about where the value was supposed to come from.
var connectionString = builder.Configuration.GetConnectionString("Db")
    ?? throw new InvalidOperationException(
        "Connection string 'Db' was not found. Locally it comes from User Secrets " +
        "(right-click the project -> Manage User Secrets). On a server it comes " +
        "from the ConnectionStrings__Db environment variable. Note that User " +
        "Secrets are only loaded when ASPNETCORE_ENVIRONMENT is Development.");

builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());
// Injected instead of calling DateTimeOffset.UtcNow anywhere. Tests replace it
// with a fake clock; production code never notices the difference.
builder.Services.AddSingleton(TimeProvider.System);

// Build() seals the container. Nothing added to builder.Services after this
// line is ever seen again.
var app = builder.Build();

// ---- pipeline and endpoints: everything below works on the built app ----

// Liveness probe. Render and netcup poll this every few seconds.
app.MapGet("/healthz", () => Results.Ok(new { status = "ok", utc = DateTime.UtcNow }));

// Use UseStaticFiles, NOT MapStaticAssets.
// MapStaticAssets reads a manifest built at C# compile time. Vite's output is
// written after that, so it never appears in the manifest and every asset 404s.
app.UseStaticFiles();

app.MapGet("/api/ping", () => Results.Ok(new { pong = true }));

// Anything that is not a file and not an API route returns index.html.
// From there the React router decides which page to render.
app.MapFallbackToFile("index.html");

app.Run();
