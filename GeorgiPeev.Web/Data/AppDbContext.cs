using GeorgiPeev.Web.Features.Concerts;
using Microsoft.EntityFrameworkCore;

namespace GeorgiPeev.Web.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Concert> Concerts => Set<Concert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Picks up every IEntityTypeConfiguration in this assembly, so adding a
        // feature never means editing this file.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
