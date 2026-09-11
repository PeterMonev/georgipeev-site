/**
 * The site lives in one time zone, Europe/Sofia, whatever zone the browser
 * happens to be in. A concert typed as "19:30" is 19:30 in Sofia even when
 * Georgi enters it from a hotel in London. These two functions move between
 * that wall-clock text and the UTC instant the server stores.
 */

const zone = "Europe/Sofia";

/** "2026-12-05T17:30:00+00:00" → "2026-12-05T19:30", what <input type="datetime-local"> wants. */
export function toSofiaLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "2026-12-05T19:30" read as Sofia time → "2026-12-05T17:30:00.000Z". */
export function fromSofiaLocal(local: string): string {
  const [year, month, day, hour, minute] = local.split(/[-T:]/).map(Number);

  // Pretend the wall clock is UTC, ask what Sofia shows at that instant, and
  // the difference is Sofia's offset at that time of year — DST included.
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = (Date.parse(`${toSofiaLocal(new Date(guess).toISOString())}:00Z`) - guess) / 60_000;

  return new Date(guess - offsetMinutes * 60_000).toISOString();
}
