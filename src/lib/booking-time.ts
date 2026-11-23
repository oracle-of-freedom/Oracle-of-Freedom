import { bookingCopy } from "@/content/booking";
import type { Locale } from "@/i18n/routing";
import { lisbonDateTimeToUtc } from "@/lib/availability";
import type { Booking } from "@/lib/bookings";
import { CALENDAR_TIME_ZONE, studioTimeZone } from "@/lib/calendar-config";
import { zonedZoneName } from "@/lib/visitor-time";

const ZONE_ID = /^[A-Za-z0-9_+/-]{1,80}$/;

type Wall = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

export function canonicalTimeZone(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const zone = value.trim();
  if (!ZONE_ID.test(zone)) return undefined;
  try {
    const canonical = new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
    if (!canonical || !ZONE_ID.test(canonical)) return undefined;
    return canonical;
  } catch {
    return undefined;
  }
}

export function bookingTimeZone(booking: { timeZone?: string }, studioZone = CALENDAR_TIME_ZONE) {
  return canonicalTimeZone(booking.timeZone) || studioTimeZone({ timeZone: studioZone });
}

function bookingLocale(locale: Booking["locale"] | Locale | undefined): Locale {
  return locale === "es" || locale === "pt" ? locale : "en";
}

function dateLocale(locale: Locale) {
  if (locale === "pt") return "pt-PT";
  if (locale === "es") return "es-ES";
  return "en-GB";
}

function wallClock(instant: Date, timeZone: string): Wall {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour") === "24" ? "00" : pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

export function zoneOffset(instant: Date, timeZone: string) {
  const wall = wallClock(instant, timeZone);
  const asUtc = Date.UTC(
    Number(wall.year),
    Number(wall.month) - 1,
    Number(wall.day),
    Number(wall.hour),
    Number(wall.minute),
    Number(wall.second),
  );
  const minutes = Math.round((asUtc - instant.getTime()) / 60000);
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}${String(abs % 60).padStart(2, "0")}`;
}

export function zonedDateTimeToUtc(date: string, time: string, timeZone: string) {
  const zone = canonicalTimeZone(timeZone) || CALENDAR_TIME_ZONE;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = new Date(desired);
  for (let pass = 0; pass < 3; pass += 1) {
    const wall = wallClock(candidate, zone);
    const represented = Date.UTC(
      Number(wall.year),
      Number(wall.month) - 1,
      Number(wall.day),
      Number(wall.hour),
      Number(wall.minute),
      Number(wall.second),
    );
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

function clock(instant: Date, timeZone: string) {
  const wall = wallClock(instant, timeZone);
  return `${wall.hour}:${wall.minute}`;
}

function longDate(instant: Date, locale: Locale, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(instant);
}

export function formatWhen(
  booking: Pick<Booking, "date" | "start" | "end" | "allDay">,
  timeZone: string,
  locale: Locale,
  studioZone = CALENDAR_TIME_ZONE,
) {
  const zone = canonicalTimeZone(timeZone) || studioTimeZone({ timeZone: studioZone });
  const wallZone = studioTimeZone({ timeZone: studioZone });
  const copy = bookingCopy[locale] || bookingCopy.en;
  if (booking.allDay) {
    const noon = lisbonDateTimeToUtc(booking.date, "12:00", wallZone);
    return `${longDate(noon, locale, zone)} (${zonedZoneName(dateLocale(locale), zone, noon)})`;
  }
  const start = lisbonDateTimeToUtc(booking.date, booking.start, wallZone);
  const end = lisbonDateTimeToUtc(booking.date, booking.end, wallZone);
  const startDate = longDate(start, locale, zone);
  const endDate = longDate(end, locale, zone);
  const range =
    startDate === endDate
      ? `${startDate}, ${clock(start, zone)} ${copy.timeTo} ${clock(end, zone)}`
      : `${startDate}, ${clock(start, zone)} ${copy.timeTo} ${endDate}, ${clock(end, zone)}`;
  return `${range} (${zonedZoneName(dateLocale(locale), zone, start)})`;
}

export function guestScheduleLines(booking: Booking, locale: Locale, studioZone = CALENDAR_TIME_ZONE) {
  const resolved = bookingLocale(locale);
  const copy = bookingCopy[resolved];
  const wallZone = studioTimeZone({ timeZone: studioZone });
  const guestZone = bookingTimeZone(booking, wallZone);
  const lines = [copy.whenLine.replace("{when}", formatWhen(booking, guestZone, resolved, wallZone))];
  if (guestZone !== wallZone) {
    lines.push(`[${copy.studioTimeLine.replace("{when}", formatWhen(booking, wallZone, resolved, wallZone))}]`);
  }
  return lines;
}

export function guestHoldText(booking: Booking, locale: Locale, studioZone = CALENDAR_TIME_ZONE) {
  const resolved = bookingLocale(locale);
  const copy = bookingCopy[resolved];
  return [copy.successBody, "", ...guestScheduleLines(booking, resolved, studioZone), "", copy.signOff].join("\n");
}

export function guestConfirmedText(booking: Booking, meetingUrl: string, studioZone = CALENDAR_TIME_ZONE) {
  const resolved = bookingLocale(booking.locale);
  const copy = bookingCopy[resolved];
  const lines = [copy.acceptedBody, "", ...guestScheduleLines(booking, resolved, studioZone), "", booking.title];
  if (meetingUrl) lines.push("", `${copy.joinMeeting}: ${meetingUrl}`);
  lines.push("", copy.signOff);
  return lines.join("\n");
}

export function studioWhenLines(booking: Booking, studioZone = CALENDAR_TIME_ZONE) {
  const wallZone = studioTimeZone({ timeZone: studioZone });
  return [
    `Guest time: ${formatWhen(booking, bookingTimeZone(booking, wallZone), "en", wallZone)}`,
    `Studio time: ${formatWhen(booking, wallZone, "en", wallZone)}`,
  ];
}

export function googleTimedBound(date: string, time: string, timeZone?: string, studioZone = CALENDAR_TIME_ZONE) {
  const wallZone = studioTimeZone({ timeZone: studioZone });
  const instant = lisbonDateTimeToUtc(date, time, wallZone);
  const guestZone = canonicalTimeZone(timeZone);
  if (guestZone && guestZone !== wallZone) {
    const wall = wallClock(instant, guestZone);
    return {
      dateTime: `${wall.year}-${wall.month}-${wall.day}T${wall.hour}:${wall.minute}:00`,
      timeZone: guestZone,
    };
  }
  return {
    dateTime: instant.toISOString(),
    timeZone: wallZone,
  };
}

export function parseGoogleDateTime(value: string, timeZone?: string) {
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) return new Date(value);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  if (!match) return new Date(value);
  return zonedDateTimeToUtc(match[1], match[2], timeZone || CALENDAR_TIME_ZONE);
}

function localStamp(instant: Date, timeZone: string) {
  const wall = wallClock(instant, timeZone);
  return `${wall.year}${wall.month}${wall.day}T${wall.hour}${wall.minute}00`;
}

function observance(name: "STANDARD" | "DAYLIGHT", stamp: string, offset: string) {
  return [`BEGIN:${name}`, `DTSTART:${stamp}`, `TZOFFSETFROM:${offset}`, `TZOFFSETTO:${offset}`, `END:${name}`].join(
    "\r\n",
  );
}

function vtimezone(zone: string, start: Date, end: Date) {
  const startOffset = zoneOffset(start, zone);
  const endOffset = zoneOffset(end, zone);
  const blocks =
    startOffset === endOffset
      ? [observance("STANDARD", "19700101T000000", startOffset)]
      : [observance("STANDARD", localStamp(start, zone), startOffset), observance("DAYLIGHT", localStamp(end, zone), endOffset)];
  return ["BEGIN:VTIMEZONE", `TZID:${zone}`, ...blocks, "END:VTIMEZONE"].join("\r\n");
}

export function icalGuestSpan(
  booking: Pick<Booking, "date" | "start" | "end" | "timeZone">,
  studioZone = CALENDAR_TIME_ZONE,
) {
  const wallZone = studioTimeZone({ timeZone: studioZone });
  const zone = bookingTimeZone(booking, wallZone);
  const start = lisbonDateTimeToUtc(booking.date, booking.start, wallZone);
  const end = lisbonDateTimeToUtc(booking.date, booking.end, wallZone);
  return {
    zone,
    start: localStamp(start, zone),
    end: localStamp(end, zone),
    vtimezone: vtimezone(zone, start, end),
  };
}
