using GeorgiPeev.Web.Features.Auth;
using GeorgiPeev.Web.Features.Concerts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Concert> Concerts => Set<Concert>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity maps its own seven tables first. Our configurations come
        // after, so they can never be silently overridden by the base class.
        base.OnModelCreating(builder);

        // Identity names its tables explicitly (AspNetUsers and so on), and an
        // explicit name is never touched by the naming convention. Override
        // them here so the schema has one style instead of two — and shorter
        // names than the convention would have produced anyway.
        builder.Entity<AppUser>().ToTable("users");
        builder.Entity<IdentityRole<Guid>>().ToTable("roles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
