var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

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