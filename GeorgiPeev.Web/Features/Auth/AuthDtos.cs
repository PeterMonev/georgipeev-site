namespace GeorgiPeev.Web.Features.Auth;

public sealed record LoginRequest(string Email, string Password);

/// <summary>What the browser learns about who is signed in. Nothing sensitive.</summary>
public sealed record CurrentUser(string Email);
