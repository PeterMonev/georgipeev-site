using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace GeorgiPeev.Web.Features.Auth;

internal static class AuthEndpoints
{
    internal static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/login", LoginAsync)
            .WithName("Login");

        group.MapPost("/logout", LogoutAsync)
            .WithName("Logout")
            .RequireAuthorization();

        group.MapPost("/change-password", ChangePasswordAsync)
            .WithName("ChangePassword")
            .RequireAuthorization();

        group.MapGet("/me", Me)
            .WithName("CurrentUser")
            .RequireAuthorization();

        return routes;
    }

    /// <summary>
    /// Both failure paths return the same 401 with no body. Saying "no such
    /// user" versus "wrong password" would let anyone confirm which emails
    /// have accounts — that is a gift to an attacker, not a courtesy to a user.
    /// </summary>
    private static async Task<Results<Ok<CurrentUser>, UnauthorizedHttpResult>> LoginAsync(
        LoginRequest request,
        UserManager<AppUser> users,
        SignInManager<AppUser> signIn)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return TypedResults.Unauthorized();
        }

        // lockoutOnFailure: after five wrong passwords the account locks for a
        // while. Identity counts and enforces it; we only have to ask.
        var result = await signIn.PasswordSignInAsync(
            user, request.Password, isPersistent: true, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(new CurrentUser(user.Email ?? request.Email));
    }

    private static async Task<NoContent> LogoutAsync(SignInManager<AppUser> signIn)
    {
        await signIn.SignOutAsync();
        return TypedResults.NoContent();
    }

    /// <summary>
    /// Identity does the real work: it checks the current password, runs the
    /// new one through the same rules as at sign-up, hashes and stores it.
    /// We only translate its answer into HTTP.
    /// </summary>
    private static async Task<Results<NoContent, ValidationProblem, UnauthorizedHttpResult>> ChangePasswordAsync(
        ChangePasswordRequest request,
        ClaimsPrincipal principal,
        UserManager<AppUser> users,
        SignInManager<AppUser> signIn)
    {
        var user = await users.GetUserAsync(principal);
        if (user is null)
        {
            // A valid cookie for an account that no longer exists.
            return TypedResults.Unauthorized();
        }

        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            // Identity reports errors by code. One of them is about the current
            // password; every other one is about the new one. The browser shows
            // each message under the field it belongs to.
            var errors = result.Errors
                .GroupBy(e => e.Code == nameof(IdentityErrorDescriber.PasswordMismatch)
                    ? "currentPassword"
                    : "newPassword")
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            return TypedResults.ValidationProblem(errors);
        }

        // Changing a password rotates the account's security stamp. The cookie
        // carries the old stamp, and Identity re-checks it every 30 minutes —
        // without a fresh cookie the user would be signed out mid-session.
        await signIn.RefreshSignInAsync(user);

        return TypedResults.NoContent();
    }

    /// <summary>
    /// The framework has already checked the cookie by the time this runs —
    /// RequireAuthorization above rejects anonymous callers with 401 before the
    /// method is ever entered. The principal is the decoded cookie.
    /// </summary>
    private static Ok<CurrentUser> Me(ClaimsPrincipal principal)
    {
        return TypedResults.Ok(new CurrentUser(principal.Identity?.Name ?? ""));
    }
}
