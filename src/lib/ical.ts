import type { Booking } from "@/lib/bookings";
import { lisbonDateTimeToUtc } from "@/lib/availability";
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

function event(booking: Booking, meetingUrl?: string) {
  const location = meetingUrl || booking.place;
  const description = [
    booking.client ? `With: ${booking.client}` : "",
    booking.contact ? `Contact: ${booking.contact}` : "",
    meetingUrl && booking.place && meetingUrl !== booking.place ? booking.place : "",
    booking.notes,
  ]
    .filter(Boolean)
    .join("\n");
  const dates = booking.allDay
    ? [
        `DTSTART;VALUE=DATE:${compactDate(booking.date)}`,
        `DTEND;VALUE=DATE:${compactDate(nextDate(booking.date))}`,
      ]
    : [
        `DTSTART:${utc(lisbonDateTimeToUtc(booking.date, booking.start))}`,
        `DTEND:${utc(lisbonDateTimeToUtc(booking.date, booking.end))}`,
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
) {
  const events = bookings
    .filter((booking) => booking.status !== "cancelled" && booking.origin !== "ical" && booking.origin !== "google")
    .map((booking) => event(booking, meetingUrl));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Oracle of Freedom//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escape(name)}`),
    "X-WR-TIMEZONE:Europe/Lisbon",
    "X-PUBLISHED-TTL:PT1H",
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
