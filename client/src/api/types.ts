/**
 * Mirrors GeorgiPeev.Web.Features.Concerts.ConcertListItem.
 * Kept in step by hand — when the C# record changes, this changes too.
 */
export type ConcertListItem = {
  slug: string;
  /**
   * ISO 8601 text, not a Date. JSON has no date type, so the server sends a
   * string and parsing stays where it is visible instead of hidden in a mapper.
   */
  startsAt: string;
  venue: string;
  city: string;
  note: string;
  ticketUrl: string | null;
};

export type Lang = "bg" | "en";