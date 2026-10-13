import { timingSafeEqual } from "node:crypto";
import { readBookings } from "@/lib/booking-store";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { bookingsIcal } from "@/lib/ical";

function tokensMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function feedToken(value: string) {
  try {
    return decodeURIComponent(value).replace(/\.ics$/i, "");
  } catch {
    return "";
  }
}

export async function calendarFeed(token: string) {
  const config = await readCalendarConfig();
  if (!token || !tokensMatch(token, config.icalToken)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(bookingsIcal(await readBookings(), "Oracle of Freedom"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
