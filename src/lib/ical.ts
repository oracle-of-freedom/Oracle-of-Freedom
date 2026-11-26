import type { Booking } from "@/lib/bookings";
import { guestScheduleLines, icalGuestSpan } from "@/lib/booking-time";
import { studioDateTimeToUtc } from "@/lib/availability";
import { CALENDAR_TIME_ZONE, studioTimeZone } from "@/lib/calendar-config";
import { siteUrl } from "@/lib/content";

function escape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function utc(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function compactDate(value: string) {
  return value.replace(/-/g, "");
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  let width = 75;
  while (start < bytes.length) {
    let end = Math.min(bytes.length, start + width);
    while (end > start && (bytes[end] & 0xc0) === 0x80) end -= 1;
    if (end === start) end = Math.min(bytes.length, start + width);
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    width = 74;
  }
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

function event(booking: Booking, meetingUrl: string | undefined, forGuest: boolean, studioZone: string) {
  const location = meetingUrl || booking.place;
  const locale = booking.locale === "es" || booking.locale === "pt" ? booking.locale : "en";
  const description = [
    forGuest ? guestScheduleLines(booking, locale, studioZone).join("\n") : "",
    booking.client ? `With: ${booking.client}` : "",
    booking.contact ? `Contact: ${booking.contact}` : "",
    meetingUrl && booking.place && meetingUrl !== booking.place ? booking.place : "",
    booking.notes,
  ]
    .filter(Boolean)
    .join("\n");
  const guestSpan = !booking.allDay && forGuest ? icalGuestSpan(booking, studioZone) : null;
  const dates = booking.allDay
    ? [
        `DTSTART;VALUE=DATE:${compactDate(booking.date)}`,
        `DTEND;VALUE=DATE:${compactDate(nextDate(booking.date))}`,
      ]
    : guestSpan
      ? [`DTSTART;TZID="${guestSpan.zone}":${guestSpan.start}`, `DTEND;TZID="${guestSpan.zone}":${guestSpan.end}`]
      : [
          `DTSTART:${utc(studioDateTimeToUtc(booking.date, booking.start, studioZone))}`,
          `DTEND:${utc(studioDateTimeToUtc(booking.date, booking.end, studioZone))}`,
        ];
  return [
    "BEGIN:VEVENT",
    `UID:${escape(booking.id)}@oracleoffreedom.com`,
    `DTSTAMP:${utc(new Date())}`,
    ...dates,
    `SUMMARY:${escape(booking.title)}`,
    location ? `LOCATION:${escape(location)}` : "",
    description ? `DESCRIPTION:${escape(description)}` : "",
    `STATUS:${booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    `URL:${siteUrl()}`,
    "END:VEVENT",
  ]
    .filter(Boolean)
    .map(fold)
    .join("\r\n");
}

export function bookingsIcal(
  bookings: Booking[],
  name = "Oracle of Freedom",
  meetingUrl?: string,
  options?: { forGuest?: boolean; timeZone?: string },
) {
  const studioZone = studioTimeZone({ timeZone: options?.timeZone });
  const included = bookings.filter(
    (booking) => booking.status !== "cancelled" && booking.origin !== "ical" && booking.origin !== "google",
  );
  const zones = new Map<string, string>();
  if (options?.forGuest) {
    for (const booking of included) {
      if (booking.allDay) continue;
      const span = icalGuestSpan(booking, studioZone);
      if (!zones.has(span.zone)) zones.set(span.zone, span.vtimezone);
    }
  }
  const headerZone = zones.size === 1 ? [...zones.keys()][0] : studioZone || CALENDAR_TIME_ZONE;
  const events = included.map((booking) => event(booking, meetingUrl, options?.forGuest || false, studioZone));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Oracle of Freedom//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escape(name)}`),
    `X-WR-TIMEZONE:${headerZone}`,
    "X-PUBLISHED-TTL:PT1H",
    ...zones.values(),
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function icalResponse(calendar: string, filename: string) {
  return new Response(calendar, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}
