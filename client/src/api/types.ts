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

/**
 * Mirrors GeorgiPeev.Web.Features.Concerts.ConcertDetail.
 * Same fields as the list plus description — separate here for the same reason
 * it is separate on the server: the list never carries it.
 */
export type ConcertDetail = {
  slug: string;
  startsAt: string;
  venue: string;
  city: string;
  note: string;
  description: string;
  ticketUrl: string | null;
};

export type Lang = "bg" | "en";

export type CurrentUser = {
  email: string;
}