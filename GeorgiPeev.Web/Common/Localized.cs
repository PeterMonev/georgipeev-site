namespace GeorgiPeev.Web.Common;

/// <summary>
/// A piece of visitor-facing text in both site languages.
/// EF maps this as an owned type: two columns on the owner's own table
/// (venue_bg, venue_en) — not a separate table, not a join.
/// </summary>
public sealed record Localized(string Bg, string En);           
