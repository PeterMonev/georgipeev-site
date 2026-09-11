using GeorgiPeev.Web.Data;
using GeorgiPeev.Web.Features.Auth;
using GeorgiPeev.Web.Features.Concerts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---- services: everything registered here must come before Build() ----

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

// IdentityCore rather than the full AddIdentity: no Razor login pages, no
// default UI. We expose sign-in as JSON endpoints and the React app owns the form.
builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 12;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "gp.auth";
    // HttpOnly: JavaScript cannot read the cookie, so a script injected into the
    // page cannot steal the session. This is the whole argument for cookies over
    // tokens in a same-origin app.
    options.Cookie.HttpOnly = true;
    // Strict: the browser only sends the cookie on requests that start from our
    // own site. A form on another site posting to /api/admin gets no cookie at all.
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;

    // An API answers 401 and 403. Redirecting a JSON client to an HTML login
    // page is the default, and it is wrong for us.
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

// Minimal APIs validate request bodies against their DataAnnotations and
// answer 400 in the Problem Details format before a handler ever runs.
builder.Services.AddValidation();

// Make C#'s nullability real at the JSON boundary: a null where the type says
// non-null, or a missing required field, is rejected on the way in instead of
// becoming a NullReferenceException somewhere deep inside.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.RespectNullableAnnotations = true;
    options.SerializerOptions.RespectRequiredConstructorParameters = true;
});

// Build() seals the container. Nothing added to builder.Services after this
// line is ever seen again.
var app = builder.Build();

// ---- pipeline and endpoints: everything below works on the built app ----

if (app.Environment.IsDevelopment())
{
    await AdminSeeder.EnsureAdminsAsync(app.Services, app.Configuration);
}

// Liveness probe. Render and netcup poll this every few seconds.
// Takes the clock from the container like everything else — a rule that holds
// only in most places is not a rule.
app.MapGet("/healthz", (TimeProvider clock) =>
    Results.Ok(new { status = "ok", utc = clock.GetUtcNow() }));

// Use UseStaticFiles, NOT MapStaticAssets.
// MapStaticAssets reads a manifest built at C# compile time. Vite's output is
// written after that, so it never appears in the manifest and every asset 404s.
app.UseStaticFiles();

// Order matters: authentication decodes the cookie into a principal,
// authorization then checks it against RequireAuthorization on each endpoint.
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapConcertEndpoints();
app.MapConcertAdminEndpoints();

// Anything that is not a file and not an API route returns index.html.
// From there the React router decides which page to render.
app.MapFallbackToFile("index.html");

await app.RunAsync();
