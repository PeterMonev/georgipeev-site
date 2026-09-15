using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GeorgiPeev.Web.Data;

/// <summary>
/// Every feature with a public address has a unique index on its slug, and
/// the unique index is the one rule only the database can enforce: two
/// requests can pass every check and still collide. So nobody checks first —
/// they save, and translate the one failure they expect into the same 400
/// the validator would have produced.
/// </summary>
internal static class SlugConflict
{
    public static bool IsUniqueViolation(this DbUpdateException e) =>
        e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    public static ValidationProblem Problem() =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            ["Slug"] = ["Taken"],
        });
}
