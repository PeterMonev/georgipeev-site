using Microsoft.AspNetCore.Identity;

namespace GeorgiPeev.Web.Features.Auth;

/// <summary>
/// Identity's built-in user with a Guid key, so it matches the rest of the
/// schema. Nothing added yet — the base class already carries email, password
/// hash, lockout and the rest.
/// </summary>
public sealed class AppUser : IdentityUser<Guid>;
