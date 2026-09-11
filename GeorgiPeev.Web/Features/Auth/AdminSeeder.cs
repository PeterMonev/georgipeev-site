using Microsoft.AspNetCore.Identity;

namespace GeorgiPeev.Web.Features.Auth;

/// <summary>
/// Creates the admin accounts listed in configuration, skipping any that
/// already exist. The passwords are used exactly once — to hash them into the
/// database — and mean nothing afterwards; changing one in configuration does
/// not change the account.
///
/// Development only. In production the values arrive as environment variables
/// set by a person, and the seeder runs once during the first deployment.
/// Nothing here is ever committed: the configuration keys live in User Secrets
/// locally and in the hosting panel on the server.
/// </summary>
internal static class AdminSeeder
{
    public static async Task EnsureAdminsAsync(IServiceProvider services, IConfiguration configuration)
    {
        // Read each "Admins" entry by hand rather than binding to a type: it is
        // two strings, and the explicit form cannot silently fail to bind.
        var accounts = configuration.GetSection("Admins").GetChildren()
            .Select(entry => (Email: entry["Email"], Password: entry["Password"]))
            .Where(a => !string.IsNullOrWhiteSpace(a.Email) && !string.IsNullOrWhiteSpace(a.Password))
            .ToList();

        if (accounts.Count == 0)
        {
            return;
        }

        using var scope = services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        foreach (var (email, password) in accounts)
        {
            if (await users.FindByEmailAsync(email!) is not null)
            {
                continue;
            }

            var user = new AppUser { UserName = email, Email = email, EmailConfirmed = true };
            var result = await users.CreateAsync(user, password!);

            if (!result.Succeeded)
            {
                var reasons = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException(
                    $"Could not create the admin account for {email}: {reasons}");
            }
        }
    }
}
