namespace GeorgiPeev.Web.Tests.Infrastructure;

/// <summary>
/// One TestApp — one container, one server — for every test class that joins
/// this collection, instead of one per class. Classes in a collection run one
/// after another, which is fine: the container start is the slow part.
/// </summary>
[CollectionDefinition(Name)]
public sealed class SharedApp : ICollectionFixture<TestApp>
{
    public const string Name = "app";
}
