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
};

/** Mirrors GeorgiPeev.Web.Common.Localized. */
export type Localized = {
  bg: string;
  en: string;
};

/** Mirrors GeorgiPeev.Web.Features.Concerts.ConcertAdminListItem. */
export type ConcertAdminListItem = {
  id: string;
  slug: string;
  startsAt: string;
  venue: string;
  city: string;
  isPublished: boolean;
};

/** Mirrors GeorgiPeev.Web.Features.Concerts.ConcertAdminDetail. */
export type ConcertAdminDetail = {
  id: string;
  slug: string;
  startsAt: string;
  venue: Localized;
  city: Localized;
  note: Localized;
  description: Localized;
  ticketUrl: string | null;
  isPublished: boolean;
  /** The row version this was read at; goes back to the server on save. */
  version: number;
};

/** Mirrors GeorgiPeev.Web.Features.Concerts.ConcertInput — what the form sends. */
export type ConcertInput = {
  slug: string;
  startsAt: string;
  venue: Localized;
  city: Localized;
  note: Localized;
  description: Localized;
  ticketUrl: string | null;
  isPublished: boolean;
  /** 0 for a new concert; the loaded version for an existing one. */
  version: number;
};

/** Mirrors GeorgiPeev.Web.Features.News.NewsListItem. */
export type NewsListItem = {
  slug: string;
  publishedAt: string;
  title: string;
  summary: string;
  link: string | null;
};

/** Mirrors GeorgiPeev.Web.Features.News.NewsDetail. */
export type NewsDetail = {
  slug: string;
  publishedAt: string;
  title: string;
  summary: string;
  body: string;
  link: string | null;
};

/** Mirrors GeorgiPeev.Web.Features.News.NewsAdminListItem. */
export type NewsAdminListItem = {
  id: string;
  slug: string;
  publishedAt: string;
  title: string;
  isPublished: boolean;
};

/** Mirrors GeorgiPeev.Web.Features.News.NewsAdminDetail. */
export type NewsAdminDetail = {
  id: string;
  slug: string;
  publishedAt: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  link: string | null;
  isPublished: boolean;
  version: number;
};

/** Mirrors GeorgiPeev.Web.Features.News.NewsInput. */
export type NewsInput = {
  slug: string;
  publishedAt: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  link: string | null;
  isPublished: boolean;
  version: number;
};