// All "today" / "how long ago" logic must go through here so it resolves in the
// club's timezone, not the server's — a server running UTC would otherwise stamp
// dates and reminders as tomorrow's for part of every day.

const CLUB_TZ = process.env.CLUB_TIMEZONE || "America/New_York";

const isoFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLUB_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const displayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date, as YYYY-MM-DD, in the club's timezone. */
export function clubTodayISO(): string {
  return isoFmt.format(new Date());
}

/** A stored Date/timestamp, as YYYY-MM-DD, in the club's timezone. */
export function toClubISODate(d: Date): string {
  return isoFmt.format(d);
}

/** MM/DD/YYYY, in the club's timezone. */
export function formatDateMDY(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return displayFmt.format(date);
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function daysSince(d: Date): number {
  return daysBetweenISO(toClubISODate(d), clubTodayISO());
}

/** "Today" / "Yesterday" / "N days ago", in the club's timezone. */
export function relativeDay(d: Date): string {
  const diff = daysSince(d);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
